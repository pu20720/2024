import os
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"

import torch
torch.set_num_threads(1)

from flask import Flask, Response, render_template, jsonify, send_from_directory
import cv2
import numpy as np
from models.experimental import attempt_load
from utils.general import non_max_suppression
from utils.torch_utils import select_device
from datetime import datetime
import time
import logging
import sqlite3
import base64
from collections import deque

# 初始化日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# 全局變量
model_traffic = None
model_zebra = None
device = None
cap = None
initialized = False
last_pedestrians = deque(maxlen=15)  # 增加到15幀
last_pedestrian_positions = {}  # 新增：用於追蹤每個行人的位置
pedestrian_id = 0  # 新增：用於給行人分配唯一ID

# 定義類別標籤
traffic_classes = ['traffic light', 'cross walk', 'car', 'stop line', 'motorcycle', 'bus', 'person', 'bicycle']

# 修改違規圖片存儲路徑
VIOLATION_IMAGE_DIR = 'C:/Users/user/yolov7/violations'

# 確保存儲違規圖片的目錄存在
if not os.path.exists(VIOLATION_IMAGE_DIR):
    os.makedirs(VIOLATION_IMAGE_DIR)

def scale_coords(coords, ratio, offsets, original_size):
    """將預測座標轉換回原始圖像尺寸"""
    # 移除偏移
    coords[:, [0, 2]] = coords[:, [0, 2]] - offsets[0]
    coords[:, [1, 3]] = coords[:, [1, 3]] - offsets[1]
    
    # 縮放回原始尺寸
    coords[:, :4] /= ratio
    
    # 確保座標在圖像範圍內
    coords[:, [0, 2]] = coords[:, [0, 2]].clamp(0, original_size[1])
    coords[:, [1, 3]] = coords[:, [1, 3]].clamp(0, original_size[0])
    
    return coords

def calculate_overlap(box1, box2):
    """計算兩個框的IoU和重疊面積比例"""
    x1 = max(float(box1[0]), float(box2[0]))
    y1 = max(float(box1[1]), float(box2[1]))
    x2 = min(float(box1[2]), float(box2[2]))
    y2 = min(float(box1[3]), float(box2[3]))
    
    if x2 < x1 or y2 < y1:
        return 0.0
        
    intersection = (x2 - x1) * (y2 - y1)
    box1_area = (float(box1[2]) - float(box1[0])) * (float(box1[3]) - float(box1[1]))
    box2_area = (float(box2[2]) - float(box2[0])) * (float(box2[3]) - float(box2[1]))
    
    overlap_ratio = intersection / min(box1_area, box2_area)
    return overlap_ratio

def detect_violation(pred_traffic, pred_zebra, img_size, frame):
    global last_pedestrians, last_pedestrian_positions, pedestrian_id
    violations = []
    if pred_traffic is None or pred_zebra is None:
        return violations
    
    # 當前幀檢測到的行人
    current_pedestrians = []
    current_positions = {}
    
    # 檢測行人
    if pred_traffic is not None:
        for traffic_box in pred_traffic:
            cls_idx = int(traffic_box[5])
            if cls_idx == 6:  # 行人類別
                box = traffic_box[:4].cpu().numpy()
                center = [(box[0] + box[2])/2, (box[1] + box[3])/2]
                
                # 尋找最近的已知行人
                min_dist = float('inf')
                matched_id = None
                
                for pid, pos in last_pedestrian_positions.items():
                    dist = np.sqrt((center[0] - pos[0])**2 + (center[1] - pos[1])**2)
                    if dist < min_dist and dist < 50:  # 50像素的閾值
                        min_dist = dist
                        matched_id = pid
                
                if matched_id is None:
                    matched_id = pedestrian_id
                    pedestrian_id += 1
                
                current_positions[matched_id] = center
                current_pedestrians.append((matched_id, traffic_box))
    
    # 更新行人位置記錄
    last_pedestrian_positions = current_positions
    last_pedestrians.append(current_pedestrians)
    
    # 獲取所有最近幀的行人
    all_pedestrians = []
    seen_ids = set()
    
    for frame_pedestrians in last_pedestrians:
        for pid, ped in frame_pedestrians:
            if pid not in seen_ids:
                all_pedestrians.append(ped)
                seen_ids.add(pid)
    
    # 檢測違規
    if all_pedestrians:
        for traffic_box in pred_traffic:
            cls_idx = int(traffic_box[5])
            if cls_idx in [2, 4]:  # 汽車或機車
                for pedestrian in all_pedestrians:
                    distance = calculate_distance(traffic_box[:4], pedestrian[:4])
                    distance_threshold = 250 if cls_idx == 2 else 200  # 增加檢測距離
                    
                    if distance < distance_threshold:
                        overlap = calculate_overlap(traffic_box[:4], pedestrian[:4])
                        if overlap > 0.03:  # 降低重疊閾值
                            violation_info = {
                                'vehicle_box': traffic_box[:4].cpu().numpy(),
                                'pedestrian_box': pedestrian[:4].cpu().numpy(),
                                'distance': distance,
                                'overlap': overlap
                            }
                            violations.append(violation_info)
                            break
    
    return violations

def calculate_distance(box1, box2):
    """計算兩個框的中心點距離"""
    center1 = [(box1[0] + box1[2])/2, (box1[1] + box1[3])/2]
    center2 = [(box2[0] + box2[2])/2, (box2[1] + box2[3])/2]
    return ((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)**0.5

def draw_results(frame, violations, traffic_dets, zebra_dets):
    """在幀上繪製檢測結果和違規標記"""
    # 繪製斑馬線檢測結果
    if zebra_dets is not None and len(zebra_dets):
        for det in zebra_dets:
            x1, y1, x2, y2 = map(int, det[:4])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
    
    # 繪製交通對象檢測結果
    if traffic_dets is not None and len(traffic_dets):
        for det in traffic_dets:
            x1, y1, x2, y2, conf, cls = det.cpu().numpy()
            cls_idx = int(cls)
            
            # 跳過 bus 類別（索引 5）
            if cls_idx == 5:  # bus
                continue
                
            if cls_idx < len(traffic_classes):
                x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
                label = f"{traffic_classes[cls_idx]} {conf:.2f}"
                if cls_idx in [2, 4]:  # 只顯示 car 和 motorcycle
                    color = (255, 0, 0)
                elif cls_idx == 6:  # 行人
                    color = (0, 255, 255)
                else:
                    color = (0, 255, 0)
                
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, label, (x1, y1-10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    
    # 繪製違規標記
    for v in violations:
        x1, y1, x2, y2 = map(int, v['vehicle_box'])
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
        cv2.putText(frame, "Violation", (x1, y1-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    
    return frame

def load_model(weights_path, device):
    """載入YOLOv7模型"""
    model = attempt_load(weights_path, map_location=device)
    model.eval()
    return model

def prepare_image(frame):
    """準備圖像用於YOLOv7檢測"""
    original_height, original_width = frame.shape[:2]
    img_size = 640
    ratio = min(img_size / original_width, img_size / original_height)
    new_width = int(original_width * ratio)
    new_height = int(original_height * ratio)
    resized = cv2.resize(frame, (new_width, new_height))
    canvas = np.zeros((img_size, img_size, 3), dtype=np.uint8)
    offset_x = (img_size - new_width) // 2
    offset_y = (img_size - new_height) // 2
    canvas[offset_y:offset_y+new_height, offset_x:offset_x+new_width] = resized
    img = canvas.transpose((2, 0, 1))
    img = np.ascontiguousarray(img)
    img = torch.from_numpy(img).float()
    img /= 255.0
    if img.ndimension() == 3:
        img = img.unsqueeze(0)
    return img, ratio, (offset_x, offset_y), (original_height, original_width)

def init_model():
    """初始化模型"""
    global model_traffic, model_zebra, device, initialized
    try:
        device = select_device('')
        model_traffic = load_model('C:/Users/user/yolov7/best.pt', device)
        model_zebra = load_model('C:/Users/user/yolov7/runs/train/yolov7_crosswalk5/weights/best.pt', device)
        initialized = True
        logger.info("模型初始化成功")
    except Exception as e:
        logger.error(f"模型初始化失敗: {str(e)}")
        raise

def init_database():
    """初始化資料庫"""
    conn = sqlite3.connect('violations.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS violations
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  time TEXT NOT NULL,
                  type TEXT NOT NULL,
                  location TEXT,
                  confidence REAL,
                  image TEXT)''')
    conn.commit()
    conn.close()
    logger.info("資料庫初始化成功")

def save_violation(frame, violation, cls_idx):
    """保存違規記錄到資料庫和文件系統"""
    try:
        current_time = datetime.now()
        timestamp = current_time.strftime("%Y%m%d_%H%M%S")
        
        # 保存圖片到指定目錄
        image_filename = f"violation_{timestamp}.jpg"
        image_path = os.path.join(VIOLATION_IMAGE_DIR, image_filename)
        cv2.imwrite(image_path, frame)
        
        # 將圖像編碼為base64用於資料庫存儲
        _, buffer = cv2.imencode('.jpg', frame)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # 準備違規資料
        current_time_str = current_time.strftime("%Y-%m-%d %H:%M:%S")
        vehicle_type = traffic_classes[cls_idx]
        location = "未指定位置"
        confidence = float(violation.get('overlap', 0))
        
        # 保存到資料庫
        conn = sqlite3.connect('violations.db')
        c = conn.cursor()
        c.execute('''INSERT INTO violations 
                     (time, type, location, confidence, image, image_path)
                     VALUES (?, ?, ?, ?, ?, ?)''',
                  (current_time_str, vehicle_type, location, 
                   confidence, img_base64, image_path))
        conn.commit()
        conn.close()
        
        logger.info(f"違規記錄已保存: {current_time_str} - {vehicle_type}")
        logger.info(f"圖片保存至: {image_path}")
        
    except Exception as e:
        logger.error(f"保存違規記錄時發生錯誤: {str(e)}")

def class_specific_nms(prediction, conf_thres_default=0.4, conf_thres_person=0.1, conf_thres_bus=0.8, iou_thres=0.3):
    """針對不同類別使用不同的置信度閾值進行NMS"""
    pred = prediction.clone()
    
    # 行人類別索引是6
    person_mask = (pred[..., 5] == 6)
    # bus類別索引是5
    bus_mask = (pred[..., 5] == 5)
    
    # 對行人使用較低的閾值
    pred[person_mask] *= (pred[person_mask][..., 4] >= conf_thres_person).float().unsqueeze(-1)
    # 對bus使用較高的閾值
    pred[bus_mask] *= (pred[bus_mask][..., 4] >= conf_thres_bus).float().unsqueeze(-1)
    # 對其他類別使用默認閾值
    other_mask = ~(person_mask | bus_mask)
    pred[other_mask] *= (pred[other_mask][..., 4] >= conf_thres_default).float().unsqueeze(-1)
    
    return non_max_suppression(pred, conf_thres=0.1, iou_thres=iou_thres)[0]

def generate_frames():
    """生成視頻流"""
    global cap, model_traffic, model_zebra
    
    if not initialized:
        init_model()
    
    if cap is None:
        cap = cv2.VideoCapture('C:/Users/user/yolov7/1119.mp4')
    
    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
            
        try:
            img, ratio, (offset_x, offset_y), original_size = prepare_image(frame)
            img = img.to(device)
            
            with torch.no_grad():
                # 交通檢測
                pred_traffic = model_traffic(img)[0]
                # 使用新的NMS函數，為bus類別設置更高的閾值
                pred_traffic = class_specific_nms(
                    pred_traffic,
                    conf_thres_default=0.1,  # 其他類別的閾值
                    conf_thres_bus=0.8,      # 大幅提高bus類別的閾值
                    iou_thres=0.3,
                    conf_thres_person=0.03
                )
                
                # 斑馬線檢測保持不變
                pred_zebra = model_zebra(img)[0]
                pred_zebra = non_max_suppression(pred_zebra, conf_thres=0.2, iou_thres=0.4)[0]
                
                if pred_traffic is not None and len(pred_traffic):
                    pred_traffic = scale_coords(pred_traffic, ratio, (offset_x, offset_y), original_size)
                if pred_zebra is not None and len(pred_zebra):
                    pred_zebra = scale_coords(pred_zebra, ratio, (offset_x, offset_y), original_size)
                
                # 修改這裡，傳入 frame
                violations = detect_violation(pred_traffic, pred_zebra, original_size, frame.copy())
                frame = draw_results(frame, violations, pred_traffic, pred_zebra)
            
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue
                
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                   
            time.sleep(0.03)
            
        except Exception as e:
            logger.error(f"處理幀時發生錯誤: {str(e)}")
            continue
            
    if cap is not None:
        cap.release()

@app.route('/')
def index():
    return render_template('index1.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/violations/<path:filename>')
def serve_violation_image(filename):
    return send_from_directory(VIOLATION_IMAGE_DIR, filename)

if __name__ == '__main__':
    try:
        logger.info("開始初始化...")
        init_database()
        init_model()
        logger.info("初始化完成，準備啟動Flask...")
        app.run(debug=False, threaded=True, host='0.0.0.0', port=5000)
    except Exception as e:
        logger.error(f"錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
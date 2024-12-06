import os
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"


# 確保這些設置在其他導入之前
import torch
torch.set_num_threads(1)

from flask import Flask, Response, render_template, jsonify
import cv2
import torch
import numpy as np
from models.experimental import attempt_load
from utils.general import non_max_suppression, scale_coords
from utils.torch_utils import select_device
from utils.datasets import letterbox
from datetime import datetime
import time
import logging
import os
import requests
import m3u8
from urllib.parse import urljoin
import sqlite3
import base64
import traceback


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__) #日誌紀錄

app = Flask(__name__) #Flask初始化




# 全局變量
detector = None
model = None                #儲存偵測器、模型
cap = None                  #讀取影像流
device = None               #運行模型設備(CUP、GPU)
initialized = False         #確認標記是否初始化
violations_list = []        #紀錄違規事件
video_path = None           #視頻文件路徑
model_traffic = None
model_zebra = None

# 添加顏色常量
COLORS = {
    'red': (0, 0, 255),
    'yellow': (0, 255, 255),
    'green': (0, 255, 0), 
    'light': (255, 255, 255),
    'violation': (0, 0, 255),
    'off': (128, 128, 128) 
}

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0    #網頁重載時載入最新版

class ViolationDetector:
    def __init__(self):
        self.vehicle_set = torch.empty(0)       # 車輛集合
        self.stop_line = None                   # 停止線位置
        self.traffic_light_box = None           # 紅綠燈座標
        self.STOP_LINE_THRESHOLD = 200          # 停止線閾值
        self.PEDESTRIAN_STOP_LINE_THRESHOLD = 100  # 行人的停止線閾值
        self.previous_positions = {}            # 記錄車輛之前的位置
        self.vehicle_tracking = {}              # 格式: {id: {'bbox': (x1,y1,x2,y2), 'last_seen': frame_count, 'class_id': class_id}}
        self.violation_vehicles = set()         # 違規車輛ID集合
        self.next_vehicle_id = 0               # 下一個可用的車輛ID
        self.max_disappeared = 30              # 最大消失幀數
        self.min_distance = 50                 # 最小匹配距離                # 最小匹配距離
    
    
    def save_violation(self, frame, vehicle_id, violation_type, location, confidence):
        """保存違規記錄到資料庫文件系統"""
        try:
            current_time = datetime.now()
            
            # 確保 violations 目錄存在
            violations_dir = r'C:\Users\user\yolov7\violations'
            if not os.path.exists(violations_dir):
                os.makedirs(violations_dir)

            # 保存圖片到文件系統
            img_filename = f"violation_{current_time.strftime('%Y%m%d_%H%M%S')}_{vehicle_id}.jpg"
            img_path = os.path.join(violations_dir, img_filename)
            cv2.imwrite(img_path, frame)
            
            # 連接資料庫
            conn = sqlite3.connect(r'C:\Users\user\yolov7\violations.db')
            c = conn.cursor()
            
            # 創建表格（如果不存在）
            c.execute('''CREATE TABLE IF NOT EXISTS violations
                        (id INTEGER PRIMARY KEY AUTOINCREMENT,
                         time TEXT,
                         type TEXT,
                         vehicle_id TEXT,
                         confidence REAL,
                         location TEXT,
                         image BLOB)''')
            
            # 將圖像編碼為JPEG格式
            _, img_encoded = cv2.imencode('.jpg', frame)
            img_bytes = img_encoded.tobytes()
            
            # 插入記錄
            c.execute("""
                INSERT INTO violations (time, type, vehicle_id, confidence, location, image)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (current_time.strftime("%Y-%m-%d %H:%M:%S"),
                  violation_type,
                  str(vehicle_id),
                  confidence,
                  str(location),
                  img_bytes))
            
            conn.commit()
            conn.close()
            
            print(f"違規記錄已保存: {current_time}, {violation_type}, 車輛ID: {vehicle_id}")
            
        except Exception as e:
            print(f"保存違規記錄失敗: {e}")
            traceback.print_exc()
    
        
    def set_traffic_light(self, frame):
        """一次性標定紅綠燈位置"""
        points = []
        
        # 調整顯示大小，保持原始比例
        max_display_width = 1280  # 設定最大寬度
        max_display_height = 720  # 設定最大高度
        
        # 計算縮放比例，保持長寬比
        width_ratio = max_display_width / frame.shape[1]
        height_ratio = max_display_height / frame.shape[0]
        scale = min(width_ratio, height_ratio)
        
        # 計算調整後的尺寸
        display_width = int(frame.shape[1] * scale)
        display_height = int(frame.shape[0] * scale)
        
        # 調整圖片大小
        display_frame = cv2.resize(frame, (display_width, display_height))
        
        def mouse_callback(event, x, y, flags, param):
            if event == cv2.EVENT_LBUTTONDOWN:
                # 將點擊座標轉換回原始尺寸
                orig_x = int(x / scale)
                orig_y = int(y / scale)
                points.append((orig_x, orig_y))
                
                # 在顯示幀上畫出點擊位置
                frame_copy = display_frame.copy()
                for px, py in points:
                    display_px = int(px * scale)
                    display_py = int(py * scale)
                    cv2.circle(frame_copy, (display_px, display_py), 5, (0, 255, 0), -1)
                
                if len(points) == 2:
                    x1, y1 = points[0]
                    x2, y2 = points[1]
                    self.traffic_light_box = [min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2)]
                    # 在顯示幀上畫矩形
                    display_x1 = int(min(x1, x2) * scale)
                    display_y1 = int(min(y1, y2) * scale)
                    display_x2 = int(max(x1, x2) * scale)
                    display_y2 = int(max(y1, y2) * scale)
                    cv2.rectangle(frame_copy, (display_x1, display_y1), 
                                (display_x2, display_y2), (0, 255, 0), 2)
                
                cv2.imshow('Set Traffic Light', frame_copy)
        
        cv2.namedWindow('Set Traffic Light')
        cv2.setMouseCallback('Set Traffic Light', mouse_callback)
        
        print("請點擊兩個點來框選紅綠燈區域，按ESC確認")
        while True:
            if len(points) < 2:
                cv2.imshow('Set Traffic Light', display_frame)
            if cv2.waitKey(1) & 0xFF == 27:
                break
        
        cv2.destroyAllWindows()
        return self.traffic_light_box
    
    def set_stop_line(self, frame):
        """一次性標定停止線位置"""
        points = []
        
        # 調整顯示大小，保持原始比例
        max_display_width = 1280  # 設定最大寬度
        max_display_height = 720  # 設定最大高度
        
        # 計算縮放比例，保持長寬比
        width_ratio = max_display_width / frame.shape[1]
        height_ratio = max_display_height / frame.shape[0]
        scale = min(width_ratio, height_ratio)
        
        # 計算調整後的尺寸
        display_width = int(frame.shape[1] * scale)
        display_height = int(frame.shape[0] * scale)
        
        # 調整圖片大小
        display_frame = cv2.resize(frame, (display_width, display_height))
        
        def mouse_callback(event, x, y, flags, param):
            if event == cv2.EVENT_LBUTTONDOWN:
                # 將點擊座標轉換回原始尺寸
                orig_x = int(x / scale)
                orig_y = int(y / scale)
                points.append((orig_x, orig_y))
                
                # 在顯示幀上畫出點擊位置
                frame_copy = display_frame.copy()
                for px, py in points:
                    display_px = int(px * scale)
                    display_py = int(py * scale)
                    cv2.circle(frame_copy, (display_px, display_py), 5, (0, 0, 255), -1)
                
                if len(points) == 2:
                    self.stop_line = points
                    # 在顯示幀上畫線
                    display_x1 = int(points[0][0] * scale)
                    display_y1 = int(points[0][1] * scale)
                    display_x2 = int(points[1][0] * scale)
                    display_y2 = int(points[1][1] * scale)
                    cv2.line(frame_copy, (display_x1, display_y1), 
                            (display_x2, display_y2), (0, 0, 255), 2)
                
                cv2.imshow('Set Stop Line', frame_copy)
        
        cv2.namedWindow('Set Stop Line')
        cv2.setMouseCallback('Set Stop Line', mouse_callback)
        
        print("請點擊兩個點設置停止線按ESC確認")
        while True:
            if len(points) < 2:
                cv2.imshow('Set Stop Line', display_frame)
            if cv2.waitKey(1) & 0xFF == 27:
                break
        
        cv2.destroyAllWindows()
        return self.stop_line



    def is_vehicle_stop_line(self, point, line, vehicle_id):
        """判斷車輛或行人是否越過停止線"""
        if line is None or point is None:
            return False
        
        x, y = point
        x1, y1 = line[0]
        x2, y2 = line[1]
        
        if x2 - x1 == 0:  # 垂直線
            distance = abs(x - x1)
            is_after_line = x > x1
        else:
            # 計算直線方程式 ax + by + c = 0
            a = y2 - y1
            b = x1 - x2
            c = x2*y1 - x1*y2
            
            # 計算點到直線的距離
            distance = abs(a*x + b*y + c) / ((a*a + b*b) ** 0.5)
            
            # 判斷點是否在線的"後方"
            cross_product = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
            is_after_line = cross_product < 0
        
        print(f"ID:{vehicle_id} 距離:{distance:.2f} 是否在後方:{is_after_line}")
        
        # 根據對象類型選擇不同的閾值
        threshold = self.STOP_LINE_THRESHOLD
        if vehicle_id in self.vehicle_tracking:
            if self.vehicle_tracking[vehicle_id].get('class_id') == 6:  # 行人
                threshold = self.PEDESTRIAN_STOP_LINE_THRESHOLD
                print(f"使用行人閾值: {threshold}")
        
        if distance < threshold and is_after_line:
            if vehicle_id not in self.violation_vehicles:
                print(f"檢測到違規！ID: {vehicle_id}, 距離: {distance:.2f}")
                return True
                
        return False

    def get_vehicle_id(self, bbox, frame_count, class_id):
        """改進的車輛ID追蹤方法"""
        x1, y1, x2, y2 = bbox
        center = ((x1 + x2) // 2, (y1 + y2) // 2)
        
        # 清理消失太久的車輛
        current_tracks = self.vehicle_tracking.copy()
        for v_id, v_info in current_tracks.items():
            if frame_count - v_info['last_seen'] > self.max_disappeared:
                del self.vehicle_tracking[v_id]
        
        # 尋找最佳匹配
        best_match = None
        best_score = float('inf')
        
        for v_id, v_info in self.vehicle_tracking.items():
            if v_info.get('class_id') != class_id:  # 只匹配相同類別
                continue
            
            old_center = v_info.get('center', (0, 0))
            old_bbox = v_info['bbox']
            
            # 計算距離分數
            distance = ((center[0] - old_center[0]) ** 2 + 
                       (center[1] - old_center[1]) ** 2) ** 0.5
            
            # 計算IOU分數
            iou = self.calculate_iou(bbox, old_bbox)
            
            # 綜合分數 (距離和IOU的加權組合)
            score = distance * (1 - iou)
            
            if score < best_score and distance < self.min_distance:
                best_score = score
                best_match = v_id
        
        # 更新或創建新的追蹤
        if best_match is not None:
            vehicle_id = best_match
            self.vehicle_tracking[vehicle_id].update({
                'bbox': bbox,
                'last_seen': frame_count,
                'center': center,
                'class_id': class_id
            })
        else:
            vehicle_id = self.next_vehicle_id
            self.next_vehicle_id += 1
            self.vehicle_tracking[vehicle_id] = {
                'bbox': bbox,
                'last_seen': frame_count,
                'center': center,
                'class_id': class_id
            }
        
        return vehicle_id
    
    def calculate_iou(self, box1, box2):
        """計算兩個邊界框的IOU"""
        x1_1, y1_1, x2_1, y2_1 = box1
        x1_2, y1_2, x2_2, y2_2 = box2
        
        # 計算交集區域
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)
        
        if x2_i < x1_i or y2_i < y1_i:
            return 0.0
        
        intersection = (x2_i - x1_i) * (y2_i - y1_i)
        
        # 計算各自面積
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        
        # 計算IOU
        union = area1 + area2 - intersection
        return intersection / union if union > 0 else 0

def maskColor(frame_area):
    """改進的紅綠燈顏色識別函數"""
    hsv = cv2.cvtColor(frame_area, cv2.COLOR_BGR2HSV)
    
    # 調整紅色的 HSV 範圍
    lower_red1 = np.array([0, 100, 100])      # 提高飽和度和亮度的下限
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([160, 100, 100])    # 調整色相範圍
    upper_red2 = np.array([180, 255, 255])
    
    # 調整綠色的範圍，縮小範圍避免誤判
    lower_green = np.array([45, 100, 100])    # 提高綠色的門檻
    upper_green = np.array([85, 255, 255])
    
    # 黃色範圍
    lower_yellow = np.array([20, 100, 100])
    upper_yellow = np.array([30, 255, 255])
    
    # 創建遮罩
    mask_red1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask_red2 = cv2.inRange(hsv, lower_red2, upper_red2)
    mask_red = cv2.bitwise_or(mask_red1, mask_red2)
    mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)
    mask_green = cv2.inRange(hsv, lower_green, upper_green)
    
    # 計算每種顏色的像素數量
    red = cv2.countNonZero(mask_red)
    yellow = cv2.countNonZero(mask_yellow)
    green = cv2.countNonZero(mask_green)
    
    # 添加調試信息
    print(f"紅色像素: {red}, 黃色像素: {yellow}, 綠色像素: {green}")
    
    # 增加判斷的穩定性
    max_value = max(red, yellow, green)
    threshold = 30  # 提高閾值
    
    # 只有當某個顏色明顯大於其他顏色時才判定
    if max_value < threshold:
        return (0, 0, 0)  # 如果所有顏色都很弱，返回全0
        
    # 添加差值判斷
    min_difference = 20  # 最小差值閾值
    
    if red == max_value and red > yellow + min_difference and red > green + min_difference:
        return (red, 0, 0)
    elif green == max_value and green > red + min_difference and green > yellow + min_difference:
        return (0, 0, green)
    elif yellow == max_value and yellow > red + min_difference and yellow > green + min_difference:
        return (0, yellow, 0)
    
    return (0, 0, 0)  # 如果無法明確判斷，返回全0

def validateYellow(cropped_frame):
    """驗證黃燈的輔助函數"""
    hsv = cv2.cvtColor(cropped_frame, cv2.COLOR_BGR2HSV)
    
    # 更精確的黃色範圍
    lower_yellow = np.array([20, 100, 100])
    upper_yellow = np.array([30, 255, 255])
    
    mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)
    yellow_pixels = cv2.countNonZero(mask_yellow)
    total_pixels = cropped_frame.shape[0] * cropped_frame.shape[1]
    
    # 如果黃色像素佔比超過20%，則認為是黃燈
    return yellow_pixels > (total_pixels * 0.2)

def init_model():
    global detector, model, model_traffic, model_zebra, cap, device, initialized
    if initialized:
        return

    try:
        print("1. 開始初始化模型...")
        device = select_device('')
        
        # 修改模型路徑
        traffic_model_path = 'C:/Users/user/yolov7/best.pt'
        zebra_model_path = 'C:/Users/user/yolov7/runs/train/yolov7_crosswalk5/weights/best.pt'
        video_path = 'C:/Users/user/yolov7/1119.mp4'
        
        print("正在加載交通模型...")
        model_traffic = attempt_load(traffic_model_path, map_location=device)
        model = model_traffic  # 設置主要使用的模型
        print("正在加載斑馬線模型...")
        model_zebra = attempt_load(zebra_model_path, map_location=device)
        
        # 初始化檢測器
        detector = ViolationDetector()
        
        # 初始化視頻捕獲
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"無法打開視頻文件: {video_path}")
            
        # 讀取第一幀用於標記
        ret, first_frame = cap.read()
        if ret:
            print("請標記綠燈位置...")
            detector.set_traffic_light(first_frame)
            print("請標記停止線位置...")
            detector.set_stop_line(first_frame)
        else:
            raise Exception("無法讀取視第一幀")
        
        initialized = True
        print("2. 初始化完成")
        
    except Exception as e:
        print(f"初始化過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()
        raise

def generate_frames():
    global cap, model, model_traffic, model_zebra, device, detector, violations_list
    frame_count = 0
    last_time = time.time()
    
    try:
        while True:
            try:
                # 檢查視頻捕獲
                if cap is None or not cap.isOpened():
                    print("重新初始化視頻捕獲...")
                    cap = cv2.VideoCapture('1119.mp4')
                    if not cap.isOpened():
                        print("無法打開視頻文件")
                        break
                
                # 讀取幀
                ret, frame = cap.read()
                if not ret:
                    print("重置視頻到開始")
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                
                # 計算FPS
                frame_count += 1
                if frame_count % 30 == 0:
                    current_time = time.time()
                    fps = 30 / (current_time - last_time)
                    print(f"FPS: {fps:.2f}")
                    last_time = current_time
                
                # 檢測紅綠燈顏色
                current_color = "unknown"
                if detector.traffic_light_box is not None:
                    x1, y1, x2, y2 = detector.traffic_light_box
                    traffic_light_area = frame[y1:y2, x1:x2]
                    
                    if traffic_light_area.size > 0:
                        red, yellow, green = maskColor(traffic_light_area)
                        print(f"當前紅綠燈狀態: {current_color}, 紅:{red} 黃:{yellow} 綠:{green}")
                        
                        threshold = 50
                        min_difference = 20
                        
                        if red > threshold and red > yellow + min_difference and red > green + min_difference:
                            current_color = "red"
                        elif green > threshold and green > yellow + min_difference and green > red + min_difference:
                            current_color = "green"
                        elif yellow > threshold and yellow > red + min_difference and yellow > green + min_difference:
                            current_color = "yellow"
                        else:
                            if not hasattr(detector, 'previous_color'):
                                detector.previous_color = "unknown"
                            current_color = detector.previous_color
                        
                        detector.previous_color = current_color
                        color = COLORS.get(current_color, COLORS['light'])
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        cv2.putText(frame, current_color, (x1, y1-10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                
                # 繪製停止線
                if detector.stop_line:
                    cv2.line(frame, detector.stop_line[0], detector.stop_line[1], 
                            COLORS['red'], 2)
                
                # 檢測車輛和斑馬線
                img = letterbox(frame, 640, stride=32)[0]
                img = img.transpose((2, 0, 1))[::-1]
                img = np.ascontiguousarray(img)
                img = torch.from_numpy(img).to(device)
                img = img.float() / 255.0
                if img.ndimension() == 3:
                    img = img.unsqueeze(0)
                
                with torch.no_grad():
                    pred_traffic = model_traffic(img)[0]
                    pred_traffic = non_max_suppression(pred_traffic,
                                                     conf_thres=0.25,
                                                     iou_thres=0.45)
                    
                    pred_zebra = model_zebra(img)[0]
                    pred_zebra = non_max_suppression(pred_zebra,
                                                   conf_thres=0.25,
                                                   iou_thres=0.6)
                    
                    if len(pred_traffic[0]) > 0:
                        det_traffic = pred_traffic[0].clone()
                        det_traffic[:, :4] = scale_coords(img.shape[2:], det_traffic[:, :4], frame.shape).round()
                        
                        for *xyxy, conf, cls in det_traffic:
                            x1, y1, x2, y2 = map(int, xyxy)
                            bbox = [x1, y1, x2, y2]
                            class_id = int(cls)
                            
                            if class_id in [2, 3, 4, 5, 7]:  # 車輛類別
                                object_id = detector.get_vehicle_id(bbox, frame_count, class_id)
                                object_bottom_center = (int((x1 + x2) / 2), y2)
                                
                                class_name = {
                                    2: 'car',
                                    3: 'truck',
                                    4: 'motorcycle',
                                    5: 'bus',
                                    7: 'bicycle'
                                }.get(class_id, 'unknown')
                                
                                if object_id in detector.violation_vehicles:
                                    cv2.rectangle(frame, (x1, y1), (x2, y2), COLORS['violation'], 3)
                                    cv2.putText(frame, f'VIOLATION! {class_name} ID:{object_id}', 
                                              (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 
                                              0.7, COLORS['violation'], 2)
                                else:
                                    if current_color == "red" and detector.stop_line is not None:
                                        if detector.is_vehicle_stop_line(object_bottom_center, 
                                                                       detector.stop_line, object_id):
                                            detector.violation_vehicles.add(object_id)
                                            detector.save_violation(
                                                frame=frame,
                                                vehicle_id=object_id,
                                                violation_type='闖紅燈',
                                                location=object_bottom_center,
                                                confidence=float(conf)
                                            )
                                            
                                            violation_info = {
                                                'time': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                                'location': object_bottom_center,
                                                'type': '闖紅燈',
                                                'vehicle_id': object_id
                                            }
                                            violations_list.append(violation_info)
                                    
                                    cv2.rectangle(frame, (x1, y1), (x2, y2), COLORS['green'], 2)
                                    cv2.putText(frame, f'{class_name} ID:{object_id}', 
                                              (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 
                                              0.7, COLORS['green'], 2)
                            
                            elif class_id == 6:  # 行人類別
                                person_id = detector.get_vehicle_id(bbox, frame_count, class_id)
                                person_bottom_center = (int((x1 + x2) / 2), y2)
                                
                                print(f"檢測到行人 ID:{person_id}")
                                
                                if person_id in detector.violation_vehicles:
                                    cv2.rectangle(frame, (x1, y1), (x2, y2), COLORS['violation'], 3)
                                    cv2.putText(frame, f'VIOLATION! Person ID:{person_id}', 
                                              (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 
                                              0.7, COLORS['violation'], 2)
                                else:
                                    if current_color == "red" and detector.stop_line is not None:
                                        print(f"紅燈狀態下的行人位置: {person_bottom_center}")
                                        if detector.is_vehicle_stop_line(person_bottom_center, 
                                                                       detector.stop_line, person_id):
                                            print(f"行人 {person_id} 觸發違規檢測")
                                            detector.violation_vehicles.add(person_id)
                                            detector.save_violation(
                                                frame=frame,
                                                vehicle_id=person_id,
                                                violation_type='行人闖紅燈',
                                                location=person_bottom_center,
                                                confidence=float(conf)
                                            )
                                            
                                            violation_info = {
                                                'time': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                                'location': person_bottom_center,
                                                'type': '行人闖紅燈',
                                                'vehicle_id': person_id
                                            }
                                            violations_list.append(violation_info)
                                    
                                    cv2.rectangle(frame, (x1, y1), (x2, y2), COLORS['green'], 2)
                                    cv2.putText(frame, f'person ID:{person_id}', 
                                              (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 
                                              0.7, COLORS['green'], 2)
                    
                    # 處理斑馬線檢測結果
                    if len(pred_zebra[0]) > 0:
                        det_zebra = pred_zebra[0].clone()
                        det_zebra[:, :4] = scale_coords(img.shape[2:], det_zebra[:, :4], frame.shape).round()
                        
                        for *xyxy, conf, cls in det_zebra:
                            if int(cls) == 1:  # 只處理斑馬線類別
                                x1, y1, x2, y2 = map(int, xyxy)
                                cv2.rectangle(frame, (x1, y1), (x2, y2), COLORS['green'], 2)
                                cv2.putText(frame, f'crosswalk {conf:.2f}', 
                                          (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 
                                          0.7, COLORS['green'], 2)
                
                ret, buffer = cv2.imencode('.jpg', frame)
                if not ret:
                    continue
                    
                frame = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                
                time.sleep(0.03)
                
            except Exception as e:
                print(f"處理幀時發生錯誤: {str(e)}")
                print(f"當前 model 狀態: {model}")
                continue
                
    finally:
        if cap is not None:
            cap.release()

# Flask 路由
@app.route('/')
def index():
    return render_template('index1.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_violations')
def get_violations():
    return jsonify(violations_list)

if __name__ == '__main__':
    try:
        print("A. 開始初始化...")
        init_model()
        print("B. 初始化完成,準備啟動 Flask...")
        # 關閉 debug 模式
        app.run(debug=False, threaded=True, host='0.0.0.0', port=5000)
        # 或者保留 debug 模式但使用 use_reloader=False
        # app.run(debug=True, use_reloader=False, threaded=True, host='0.0.0.0', port=5000)
    except Exception as e:
        print(f"錯誤: {str(e)}")
        import traceback
        traceback.print_exc()

def check_box_overlap(box1, box2):
    """檢查兩個邊界框是否重疊
    box格式: [x1, y1, x2, y2]"""
    x1_1, y1_1, x2_1, y2_1 = box1
    x1_2, y1_2, x2_2, y2_2 = box2
    
    return not (x2_1 < x1_2 or x1_1 > x2_2 or y2_1 < y1_2 or y1_1 > y2_2)

# 可以添加後處理邏輯來優化檢測框
def optimize_crosswalk_box(box):
    x1, y1, x2, y2 = box
    # 根據圖像特徵調整框的位置和大小
    # 例如使用邊緣檢測來找到實際的斑馬線邊界
    return adjusted_box
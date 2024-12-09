from dronekit import connect, VehicleMode, LocationGlobalRelative
from pymavlink import mavutil
from ultralytics import YOLO
import cv2
import time
import math
import os

#our recognition
def extract_and_process_tracks(tracks):
    boxes = tracks[0].boxes.xyxy.cpu()
    clss = tracks[0].boxes.cls.cpu().tolist()
    if tracks and tracks[0].boxes and tracks[0].boxes.id is not None:
        track_ids = tracks[0].boxes.id.int().cpu().tolist()
    keypoints_in_pixel = tracks[0].keypoints.xy.cpu().tolist()
    #print(keypoints_in_pixel)

def exist(results):
    keypoints = results[0].keypoints.xy.cpu().tolist()
    
    if len(keypoints[0]) < 13:
        print("Keypoints length is less than 13")
        return False

    float_list = keypoints[0][5:13]  # 取第5到第12个点（共8个点）
    print("Float list:", float_list)

    # 检查是否所有值都不为None，并且x和y坐标都不为0.0
    if all(x is not None for x in float_list) and all(x[0] != 0.0 and x[1] != 0.0 for x in float_list):
        print("All keypoints are valid and non-zero")
        return True
    else:
        print("Some keypoints are invalid or zero")
        return False
    
def recognition(frame, model):
    
    #results = model(frame)

    results = model.predict(frame, conf=0.3)
    boxes = results[0].boxes.xyxy.cpu().tolist()
    if len(boxes) > 0:
        print(boxes)
        x_min, y_min, x_max, y_max  = boxes[0]
        box = (int(x_min), int(y_min), int(x_max), int(y_max))
    else:
        box = None
     # Visualize the results on the frame
    frame = results[0].plot()


    if(exist(results)):
        keypoints = results[0].keypoints.xy.cpu().tolist()
        keypoints = keypoints[0]
        right_shoulder_idx = 6
        right_elbow_idx = 8
        right_wrist_idx = 10
        right_hip_idx = 12
        left_shoulder_idx = 5
        left_elbow_idx = 7
        left_wrist_idx = 9
        left_hip_idx = 11

        #print(keypoints)
        # 取得相鄰的三個關鍵點的坐標
        p1 = (keypoints[right_shoulder_idx][0], keypoints[right_shoulder_idx][1])
        p2 = (keypoints[right_elbow_idx][0], keypoints[right_elbow_idx][1])
        p3 = (keypoints[right_wrist_idx][0], keypoints[right_wrist_idx][1])
        
        p4 = (keypoints[right_elbow_idx][0], keypoints[right_elbow_idx][1])
        p5 = (keypoints[right_shoulder_idx][0], keypoints[right_shoulder_idx][1])
        p6 = (keypoints[right_hip_idx][0], keypoints[right_hip_idx][1])

        p7 = (keypoints[left_shoulder_idx][0], keypoints[left_shoulder_idx][1])
        p8 = (keypoints[left_elbow_idx][0], keypoints[left_elbow_idx][1])
        p9 = (keypoints[left_wrist_idx][0], keypoints[left_wrist_idx][1])

        p10 = (keypoints[left_elbow_idx][0], keypoints[left_elbow_idx][1])
        p11 = (keypoints[left_shoulder_idx][0], keypoints[left_shoulder_idx][1])
        p12 = (keypoints[left_hip_idx][0], keypoints[left_hip_idx][1])

        # 計算向量
        v1 = (p1[0] - p2[0], p1[1] - p2[1])
        v2 = (p3[0] - p2[0], p3[1] - p2[1])
        
        v3 = (p4[0] - p5[0], p4[1] - p5[1])
        v4 = (p6[0] - p5[0], p6[1] - p5[1])

        v5 = (p7[0] - p8[0], p7[1] - p8[1])
        v6 = (p9[0] - p8[0], p9[1] - p8[1])

        v7 = (p10[0] - p11[0], p10[1] - p11[1])
        v8 = (p12[0] - p11[0], p12[1] - p11[1])

        # 計算兩向量的角度
        dot_product1 = v1[0]*v2[0] + v1[1]*v2[1]
        magnitude_v1_2 = math.sqrt(v1[0]**2 + v1[1]**2) * math.sqrt(v2[0]**2 + v2[1]**2)
        cos_theta1 = dot_product1 / magnitude_v1_2
        angle1 = math.acos(cos_theta1) * (180.0 / math.pi)
        
        dot_product2 = v3[0]*v4[0] + v3[1]*v4[1]
        magnitude_v3_4 = math.sqrt(v3[0]**2 + v3[1]**2) * math.sqrt(v4[0]**2 + v4[1]**2)
        cos_theta2 = dot_product2 / magnitude_v3_4
        angle2 = math.acos(cos_theta2) * (180.0 / math.pi)

        dot_product3 = v5[0]*v6[0] + v5[1]*v6[1]
        magnitude_v5_6 = math.sqrt(v5[0]**2 + v5[1]**2) * math.sqrt(v6[0]**2 + v6[1]**2)
        cos_theta3 = dot_product3 / magnitude_v5_6
        angle3 = math.acos(cos_theta3) * (180.0 / math.pi)

        dot_product4 = v7[0]*v8[0] + v7[1]*v8[1]
        magnitude_v7_8 = math.sqrt(v7[0]**2 + v7[1]**2) * math.sqrt(v8[0]**2 + v8[1]**2)
        cos_theta4 = dot_product4 / magnitude_v7_8
        angle4 = math.acos(cos_theta4) * (180.0 / math.pi)

         # 顯示角度在右肩、右肘、右腕的位置
       
        # 檢測手臂的動作方向
        #右手肘，右肩膀
        
        if  130 <= angle1 <= 180 and 60 <= angle2 <= 120 and 130 <= angle3 <= 180 and 0 <= angle4 <= 60:
            print("left")
            return "left", (0,1,0,2) , frame, box
        if 130 <= angle1 <= 180 and 0 <= angle2 <= 60 and 130 <= angle3 <= 180 and 60 <= angle4 <= 120:
            print("right")
            return "right", (0,-1,0,2) , frame, box
        if 130 <= angle1 <= 180 and 60 <= angle2 <= 130 and 130 <= angle3 <= 180 and 60 <= angle4 <= 130:
            print("foward")
            return "forward", (-1,0,0,2), frame, box
        if 130 <= angle1 <= 180 and 120 <= angle2 <= 180 and 130 <= angle3 <= 180 and 120 <= angle4 <= 180:
            print("down")
            return "down", (0,0,0,3), frame, box
        if 130 <= angle1 <= 180 and 0 <= angle2 <= 60 and 130 <= angle3 <= 180 and 0 <= angle4 <= 60:
            print("stop")
            return "stop", (0,0,0,2), frame, box
        if 50 <= angle1 <= 130 and 60 <= angle2 <= 120 and 60 <= angle3 <= 130 and 50 <= angle4 <= 120:
            print("back")
            return "back", (1,0,0,2), frame, box
        if 130 <= angle1 <= 180 and 45 <= angle2 <= 180 and 130 <= angle3 <= 180 and 0 <= angle4 <= 60:
            print("land")
            return "land", (0,0,0,3), frame, box
        else:
            print("")
            return "none", (0,0,0,0), frame, box
            
        return "none", (0,0,0,0), frame, box

    else:
        return "none", (0,0,0,0), frame, box

def resize_img(oriIMG, new_range, abs_mid):
    height, width = oriIMG.shape[:2]
    
    # Ensure new_range is a tuple of (new_height, new_width)
    new_height, new_width = new_range
    new_height, new_width = int(new_height), int(new_width)
    
    # Calculate the cropping box boundaries
    top_left_x = int(abs_mid[0] - new_width // 2)
    top_left_y = int(abs_mid[1] - new_height // 2)

    # Ensure boundaries are within the image dimensions
    top_left_x = max(0, top_left_x)
    top_left_y = max(0, top_left_y)
    bottom_right_x = min(width, top_left_x + new_width)
    bottom_right_y = min(height, top_left_y + new_height)

    # Crop the image
    cropped_or_resized_image = oriIMG[top_left_y:bottom_right_y, top_left_x:bottom_right_x]

    # Update the original coordinates to reflect the possible clipping
    top_left_xy = (top_left_x, top_left_y)
    return top_left_xy,cropped_or_resized_image

def ensure_in_range(x, y,r_x,r_y,new_wid,new_hei):
    r_edge=r_x-new_wid
    d_edge=r_y-new_hei
    if x<=0 and y<=0:
        return 0,0
    elif x>=r_edge and y<=0:
        return r_edge,0
    elif x<=0 and y>=d_edge:
        return 0,d_edge
    elif x>=r_edge and y>=d_edge:
        return r_edge,d_edge
    elif 0<=x<=r_edge and y<=0:
        return x,0
    elif x>=r_edge and 0<=y<=d_edge:
        return r_edge,y
    elif 0<=x<=r_edge and y>=d_edge:
        return x,d_edge
    elif x<=0 and 0<=y<=d_edge:
        return 0,y
    elif 0<=x<=r_edge and 0<=y<=d_edge:
        return x,y

def overlay_small_image_on_large(large_image, small_image,new_range, abs_mid):
    x_min, y_min = (abs_mid[0]-(new_range[0]//2), abs_mid[1]-(new_range[1]//2))
    large_height, large_width = large_image.shape[:2]
    small_height, small_width = small_image.shape[:2]

    # Calculate new coordinates
    x_start = x_min
    y_start = y_min

    # Ensure the new coordinates are within the bounds of the large image
    ulc_x, ulc_y = ensure_in_range(x_start, y_start, large_width, large_height, small_width, small_height)

    # Overlay small image on the large image at the calculated coordinates
    combined_image = large_image.copy()
    combined_image[int(ulc_y):int(ulc_y + small_height), int(ulc_x):int(ulc_x + small_width)] = small_image

    return combined_image

def draw_square_on_image(image, new_range=(640,640), abs_mid=(900,500), color=(0, 255, 0), thickness=2, save_path=None):
    """
    在圖片中央畫一個正方形。

    :param image_path: 原圖片的路徑。
    :param square_size: 正方形的邊長，默認為100。
    :param color: 正方形的顏色，默認為綠色 (BGR格式)。
    :param thickness: 正方形邊緣的厚度，默認為2。
    :param save_path: 處理後圖片的儲存路徑。如果為 None，則不儲存圖片。
    :return: 處理後的圖片。
    """
    
    # 確保圖片讀取成功
    if image is None:
        raise ValueError("Image not found or unable to load.")
        
    # Ensure new_range is a tuple of (new_height, new_width)
    new_height, new_width = new_range
    new_height, new_width = int(new_height), int(new_width)
    
    # Calculate the cropping box boundaries
    top_left_x = int(abs_mid[0] - new_width // 2)
    top_left_y = int(abs_mid[1] - new_height // 2)

    height, width, _ = image.shape
    bottom_right_x = top_left_x + new_range[0]
    bottom_right_y = top_left_y + new_range[1]

    # 在圖片上畫正方形
    cv2.rectangle(image, (int(top_left_x), int(top_left_y)), (int(bottom_right_x), int(bottom_right_y)), color, thickness)

    # 如果提供了儲存路徑，則儲存圖片
    if save_path:
        cv2.imwrite(save_path, image)

    # 返回處理後的圖片
    return image

def get_crop_range(box, bound_len):    
    x_min, y_min, x_max, y_max  = box
    width = x_max - x_min
    height = y_max - y_min
    range = max(width, height) + 50
    range = min(range,bound_len)
    range = (range,range)
    

    return range

def puttext(image, string):
    # Define text parameters
    string = f'detect: {string}'
    org = (50, 50)  # Bottom-left corner of the text
    fontFace = cv2.FONT_HERSHEY_SIMPLEX
    fontScale = 1
    color = (0, 255, 0)  # Green color
    thickness = 2

    # Put text on the image
    cv2.putText(image, string, org, fontFace, fontScale, color, thickness)
    return image

def puttext_status(image, string):
    # Define text parameters
    string = f'{string}'
    org = (50, 90)  # Bottom-left corner of the text
    fontFace = cv2.FONT_HERSHEY_SIMPLEX
    fontScale = 1
    color = (0, 255, 0)  # Green color
    thickness = 2

    # Put text on the image
    cv2.putText(image, string, org, fontFace, fontScale, color, thickness)
    return image


# 連接無人機
vehicle = connect('/dev/ttyACM0', wait_ready=True, baud=57600)

# 起飛函式
def arm_and_takeoff(target_altitude):
    print("起飛前檢查...")
    vehicle.mode = VehicleMode("GUIDED")
    vehicle.armed = True  # 解鎖
    #while not vehicle.armed:
        #print("等待解鎖...")
        #time.sleep(1)
    print("起飛中...")
    vehicle.simple_takeoff(target_altitude)
    while True:
        print("相對於home點的高度:", vehicle.location.global_relative_frame.alt)
        # print(take_picture())  # 拍照
        if vehicle.location.global_relative_frame.alt >= target_altitude * 0.95:
            print("到達目標高度。")
            break
        time.sleep(1)


# 送出相對速度指令的函式
def send_body_ned_velocity(velocity_x, velocity_y, velocity_z, duration = 0):
    msg = vehicle.message_factory.set_position_target_local_ned_encode(
        0, 0, 0,
        mavutil.mavlink.MAV_FRAME_BODY_NED, #本地座標
        0b0000111111000111, #補充座標說明
        0, 0, 0, 
        velocity_x, velocity_y, velocity_z,
        0, 0, 0, 
        0, 0)
    # 重複發送幾次
    for x in range(0, duration):
        vehicle.send_mavlink(msg)
        time.sleep(1)

def condition_yaw(heading, relative=True):
    """
    Send MAV_CMD_CONDITION_YAW message to point vehicle at a specified heading (in degrees).

    This method sets an absolute heading by default, but you can set the `relative` parameter
    to `True` to set yaw relative to the current yaw heading.

    By default the yaw of the vehicle will follow the direction of travel. After setting 
    the yaw using this function there is no way to return to the default yaw "follow direction 
    of travel" behaviour (https://github.com/diydrones/ardupilot/issues/2427)

    For more information see: 
    http://copter.ardupilot.com/wiki/common-mavlink-mission-command-messages-mav_cmd/#mav_cmd_condition_yaw
    """
    if relative:
        is_relative = 1 #yaw relative to direction of travel
    else:
        is_relative = 0 #yaw is an absolute angle
    # create the CONDITION_YAW command using command_long_encode()
    msg = vehicle.message_factory.command_long_encode(
        0, 0,    # target system, target component
        mavutil.mavlink.MAV_CMD_CONDITION_YAW, #command
        0, #confirmation
        heading,    # param 1, yaw in degrees
        0,          # param 2, yaw speed deg/s
        1,          # param 3, direction -1 ccw, 1 cw
        is_relative, # param 4, relative offset 1, absolute angle 0
        0, 0, 0)    # param 5 ~ 7 not used
    # send command to vehicle
    vehicle.send_mavlink(msg)

# 開始姿勢識別和移動

# 起飛至目標高度
arm_and_takeoff(10)

cap = cv2.VideoCapture(0)  # 開啟攝像頭
codec = 0x47504A4D  # MJPG
cap.set(cv2.CAP_PROP_FPS, 30.0)
cap.set(cv2.CAP_PROP_FOURCC, codec)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
cap.set(cv2.CAP_PROP_EXPOSURE, 0)

model = YOLO("yolov8m-pose.pt")

last_capture_time = time.time()
capture_interval = 7  # 每隔幾秒捕捉一次圖像
new_range=(300,300)
abs_mid=(960,540)

i = 0
vel=[0,0,0,0]
while vel[3]!=3:
        ret, image = cap.read()
        
        if not ret:
            print("無法獲取幀")
            continue

        current_time = time.time()
        if current_time - last_capture_time >= capture_interval:
            last_capture_time = current_time

            topleft, cropped = resize_img(image, new_range, abs_mid)
            com, vel, cropped, box = recognition(cropped, model)
            image = overlay_small_image_on_large(image, cropped, new_range, abs_mid)
            print(topleft)
            image = draw_square_on_image(image, new_range, abs_mid)
            image = puttext(image, com)

            # Update
            if box is None:
                send_body_ned_velocity(0, 0, 0, 1)  # Stop drone with duration 1 second

                abs_mid = (960, 540)
                image = puttext_status(image, 'roi: Middle')
            else:
                condition_yaw(0)
                send_body_ned_velocity(int(vel[0]), int(vel[1]), int(vel[2]), int(vel[3]))  # Move drone based on recognition
                x_min, y_min, x_max, y_max = box
                box_hei = y_max - y_min
                new_range = (box_hei * 3, box_hei * 3)  # Update range based on box height
                box_mid = ((x_max + x_min) / 2, (y_max + y_min) / 2)
                abs_mid = (topleft[0] + box_mid[0], topleft[1] + box_mid[1])  # Update absolute mid
                print(box_mid)
                image = puttext_status(image, 'roi: On moving')

            #image = cv2.resize(image, (800, 600))
            path = "/home/jetson/Downloads/imaaaa"
      
            if i >= 0:
            	filename = f"output_{i}.jpg"
            	cv2.imwrite(os.path.join(path,filename), image)
            	i += 1
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break  # Exit loop if 'q' is pressed

# 釋放資源
cv2.destroyAllWindows()


vehicle.mode = VehicleMode('LAND')  # 設置無人機模式為降落模式

cap.release()  # 釋放攝像頭資源
cv2.destroyAllWindows()  # 關閉所有OpenCV窗口

#!/usr/bin/env python3
"""
Hockey Video Analysis Script
Uses YOLOv8 for player detection, tracking, and pose estimation
"""

import sys
import json
import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO
from collections import defaultdict
import time

# Custom JSON encoder to handle numpy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.int32, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

def send_progress(progress, current_frame, total_frames, message):
    """Send progress update to Node.js via stdout"""
    progress_data = {
        "type": "progress",
        "progress": progress,
        "currentFrame": current_frame,
        "totalFrames": total_frames,
        "message": message
    }
    print(json.dumps(progress_data), flush=True)

def calculate_distance(point1, point2):
    """Calculate Euclidean distance between two points"""
    return np.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)

def pixels_to_meters(pixels, reference_pixels_per_meter=50):
    """Convert pixels to meters (rough estimation)"""
    # This is a rough estimation - in production, use perspective transformation
    # based on rink dimensions
    return pixels / reference_pixels_per_meter

def analyze_video(video_path, video_id, output_path):
    """
    Analyze hockey video using YOLOv8
    """
    try:
        send_progress(5, 0, 0, "Loading AI models...")
        
        # Load YOLOv8 models
        # Using YOLOv8x for best accuracy (can switch to yolov8n for speed)
        detection_model = YOLO('yolov8x.pt')  # Object detection
        pose_model = YOLO('yolov8x-pose.pt')  # Pose estimation
        
        send_progress(10, 0, 0, "Opening video file...")
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"Could not open video: {video_path}")
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = total_frames / fps if fps > 0 else 0
        
        send_progress(15, 0, total_frames, f"Video loaded: {total_frames} frames at {fps} FPS")
        
        # Data structures for tracking
        player_tracks = defaultdict(lambda: {
            'frames': [],
            'positions': [],
            'timestamps': []
        })
        
        pose_data = defaultdict(lambda: {
            'frames': []
        })
        
        events = []
        
        # Process video frame by frame
        frame_number = 0
        last_progress = 15
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_number += 1
            timestamp = frame_number / fps
            
            # Update progress every 10 frames
            if frame_number % 10 == 0:
                progress = 15 + int((frame_number / total_frames) * 70)  # 15-85%
                if progress > last_progress:
                    send_progress(
                        progress,
                        frame_number,
                        total_frames,
                        f"Analyzing frame {frame_number}/{total_frames}"
                    )
                    last_progress = progress
            
            # Run object detection with tracking
            detection_results = detection_model.track(
                frame,
                persist=True,
                classes=[0],  # person class
                conf=0.3,
                iou=0.5,
                tracker="bytetrack.yaml"
            )
            
            # Process detections
            if detection_results[0].boxes is not None and len(detection_results[0].boxes) > 0:
                boxes = detection_results[0].boxes
                
                for i, box in enumerate(boxes):
                    # Get tracking ID
                    track_id = int(box.id[0]) if box.id is not None else i
                    
                    # Get bounding box
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0])
                    
                    # Calculate center position
                    center_x = (x1 + x2) / 2
                    center_y = (y1 + y2) / 2
                    
                    # Store tracking data
                    player_tracks[track_id]['frames'].append({
                        'frameNumber': frame_number,
                        'timestamp': timestamp,
                        'bbox': {
                            'x': float(x1),
                            'y': float(y1),
                            'width': float(x2 - x1),
                            'height': float(y2 - y1)
                        },
                        'confidence': confidence,
                        'position': {
                            'x': float(center_x),
                            'y': float(center_y)
                        }
                    })
                    
                    player_tracks[track_id]['positions'].append((center_x, center_y))
                    player_tracks[track_id]['timestamps'].append(timestamp)
            
            # Run pose estimation every 5 frames (to save processing time)
            if frame_number % 5 == 0:
                pose_results = pose_model(frame, conf=0.3)
                
                if pose_results[0].keypoints is not None:
                    for person_idx, keypoints in enumerate(pose_results[0].keypoints):
                        # Try to match with tracked player
                        track_id = person_idx  # Simplified matching
                        
                        # Get keypoints
                        kp_data = keypoints.data[0].cpu().numpy()
                        
                        keypoint_list = []
                        keypoint_names = [
                            'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
                            'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
                            'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
                            'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
                        ]
                        
                        for kp_idx, kp in enumerate(kp_data):
                            if kp_idx < len(keypoint_names):
                                keypoint_list.append({
                                    'name': keypoint_names[kp_idx],
                                    'x': float(kp[0]),
                                    'y': float(kp[1]),
                                    'confidence': float(kp[2]) if len(kp) > 2 else 0.0
                                })
                        
                        # Calculate skating angle (body lean)
                        skating_angle = None
                        if len(kp_data) > 12:  # Has hip keypoints
                            left_hip = kp_data[11]
                            right_hip = kp_data[12]
                            left_shoulder = kp_data[5]
                            right_shoulder = kp_data[6]
                            
                            if all(kp[2] > 0.3 for kp in [left_hip, right_hip, left_shoulder, right_shoulder]):
                                hip_center_y = (left_hip[1] + right_hip[1]) / 2
                                shoulder_center_y = (left_shoulder[1] + right_shoulder[1]) / 2
                                hip_center_x = (left_hip[0] + right_hip[0]) / 2
                                shoulder_center_x = (left_shoulder[0] + right_shoulder[0]) / 2
                                
                                # Calculate angle
                                dy = shoulder_center_y - hip_center_y
                                dx = shoulder_center_x - hip_center_x
                                skating_angle = float(np.degrees(np.arctan2(dy, dx)))
                        
                        pose_data[track_id]['frames'].append({
                            'frameNumber': frame_number,
                            'timestamp': timestamp,
                            'keypoints': keypoint_list,
                            'posture': {
                                'skatingAngle': skating_angle,
                                'bodyBalance': 0.8  # Placeholder
                            }
                        })
        
        cap.release()
        
        send_progress(90, total_frames, total_frames, "Calculating metrics...")
        
        # Calculate metrics for each player
        player_tracking_results = []
        pose_analysis_results = []
        
        for track_id, data in player_tracks.items():
            if len(data['positions']) < 10:  # Skip tracks with too few detections
                continue
            
            # Calculate total distance
            total_distance_pixels = 0
            for i in range(1, len(data['positions'])):
                dist = calculate_distance(data['positions'][i-1], data['positions'][i])
                total_distance_pixels += dist
            
            total_distance_meters = pixels_to_meters(total_distance_pixels)
            
            # Calculate speeds
            speeds = []
            for i in range(1, len(data['positions'])):
                dist = calculate_distance(data['positions'][i-1], data['positions'][i])
                time_diff = data['timestamps'][i] - data['timestamps'][i-1]
                if time_diff > 0:
                    speed_mps = pixels_to_meters(dist) / time_diff
                    speed_kmh = speed_mps * 3.6
                    speeds.append(speed_kmh)
            
            avg_speed = np.mean(speeds) if speeds else 0
            max_speed = np.max(speeds) if speeds else 0
            time_on_ice = data['timestamps'][-1] - data['timestamps'][0] if data['timestamps'] else 0
            
            player_tracking_results.append({
                'playerId': f'player_{track_id}',
                'trackId': track_id,
                'frames': data['frames'],
                'metrics': {
                    'totalDistance': round(total_distance_meters, 2),
                    'averageSpeed': round(avg_speed, 2),
                    'maxSpeed': round(max_speed, 2),
                    'timeOnIce': round(time_on_ice, 2)
                }
            })
        
        # Compile pose analysis
        for track_id, data in pose_data.items():
            if len(data['frames']) > 0:
                pose_analysis_results.append({
                    'playerId': f'player_{track_id}',
                    'trackId': track_id,
                    'frames': data['frames']
                })
        
        # Calculate summary statistics
        total_players = len(player_tracking_results)
        avg_speed_all = np.mean([p['metrics']['averageSpeed'] for p in player_tracking_results]) if player_tracking_results else 0
        total_distance_all = sum([p['metrics']['totalDistance'] for p in player_tracking_results])
        
        send_progress(95, total_frames, total_frames, "Generating analysis report...")
        
        # Compile final results
        results = {
            'videoId': video_id,
            'totalFrames': total_frames,
            'fps': fps,
            'duration': duration,
            'playerTracking': player_tracking_results,
            'poseAnalysis': pose_analysis_results,
            'events': events,
            'summary': {
                'totalPlayers': total_players,
                'averageSpeed': round(avg_speed_all, 2),
                'totalDistance': round(total_distance_all, 2)
            }
        }
        
        # Save results
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2, cls=NumpyEncoder)
        
        send_progress(100, total_frames, total_frames, "Analysis complete!")
        
        return 0
        
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: analyze_video.py <video_path> <video_id> <output_path>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    video_id = sys.argv[2]
    output_path = sys.argv[3]
    
    exit_code = analyze_video(video_path, video_id, output_path)
    sys.exit(exit_code)


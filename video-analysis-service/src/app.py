"""
Video Analysis Microservice
Standalone service for hockey video analysis using YOLOv8
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json
import tempfile
import requests
from pathlib import Path
import cv2
from ultralytics import YOLO
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load YOLO models
print("Loading YOLO models...")
try:
    detection_model = YOLO('yolov8n.pt')  # Nano model for speed
    pose_model = YOLO('yolov8n-pose.pt')
    print("Models loaded successfully")
except Exception as e:
    print(f"Error loading models: {e}")
    detection_model = None
    pose_model = None


def download_video(url: str, output_path: str) -> bool:
    """Download video from URL"""
    try:
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Error downloading video: {e}")
        return False


def analyze_video(video_path: str, video_id: str) -> dict:
    """Analyze video and return results"""
    
    if not detection_model or not pose_model:
        return {
            "error": "Models not loaded",
            "status": "failed"
        }
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "error": "Could not open video",
            "status": "failed"
        }
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Track players across frames
    player_tracks = {}
    frame_number = 0
    
    results = {
        "videoId": video_id,
        "status": "completed",
        "metadata": {
            "fps": fps,
            "totalFrames": total_frames,
            "duration": total_frames / fps if fps > 0 else 0
        },
        "playerTracking": [],
        "poseAnalysis": [],
        "summary": {
            "totalPlayers": 0,
            "averagePlayersPerFrame": 0,
            "framesAnalyzed": 0
        }
    }
    
    total_players_detected = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_number += 1
        
        # Progress update every 10 frames
        if frame_number % 10 == 0:
            progress = int((frame_number / total_frames) * 100)
            print(json.dumps({
                "type": "progress",
                "progress": progress,
                "currentFrame": frame_number,
                "totalFrames": total_frames
            }), flush=True)
        
        # Detect persons
        detections = detection_model(frame, classes=[0], verbose=False)  # class 0 is person
        
        if len(detections) > 0 and len(detections[0].boxes) > 0:
            boxes = detections[0].boxes
            total_players_detected += len(boxes)
            
            # Track each detected person
            for i, box in enumerate(boxes):
                track_id = f"player_{i}"
                bbox = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0].cpu().numpy())
                
                if track_id not in player_tracks:
                    player_tracks[track_id] = {
                        "trackId": i,
                        "frames": [],
                        "metrics": {
                            "totalDistance": 0,
                            "averageSpeed": 0,
                            "maxSpeed": 0,
                            "timeOnIce": 0
                        }
                    }
                
                # Calculate center position
                center_x = float((bbox[0] + bbox[2]) / 2)
                center_y = float((bbox[1] + bbox[3]) / 2)
                
                player_tracks[track_id]["frames"].append({
                    "frameNumber": frame_number,
                    "timestamp": frame_number / fps if fps > 0 else 0,
                    "bbox": {
                        "x": float(bbox[0]),
                        "y": float(bbox[1]),
                        "width": float(bbox[2] - bbox[0]),
                        "height": float(bbox[3] - bbox[1])
                    },
                    "confidence": confidence,
                    "position": {"x": center_x, "y": center_y}
                })
        
        # Pose estimation (every 5 frames to save processing)
        if frame_number % 5 == 0:
            pose_results = pose_model(frame, verbose=False)
            # Process pose data if needed
    
    cap.release()
    
    # Calculate metrics for each player
    for track_id, track_data in player_tracks.items():
        frames = track_data["frames"]
        if len(frames) > 1:
            # Calculate distance traveled
            total_distance = 0
            for i in range(1, len(frames)):
                prev_pos = frames[i-1]["position"]
                curr_pos = frames[i]["position"]
                distance = np.sqrt(
                    (curr_pos["x"] - prev_pos["x"])**2 + 
                    (curr_pos["y"] - prev_pos["y"])**2
                )
                total_distance += distance
            
            # Estimate metrics (simplified)
            time_on_ice = len(frames) / fps if fps > 0 else 0
            avg_speed = (total_distance / time_on_ice) if time_on_ice > 0 else 0
            
            track_data["metrics"] = {
                "totalDistance": float(total_distance),
                "averageSpeed": float(avg_speed * 0.01),  # Convert to km/h estimate
                "maxSpeed": float(avg_speed * 0.015),
                "timeOnIce": float(time_on_ice)
            }
        
        results["playerTracking"].append(track_data)
    
    # Summary statistics
    results["summary"] = {
        "totalPlayers": len(player_tracks),
        "averagePlayersPerFrame": total_players_detected / frame_number if frame_number > 0 else 0,
        "framesAnalyzed": frame_number
    }
    
    return results


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "models_loaded": detection_model is not None and pose_model is not None,
        "timestamp": datetime.utcnow().isoformat()
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze video endpoint"""
    data = request.json
    
    if not data or 'videoUrl' not in data or 'videoId' not in data:
        return jsonify({"error": "Missing videoUrl or videoId"}), 400
    
    video_url = data['videoUrl']
    video_id = data['videoId']
    
    # Download video to temp file
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp_file:
        video_path = tmp_file.name
    
    try:
        print(f"Downloading video from {video_url}")
        if not download_video(video_url, video_path):
            return jsonify({"error": "Failed to download video"}), 500
        
        print(f"Analyzing video {video_id}")
        results = analyze_video(video_path, video_id)
        
        return jsonify(results)
    
    except Exception as e:
        print(f"Error analyzing video: {e}")
        return jsonify({"error": str(e), "status": "failed"}), 500
    
    finally:
        # Cleanup temp file
        if os.path.exists(video_path):
            os.remove(video_path)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)


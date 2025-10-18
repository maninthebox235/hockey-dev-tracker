#!/usr/bin/env python3
"""
Test script to verify YOLOv8 video analysis is working correctly
Creates a simple test video and runs analysis on it
"""

import cv2
import numpy as np
import sys
import os

def create_test_video(output_path, duration_seconds=5, fps=30):
    """
    Create a simple test video with moving circles (simulating players)
    """
    width, height = 1280, 720
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    total_frames = duration_seconds * fps
    
    # Create moving "players" (circles)
    num_players = 3
    players = []
    for i in range(num_players):
        players.append({
            'x': np.random.randint(100, width - 100),
            'y': np.random.randint(100, height - 100),
            'vx': np.random.randint(-5, 5),
            'vy': np.random.randint(-5, 5),
            'color': (np.random.randint(0, 255), np.random.randint(0, 255), np.random.randint(0, 255))
        })
    
    for frame_num in range(total_frames):
        # Create white background (ice rink)
        frame = np.ones((height, width, 3), dtype=np.uint8) * 240
        
        # Draw rink lines
        cv2.line(frame, (width//2, 0), (width//2, height), (200, 200, 200), 3)
        cv2.circle(frame, (width//2, height//2), 100, (200, 200, 200), 3)
        
        # Update and draw players
        for player in players:
            # Update position
            player['x'] += player['vx']
            player['y'] += player['vy']
            
            # Bounce off walls
            if player['x'] < 50 or player['x'] > width - 50:
                player['vx'] *= -1
            if player['y'] < 50 or player['y'] > height - 50:
                player['vy'] *= -1
            
            # Draw player (circle)
            cv2.circle(frame, (int(player['x']), int(player['y'])), 30, player['color'], -1)
            cv2.circle(frame, (int(player['x']), int(player['y'])), 30, (0, 0, 0), 2)
        
        out.write(frame)
    
    out.release()
    print(f"✓ Test video created: {output_path}")
    print(f"  Duration: {duration_seconds}s, FPS: {fps}, Frames: {total_frames}")

def test_yolo_import():
    """Test if YOLOv8 can be imported"""
    try:
        from ultralytics import YOLO
        print("✓ YOLOv8 (ultralytics) imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Failed to import YOLOv8: {e}")
        return False

def test_opencv():
    """Test if OpenCV is working"""
    try:
        version = cv2.__version__
        print(f"✓ OpenCV {version} is working")
        return True
    except Exception as e:
        print(f"✗ OpenCV error: {e}")
        return False

def test_model_download():
    """Test downloading YOLOv8 model"""
    try:
        from ultralytics import YOLO
        print("Downloading YOLOv8 detection model (this may take a minute)...")
        model = YOLO('yolov8n.pt')  # Using nano model for faster testing
        print("✓ YOLOv8 detection model downloaded")
        
        print("Downloading YOLOv8 pose model...")
        pose_model = YOLO('yolov8n-pose.pt')
        print("✓ YOLOv8 pose model downloaded")
        
        return True
    except Exception as e:
        print(f"✗ Model download failed: {e}")
        return False

def test_video_analysis(video_path):
    """Test running analysis on a video"""
    try:
        from ultralytics import YOLO
        
        print(f"\nTesting video analysis on: {video_path}")
        
        # Load model
        model = YOLO('yolov8n.pt')
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"✗ Could not open video: {video_path}")
            return False
        
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"  Video: {total_frames} frames at {fps} FPS")
        
        # Process first 10 frames as a test
        detections_count = 0
        for i in range(min(10, total_frames)):
            ret, frame = cap.read()
            if not ret:
                break
            
            results = model(frame, verbose=False)
            if results[0].boxes is not None and len(results[0].boxes) > 0:
                detections_count += len(results[0].boxes)
        
        cap.release()
        
        print(f"✓ Video analysis test completed")
        print(f"  Processed 10 frames, detected {detections_count} objects")
        return True
        
    except Exception as e:
        print(f"✗ Video analysis test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("=" * 60)
    print("Hockey Video Analysis - System Test")
    print("=" * 60)
    print()
    
    # Test 1: OpenCV
    if not test_opencv():
        print("\n✗ OpenCV test failed. Cannot continue.")
        return 1
    
    # Test 2: YOLOv8 import
    if not test_yolo_import():
        print("\n✗ YOLOv8 import failed. Cannot continue.")
        return 1
    
    # Test 3: Create test video
    test_video_path = "/tmp/hockey_test_video.mp4"
    try:
        create_test_video(test_video_path, duration_seconds=3, fps=30)
    except Exception as e:
        print(f"\n✗ Failed to create test video: {e}")
        return 1
    
    # Test 4: Download models
    if not test_model_download():
        print("\n✗ Model download failed. Cannot continue.")
        return 1
    
    # Test 5: Run analysis
    if not test_video_analysis(test_video_path):
        print("\n✗ Video analysis test failed.")
        return 1
    
    # Cleanup
    if os.path.exists(test_video_path):
        os.remove(test_video_path)
        print(f"\n✓ Cleaned up test video")
    
    print("\n" + "=" * 60)
    print("✓ ALL TESTS PASSED - Video analysis system is ready!")
    print("=" * 60)
    return 0

if __name__ == "__main__":
    sys.exit(main())


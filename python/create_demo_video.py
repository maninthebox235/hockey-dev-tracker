#!/usr/bin/env python3
"""
Create a demo hockey video for testing the analysis system
"""

import cv2
import numpy as np
import sys

def create_demo_hockey_video(output_path, duration_seconds=10, fps=30):
    """
    Create a realistic-looking hockey practice video with moving players
    """
    width, height = 1920, 1080
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    total_frames = duration_seconds * fps
    
    # Create 5 players with different starting positions and velocities
    players = []
    for i in range(5):
        angle = (i / 5) * 2 * np.pi
        radius = 300
        players.append({
            'x': width//2 + radius * np.cos(angle),
            'y': height//2 + radius * np.sin(angle),
            'vx': np.random.uniform(-3, 3),
            'vy': np.random.uniform(-3, 3),
            'color': (0, 0, 255) if i < 2 else (255, 0, 0),  # Red vs Blue teams
            'number': i + 1
        })
    
    # Puck
    puck = {
        'x': width // 2,
        'y': height // 2,
        'vx': 5,
        'vy': 3
    }
    
    for frame_num in range(total_frames):
        # Create ice rink background (white with blue tint)
        frame = np.ones((height, width, 3), dtype=np.uint8) * 230
        frame[:, :, 0] = 240  # Slight blue tint for ice
        
        # Draw rink markings
        # Center line
        cv2.line(frame, (width//2, 0), (width//2, height), (200, 50, 50), 5)
        
        # Center circle
        cv2.circle(frame, (width//2, height//2), 150, (200, 50, 50), 5)
        
        # Blue lines
        cv2.line(frame, (width//4, 0), (width//4, height), (255, 100, 0), 5)
        cv2.line(frame, (3*width//4, 0), (3*width//4, height), (255, 100, 0), 5)
        
        # Face-off circles
        for x in [width//4, 3*width//4]:
            for y in [height//3, 2*height//3]:
                cv2.circle(frame, (x, y), 80, (200, 50, 50), 3)
        
        # Goals
        cv2.rectangle(frame, (50, height//2 - 80), (80, height//2 + 80), (255, 0, 0), -1)
        cv2.rectangle(frame, (width - 80, height//2 - 80), (width - 50, height//2 + 80), (255, 0, 0), -1)
        
        # Update and draw puck
        puck['x'] += puck['vx']
        puck['y'] += puck['vy']
        
        # Puck bounces
        if puck['x'] < 20 or puck['x'] > width - 20:
            puck['vx'] *= -1
        if puck['y'] < 20 or puck['y'] > height - 20:
            puck['vy'] *= -1
        
        # Draw puck (small black circle)
        cv2.circle(frame, (int(puck['x']), int(puck['y'])), 8, (0, 0, 0), -1)
        
        # Update and draw players
        for player in players:
            # Update position
            player['x'] += player['vx']
            player['y'] += player['vy']
            
            # Bounce off walls with margin
            margin = 100
            if player['x'] < margin or player['x'] > width - margin:
                player['vx'] *= -1
                player['vx'] += np.random.uniform(-0.5, 0.5)
            if player['y'] < margin or player['y'] > height - margin:
                player['vy'] *= -1
                player['vy'] += np.random.uniform(-0.5, 0.5)
            
            # Occasional direction changes (simulate skating maneuvers)
            if frame_num % 60 == 0:
                player['vx'] += np.random.uniform(-1, 1)
                player['vy'] += np.random.uniform(-1, 1)
                # Limit speed
                speed = np.sqrt(player['vx']**2 + player['vy']**2)
                if speed > 5:
                    player['vx'] = (player['vx'] / speed) * 5
                    player['vy'] = (player['vy'] / speed) * 5
            
            px, py = int(player['x']), int(player['y'])
            
            # Draw player (larger circle with jersey number)
            # Body
            cv2.circle(frame, (px, py), 35, player['color'], -1)
            cv2.circle(frame, (px, py), 35, (0, 0, 0), 3)
            
            # Head
            cv2.circle(frame, (px, py - 45), 20, (255, 220, 180), -1)
            cv2.circle(frame, (px, py - 45), 20, (0, 0, 0), 2)
            
            # Jersey number
            cv2.putText(frame, str(player['number']), (px - 12, py + 8),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            # Stick (simple line)
            stick_angle = np.arctan2(player['vy'], player['vx'])
            stick_end_x = px + int(60 * np.cos(stick_angle))
            stick_end_y = py + int(60 * np.sin(stick_angle))
            cv2.line(frame, (px, py), (stick_end_x, stick_end_y), (139, 69, 19), 4)
        
        # Add frame counter and timestamp
        cv2.putText(frame, f"Frame: {frame_num}/{total_frames}", (20, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        cv2.putText(frame, f"Time: {frame_num/fps:.1f}s", (20, 80),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        
        out.write(frame)
    
    out.release()
    print(f"Demo video created: {output_path}")
    print(f"Duration: {duration_seconds}s, FPS: {fps}, Frames: {total_frames}")
    print(f"Resolution: {width}x{height}")

if __name__ == "__main__":
    output_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/demo_hockey_practice.mp4"
    duration = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    
    create_demo_hockey_video(output_path, duration_seconds=duration)


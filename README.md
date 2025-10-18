# Hockey Development Tracker

AI-powered hockey player development tracking system with YOLOv8 computer vision video analysis.

## Features

- **Player Management**: Track player profiles, positions, and contact information
- **Season Tracking**: Organize development across multiple seasons  
- **Video Upload**: Upload practice and game footage (up to 1GB per video)
- **AI Video Analysis**: YOLOv8-powered player detection, tracking, pose estimation, and movement metrics
- **Coaching Feedback**: AI-generated insights and recommended drills
- **Modern UI**: Dark hockey-themed interface

## Tech Stack

**Frontend**: React 19, TypeScript, Tailwind CSS 4, tRPC, shadcn/ui  
**Backend**: Node.js, Express, tRPC, Drizzle ORM, MySQL  
**AI/ML**: YOLOv8, OpenCV, Python 3.11

## Quick Start

```bash
git clone https://github.com/maninthebox235/hockey-dev-tracker.git
cd hockey-dev-tracker
pnpm install
pip3 install ultralytics opencv-python numpy requests
pnpm db:push
pnpm dev
```

Visit `http://localhost:3000`

## License

MIT

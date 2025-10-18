# Hockey Development Tracker

A comprehensive web application for tracking hockey player development across seasons with AI-powered video analysis and feedback generation.

## Features

### Player Management
- Add, edit, and manage player profiles
- Track player information including position, jersey number, contact details
- Active/inactive player status tracking
- Individual player development history

### Season Management
- Create and manage hockey seasons
- Set active season for current tracking
- Track player metrics season-over-season
- Historical season data retention

### Video Analysis
- Upload practice, game, and drill footage
- Associate players with specific videos
- Video metadata management (type, date, description)
- Processing status tracking

### AI-Powered Feedback
- **Team Feedback**: Generate comprehensive team-wide analysis including:
  - What went well (team strengths)
  - Areas for improvement (tactical and technical issues)
  - Recommended drills (3-5 specific practice drills)

- **Individual Feedback**: Generate personalized player feedback including:
  - Individual strengths and good plays
  - Skills or decisions to work on
  - Position-specific recommended drills

### Player Development Tracking
- Season-by-season performance metrics
- Skill ratings (1-10 scale):
  - Skating
  - Stickhandling
  - Shooting
  - Passing
  - Defense
  - Hockey IQ
- Game statistics (goals, assists, games played)
- Strengths and areas for improvement notes

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **shadcn/ui** component library
- **Wouter** for routing
- **tRPC** for type-safe API calls

### Backend
- **Express 4** server
- **tRPC 11** for API layer
- **Drizzle ORM** for database operations
- **MySQL/TiDB** database
- **Manus AI LLM** for feedback generation

### Authentication
- Manus OAuth integration
- Session-based authentication
- Protected routes and procedures

## Getting Started

### Prerequisites
- Node.js 22.x
- MySQL or TiDB database
- Manus account for OAuth and AI features

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables (automatically configured in Manus environment)

4. Push database schema:
   ```bash
   pnpm db:push
   ```

5. Start development server:
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`

## Usage Guide

### Adding Players
1. Navigate to the **Players** page
2. Click **Add Player**
3. Fill in player information (name, position, jersey number, etc.)
4. Click **Create** to save

### Creating Seasons
1. Navigate to the **Seasons** page
2. Click **Add Season**
3. Enter season name and date range
4. Click **Create Season**
5. Set as active season if needed

### Uploading Videos
1. Navigate to the **Videos** page
2. Click **Upload Video**
3. Select video file and fill in metadata
4. Choose video type (Practice, Game, or Drill)
5. Associate with a season (optional)
6. Click **Upload**

### Generating AI Feedback
1. Open a video from the **Videos** page
2. Add players featured in the video using the sidebar
3. Choose feedback type:
   - **Team Feedback**: Click "Generate Team Feedback" for overall team analysis
   - **Individual Feedback**: Click "Generate Individual Feedback" for per-player analysis
4. View generated feedback with:
   - What went well
   - Areas for improvement
   - Recommended drills

### Tracking Player Development
1. Navigate to a player's profile
2. View season-by-season metrics
3. Update skill ratings and performance statistics
4. Add notes on strengths and areas for improvement

## Database Schema

### Core Tables
- **users**: Authentication and user management
- **players**: Player profiles and information
- **seasons**: Season definitions and tracking
- **player_season_metrics**: Per-season player statistics and ratings
- **videos**: Uploaded video metadata
- **video_players**: Association between videos and players
- **video_feedback**: AI-generated feedback for videos

## AI Feedback System

The application uses advanced language models to analyze hockey footage and generate actionable feedback:

- **Context-Aware Analysis**: Takes into account video type (practice, game, drill) and player positions
- **Structured Output**: Consistent feedback format for easy review
- **Bulk Processing**: Can generate individual feedback for multiple players simultaneously
- **Expert Coaching Perspective**: Feedback is generated from the perspective of an experienced hockey coach

## API Structure

All backend operations are exposed through type-safe tRPC procedures:

- `players.*`: Player CRUD operations
- `seasons.*`: Season management
- `metrics.*`: Player performance metrics
- `videos.*`: Video upload and management
- `feedback.*`: AI feedback generation and retrieval

## Development

### Project Structure
```
hockey-dev-tracker/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable UI components
│   │   └── lib/         # tRPC client setup
├── server/              # Backend Express application
│   ├── routers.ts       # tRPC procedure definitions
│   ├── db.ts            # Database query helpers
│   └── aiService.ts     # AI feedback generation
├── drizzle/             # Database schema and migrations
└── shared/              # Shared types and constants
```

### Adding New Features
1. Update database schema in `drizzle/schema.ts`
2. Run `pnpm db:push` to apply changes
3. Add database helpers in `server/db.ts`
4. Create tRPC procedures in `server/routers.ts`
5. Build UI components in `client/src/pages/`
6. Update routes in `client/src/App.tsx`

## Security

- All routes require authentication via Manus OAuth
- Protected procedures enforce user authentication
- Session-based security with HTTP-only cookies
- Input validation using Zod schemas

## Future Enhancements

Potential areas for expansion:
- Video player integration for in-app playback
- Advanced analytics and visualizations
- Team comparison and benchmarking
- Export reports to PDF
- Mobile app companion
- Real-time collaboration features
- Video annotation and timestamping
- Drill library and recommendations

## License

This project is created for hockey organizations to track player development and improve coaching effectiveness.

## Support

For issues or questions, please contact your Manus administrator or submit feedback through the platform.


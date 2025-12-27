# Monthversary Wrapped 💕

A Spotify Wrapped-style interactive website for celebrating monthversaries. Create beautiful, animated presentations with photos, stats, quotes, and heartfelt messages.

## Features

- ✨ Beautiful Spotify Wrapped-inspired design
- 📱 Mobile-first, responsive layout
- 🎬 Multiple slide types (cover, photo, stats, quote, message, closing)
- 🎨 Vibrant gradient backgrounds
- 🎵 Optional background music
- 🎊 Confetti animation on closing slide
- 👆 Touch/swipe, tap, and keyboard navigation
- 🔐 Password-protected admin panel
- 📤 Easy image uploads with compression
- 🔄 Drag-and-drop slide reordering

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Image Processing**: Sharp
- **Deployment**: Render

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Render account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd monthversary-wrapped
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```
   MONGODB_URI=mongodb+srv://...
   SESSION_SECRET=your-random-secret-key
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Admin Panel: http://localhost:3000/admin
   - Presentation: http://localhost:3000/wrapped

## Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`
5. Add your environment variables in Render dashboard

### Option 2: Manual Setup

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables:
   - `MONGODB_URI`
   - `SESSION_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `NODE_ENV=production`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `SESSION_SECRET` | Random string for session encryption | Yes |
| `ADMIN_USERNAME` | Admin login username | Yes |
| `ADMIN_PASSWORD` | Admin login password | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

## Usage Guide

### Creating Content

1. Navigate to `/admin` and log in
2. Click on a slide type to create a new slide:
   - **Cover**: Opening slide with title and optional background image
   - **Photo**: Full-screen photo with caption
   - **Stats**: Display relationship metrics (days together, dates, etc.)
   - **Quote**: Centered quote with decorative styling
   - **Message**: Longer text with optional photo
   - **Closing**: Final heartfelt message with confetti
3. Fill in the slide details and upload images if needed
4. Toggle "Publish" to make slides visible
5. Drag and drop to reorder slides
6. Preview your creation using the Preview button

### Viewing the Presentation

1. Share the `/wrapped` link with your partner
2. Navigate using:
   - Tap/click anywhere to advance
   - Tap left side to go back
   - Swipe left/right on mobile
   - Arrow keys on desktop
3. Toggle background music (if enabled) using the music button

## Project Structure

```
/project-root
  /public
    /css
      - admin.css         # Admin panel styles
      - presentation.css  # Presentation styles
    /js
      - admin.js          # Admin panel logic
      - presentation.js   # Presentation logic
  /views
    - admin.html          # Admin panel page
    - presentation.html   # Presentation page
    - login.html          # Login page
  /routes
    - adminRoutes.js      # Admin API routes
    - publicRoutes.js     # Public API routes
  /models
    - Slide.js            # Slide schema
    - Settings.js         # Settings schema
  /middleware
    - auth.js             # Authentication middleware
  /config
    - db.js               # Database connection
  - server.js             # Express server
  - package.json          # Dependencies
  - .env.example          # Environment template
  - render.yaml           # Render deployment config
```

## API Endpoints

### Admin Routes (Protected)
- `POST /api/admin/login` - Authenticate
- `POST /api/admin/logout` - End session
- `GET /api/admin/slides` - Get all slides
- `POST /api/admin/slides` - Create slide
- `PUT /api/admin/slides/:id` - Update slide
- `DELETE /api/admin/slides/:id` - Delete slide
- `POST /api/admin/upload` - Upload image
- `PUT /api/admin/reorder` - Reorder slides
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

### Public Routes
- `GET /api/slides` - Get published slides
- `GET /api/settings` - Get public settings

## Customization

### Adding New Gradient Colors

Edit the gradient classes in both CSS files:

```css
.gradient-7 { background: linear-gradient(135deg, #color1 0%, #color2 100%); }
```

And add a new button in the admin modal color picker.

### Changing Animations

Modify the keyframe animations in `presentation.css` to customize slide transitions.

## License

MIT License - Feel free to use for personal projects!

## Support

If you found this project helpful, consider giving it a ⭐!

---

Made with 💕 for celebrating love

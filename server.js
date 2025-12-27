require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const { isAuthenticated, isViewer } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Trust proxy for secure cookies on Render
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'bubu&dudu',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

// Page Routes
app.get('/', (req, res) => {
  res.redirect('/wrapped');
});

// Admin login page
app.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Viewer login page
app.get('/view-login', (req, res) => {
  if (req.session && (req.session.isViewer || req.session.isAdmin)) {
    return res.redirect('/wrapped');
  }
  res.sendFile(path.join(__dirname, 'views', 'viewer-login.html'));
});

// Admin panel (admin only)
app.get('/admin', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Presentation pages (viewer or admin)
app.get('/wrapped', isViewer, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'presentation.html'));
});

app.get('/experience', isViewer, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'presentation.html'));
});

// Preview requires admin (to preview before publishing)
app.get('/preview', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'presentation.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Error handler - handles multer and other errors
const multer = require('multer');
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Handle multer file size errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 12MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  
  // Handle custom file filter errors
  if (err.message === 'Only image and audio files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Presentation: http://localhost:${PORT}/wrapped`);
});

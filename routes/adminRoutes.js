const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const Slide = require('../models/Slide');
const Settings = require('../models/Settings');
const { isAuthenticated, verifyCredentials, verifyViewerCredentials } = require('../middleware/auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 12 * 1024 * 1024 // 12MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed'), false);
    }
  }
});

// Admin Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const isValid = await verifyCredentials(username, password);
    
    if (isValid) {
      req.session.isAdmin = true;
      req.session.username = username;
      return res.json({ success: true, message: 'Login successful' });
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// Viewer Login route (separate authentication for presentation)
router.post('/viewer-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const isValid = await verifyViewerCredentials(username, password);
    
    if (isValid) {
      req.session.isViewer = true;
      req.session.viewerUsername = username;
      return res.json({ success: true, message: 'Login successful' });
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Viewer login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check auth status
router.get('/check-auth', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ authenticated: true });
  }
  return res.json({ authenticated: false });
});

// Get all slides (admin view - includes unpublished)
router.get('/slides', isAuthenticated, async (req, res) => {
  try {
    const slides = await Slide.find().sort({ order: 1 });
    res.json(slides);
  } catch (error) {
    console.error('Error fetching slides:', error);
    res.status(500).json({ error: 'Error fetching slides' });
  }
});

// Create new slide
router.post('/slides', isAuthenticated, async (req, res) => {
  try {
    const { type, title, subtitle, content, imageUrl, backgroundColor, stats, isPublished } = req.body;
    
    // Get the highest order number
    const lastSlide = await Slide.findOne().sort({ order: -1 });
    const order = lastSlide ? lastSlide.order + 1 : 0;
    
    const slide = new Slide({
      type,
      title,
      subtitle,
      content,
      imageUrl,
      backgroundColor,
      stats,
      order,
      isPublished: isPublished || false
    });
    
    await slide.save();
    res.status(201).json(slide);
  } catch (error) {
    console.error('Error creating slide:', error);
    res.status(500).json({ error: 'Error creating slide' });
  }
});

// Update slide
router.put('/slides/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const slide = await Slide.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    if (!slide) {
      return res.status(404).json({ error: 'Slide not found' });
    }
    
    res.json(slide);
  } catch (error) {
    console.error('Error updating slide:', error);
    res.status(500).json({ error: 'Error updating slide' });
  }
});

// Delete slide
router.delete('/slides/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await Slide.findByIdAndDelete(id);
    
    if (!slide) {
      return res.status(404).json({ error: 'Slide not found' });
    }
    
    res.json({ success: true, message: 'Slide deleted successfully' });
  } catch (error) {
    console.error('Error deleting slide:', error);
    res.status(500).json({ error: 'Error deleting slide' });
  }
});

// Reorder slides
router.put('/reorder', isAuthenticated, async (req, res) => {
  try {
    const { slideIds } = req.body;
    
    if (!Array.isArray(slideIds)) {
      return res.status(400).json({ error: 'slideIds must be an array' });
    }
    
    // Update each slide's order
    const updatePromises = slideIds.map((id, index) => 
      Slide.findByIdAndUpdate(id, { order: index })
    );
    
    await Promise.all(updatePromises);
    
    res.json({ success: true, message: 'Slides reordered successfully' });
  } catch (error) {
    console.error('Error reordering slides:', error);
    res.status(500).json({ error: 'Error reordering slides' });
  }
});

// Upload image
router.post('/upload', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    let processedBuffer;
    let mimeType = req.file.mimetype;
    
    // Process image with sharp (compress and resize)
    if (req.file.mimetype.startsWith('image/')) {
      // Auto-rotate based on EXIF orientation (important for phone photos)
      // and resize while preserving aspect ratio for both portrait and landscape
      processedBuffer = await sharp(req.file.buffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(1920, 1920, { 
          fit: 'inside', // Preserve aspect ratio, fit within bounds
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();
      mimeType = 'image/jpeg';
    } else {
      processedBuffer = req.file.buffer;
    }
    
    // Convert to base64
    const base64 = `data:${mimeType};base64,${processedBuffer.toString('base64')}`;
    
    res.json({ 
      success: true, 
      imageUrl: base64,
      message: 'Image uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

// Upload audio
router.post('/upload-audio', isAuthenticated, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Convert to base64
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    res.json({ 
      success: true, 
      audioUrl: base64,
      message: 'Audio uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ error: 'Error uploading audio' });
  }
});

// Get settings
router.get('/settings', isAuthenticated, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

// Update settings
router.put('/settings', isAuthenticated, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    const { backgroundMusicUrl, backgroundMusicEnabled, siteTitle } = req.body;
    
    if (backgroundMusicUrl !== undefined) settings.backgroundMusicUrl = backgroundMusicUrl;
    if (backgroundMusicEnabled !== undefined) settings.backgroundMusicEnabled = backgroundMusicEnabled;
    if (siteTitle !== undefined) settings.siteTitle = siteTitle;
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Error updating settings' });
  }
});

// Publish/unpublish all slides
router.put('/publish-all', isAuthenticated, async (req, res) => {
  try {
    const { isPublished } = req.body;
    await Slide.updateMany({}, { isPublished });
    res.json({ success: true, message: `All slides ${isPublished ? 'published' : 'unpublished'}` });
  } catch (error) {
    console.error('Error updating publish status:', error);
    res.status(500).json({ error: 'Error updating publish status' });
  }
});

module.exports = router;

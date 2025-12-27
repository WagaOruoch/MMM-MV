const express = require('express');
const router = express.Router();
const Slide = require('../models/Slide');
const Settings = require('../models/Settings');

// Get published slides only (public view)
router.get('/slides', async (req, res) => {
  try {
    const slides = await Slide.find({ isPublished: true }).sort({ order: 1 });
    res.json(slides);
  } catch (error) {
    console.error('Error fetching public slides:', error);
    res.status(500).json({ error: 'Error fetching slides' });
  }
});

// Get public settings (music, site title)
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = { backgroundMusicUrl: '', backgroundMusicEnabled: false, siteTitle: 'Our Monthversary' };
    }
    res.json({
      backgroundMusicUrl: settings.backgroundMusicUrl,
      backgroundMusicEnabled: settings.backgroundMusicEnabled,
      siteTitle: settings.siteTitle
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

module.exports = router;

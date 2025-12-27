const bcrypt = require('bcryptjs');

// Middleware to check if user is admin
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  
  // Check if it's an API request
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  
  // Redirect to admin login page
  return res.redirect('/login');
};

// Middleware to check if user is viewer (for presentation pages)
const isViewer = (req, res, next) => {
  // Admins can also view
  if (req.session && (req.session.isViewer || req.session.isAdmin)) {
    return next();
  }
  
  // Redirect to viewer login page
  return res.redirect('/view-login');
};

// Verify admin credentials
const verifyCredentials = async (username, password) => {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (username !== adminUsername) {
    return false;
  }
  
  return password === adminPassword;
};

// Verify viewer credentials
const verifyViewerCredentials = async (username, password) => {
  const viewerUsername = process.env.VIEWER_USERNAME;
  const viewerPassword = process.env.VIEWER_PASSWORD;
  
  if (username !== viewerUsername) {
    return false;
  }
  
  return password === viewerPassword;
};

module.exports = {
  isAuthenticated,
  isViewer,
  verifyCredentials,
  verifyViewerCredentials
};

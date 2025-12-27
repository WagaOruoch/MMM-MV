const bcrypt = require('bcryptjs');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  
  // Check if it's an API request
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  
  // Redirect to login page for non-API requests
  return res.redirect('/login');
};

// Verify admin credentials
const verifyCredentials = async (username, password) => {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (username !== adminUsername) {
    return false;
  }
  
  // Direct comparison since we're using plain text password from env
  // In production, you might want to hash it
  return password === adminPassword;
};

module.exports = {
  isAuthenticated,
  verifyCredentials
};

const express = require('express');
const path = require('path');
const router = express.Router();

// Serve signup page
router.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/signup.html'));
});

// Serve login page (can be added later or redirect to signup)
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/login.html'));
});

module.exports = router;


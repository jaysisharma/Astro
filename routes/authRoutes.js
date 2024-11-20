const express = require('express');
const { register, login, logout, getProfile, updateProfile, userCount, userList, sendOtp, verifyOtp, resetPassword, updateRole } = require('../controllers/authController');
const protect = require('../middlewares/authMiddleware');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Logout user
router.post('/logout', logout);

// Get Profile
router.get('/profile/:id', protect, getProfile);



// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
});


// Update Profile

router.put('/update/:id',upload.single('profilePicture'), protect, updateProfile);

router.get('/userCount', protect, userCount);

router.get('/userList', protect, userList);

router.post('/send-otp', sendOtp);

router.post('/verify-otp', verifyOtp);

router.post('/reset-password', resetPassword);

router.put('/updateRole', protect, updateRole);


module.exports = router;

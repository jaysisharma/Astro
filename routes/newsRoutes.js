const express = require('express');
const { createNews, getAllNews } = require('../controllers/newsController'); // Ensure the path is correct
const multer = require('multer'); // Import multer if you're using it here for file uploads
const router = express.Router();
const path = require('path');


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

// POST create news
router.post('/create', upload.single('image'), createNews); // Ensure you're using upload middleware

// GET all news
router.get('/', getAllNews);

module.exports = router;

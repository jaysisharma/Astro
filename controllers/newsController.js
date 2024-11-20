const News = require('../models/newsModel');

// Create News
const createNews = async (req, res) => {
  try {
    const newsData = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      image: req.file.path, // Use the path of the uploaded file
    };

    const news = new News(newsData); // Create a new News document with the incoming data
    await news.save(); // Save to the database
    res.status(201).json(news); // Return the created news with a 201 status
  } catch (error) {
    res.status(500).json({ error: 'Failed to create news', details: error.message }); // Handle errors
  }
};

// Fetch All News
const getAllNews = async (req, res) => {
  try {
    const news = await News.find();
    res.status(200).json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export the functions
module.exports = {
  createNews,
  getAllNews,
};

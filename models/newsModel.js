const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },  // Will store image URL or path
}, {
  timestamps: true
});

module.exports = mongoose.model('News', newsSchema);

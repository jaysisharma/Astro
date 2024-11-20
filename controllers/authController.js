const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/emailService');

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

// Register a new user
exports.register = async (req, res) => {
  const { name, email, password, role} = req.body;

  // Trim and convert email to lowercase
  const formattedEmail = email.trim().toLowerCase();

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email: formattedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (password will be hashed by the pre-save hook in the model)
    const user = await User.create({
      name,
      email: formattedEmail, // Use the formatted email here
      password,
      role,
    });

    // Return user data along with JWT token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login a user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Trim and convert email to lowercase
  const formattedEmail = email.trim().toLowerCase();

  try {
    // Find user by email
    const user = await User.findOne({ email: formattedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare the entered password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    // Log the result of password comparison
    console.log("Password entered:", password);
    console.log("Hashed password in DB:", user.password);
    console.log("Password match result:", isMatch);

    if (isMatch) {
      // Return user data along with JWT token
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Logout a user
const blacklistedTokens = [];
exports.logout = (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract the token from the Authorization header

  if (token) {
    blacklistedTokens.push(token); // Add the token to the blacklist
    return res.status(200).json({ message: 'Logged out successfully' });
  } else {
    return res.status(400).json({ message: 'Token not found' });
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user data with all relevant fields
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      contact: user.contact || '',
      country: user.country || '',
      dob: user.dob || '',
      gender: user.gender || 'Other',
      profilePicture: user.profilePicture || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, contact, country, dob, gender } = req.body;

    // Handle the image file and get the file path
    const profilePicture = req.file ? req.file.path : null;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, contact, country, dob, gender, profilePicture },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// Total User Count
exports.userCount = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user count' });
  }
};

// Display All Users
exports.userList = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    // Log the received email for debugging
    console.log('Email received in request:', email);

    // Convert email to lowercase and trim spaces for consistent lookup
    const formattedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: formattedEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Set OTP expiration to 10 minutes
    user.otp = otp;
    user.otpExpiration = Date.now() + 10 * 60 * 1000;

    console.log(`Generated OTP for ${formattedEmail}: ${otp}, Expires at: ${new Date(user.otpExpiration)}`);

    await user.save();

    // Send OTP email
    await sendEmail(formattedEmail, 'Your OTP Code', `Your OTP is: ${otp}`);

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  // Convert email to lowercase and trim spaces for consistent lookup
  const formattedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: formattedEmail });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.otp.trim() !== otp.trim() || user.otpExpiration < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // Clear OTP after verification
  user.otp = null;
  user.otpExpiration = null;
  await user.save();

  res.status(200).json({ message: 'OTP verified successfully' });
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, password } = req.body;

  // Convert email to lowercase and trim spaces for consistent lookup
  const formattedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: formattedEmail });
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.password = password;
  await user.save();

  res.status(200).json({ message: 'Password reset successfully' });
};


// Update User Role (admin only)
exports.updateRole = async (req, res) => {
  const { id, role } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure only admin can update the role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Update the user's role
    user.role = role;

    // Save the updated user
    await user.save();

    res.status(200).json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


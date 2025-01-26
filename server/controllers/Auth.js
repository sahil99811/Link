const User = require("../models/User.js"); // Import User model
const bcrypt = require("bcrypt"); // Import bcrypt for password hashing
const jwt = require("jsonwebtoken"); // Import JWT for token generation

// Function to generate a JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id.toString() }, // Payload with user ID
    process.env.JWT_SECRET, // Secret key from environment variables
    { expiresIn: "24hr" } // Token expiration time
  );
};

// Helper function to send an error response
const errorResponse = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};

// Login function
const login = async (req, res) => {
  try {
    const { email, password } = req.body; // Extract email and password from request body
    const user = await User.findOne({ email: email.toLowerCase() }); // Find user by email

    // Handle case when user is not found
    if (!user) {
      return errorResponse(res, 401, "User not registered. Please sign up.");
    }

    // Compare password with stored hashed password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (isPasswordCorrect) {
      // Generate JWT token
      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        token,
        message: "Login successful",
        userId: user._id.toString(),
      });
    } else {
      return errorResponse(res, 401, "Invalid credential..");
    }
  } catch (err) {
    console.error("Login error:", err); // Log error
    errorResponse(res, 500, "Server Error Please try again.");
  }
};

// Signup function
const signup = async (req, res) => {
  try {
    const { name,mobileNo, email,confirmPassword, password } = req.body; // Extract name, email, and password from request body
    // Check if required fields are missing
    if (!name || !email || !password || !mobileNo || !confirmPassword) {
      return errorResponse(res, 400, "All fields are required");
    }
    if(confirmPassword !== password){
        return errorResponse(res,400,"Password does not match")
    }
    // Check if user with the same email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 409, "User already exists"); // Change status code to 409 Conflict
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      mobileNo:mobileNo
    });

    return res.status(201).json({
      success: true,
      message: "Signup successful",
    });
  } catch (err) {
    console.error("Signup error:", err); // Log error
    errorResponse(res, 500, "Server error. Please try again.");
  }
};

module.exports = { login, signup }; // Export login and signup functions

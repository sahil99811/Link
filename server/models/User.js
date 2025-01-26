const mongoose = require("mongoose"); // Import mongoose for MongoDB interactions

// Define the schema for the user
const userSchema = new mongoose.Schema({
  // User's name
  name: {
    type: String,
    required: true, // Name is required
  },
  // User's email
  email: {
    type: String,
    required: true, // Email is required
  },
  // User's password
  password: {
    type: String,
    required: true, // Password is required
  },
  mobileNo: {
    type: Number,
    required: true,
  },
});

// Export the user model
module.exports = mongoose.model("User", userSchema); // Export the schema as a Mongoose model

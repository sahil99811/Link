const express = require("express"); // Import the Express module
const router = express.Router(); // Create a new router object
const { login, signup } = require("../controllers/Auth"); // Import the login and signup controller functions

// Route for user login
router.post("/login", login); // POST request to /login will trigger the login function

// Route for user signup
router.post("/signup", signup); // POST request to /signup will trigger the signup function

// Export the router object so it can be used in other parts of the application
module.exports = router;


const express = require("express"); // Import the Express module
const app = express(); // Create an instance of an Express app
const { dbConnect } = require("./config/databaseConnect"); // Import the database connection function
const authRoutes = require("./routes/Auth"); // Import authentication routes
const linkRoutes = require("./routes/Link"); // Import quiz routes
const linkStatsRoutes=require('./routes/LinkStats')
const profileRoutes=require('./routes/Profile');
const device = require("express-device");
const dotenv = require("dotenv"); // Import dotenv for environment variables
const cors = require("cors"); // Import CORS middleware

dotenv.config(); // Load environment variables from a .env file
app.use(device.capture());
app.use(express.json()); // Middleware to parse JSON bodies

// Use CORS middleware
app.use(cors());

// Optionally, configure CORS options
app.use(
  cors({
    origin: "*", // Allow requests from this origin only
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allowed HTTP methods
  })
);

// Use authentication routes, prefixed with /api/v1/auth
app.use("/api/v1/auth", authRoutes);
app.use('/api/v1/link',linkRoutes);
app.use('/api/v1/linkStats',linkStatsRoutes);
app.use('/api/v1/profile',profileRoutes)

// Connect to the database
dbConnect()
  .then(() => {
    console.log("Database connected successfully");

    // Start the server on the port defined in environment variables
    const server = app.listen(process.env.PORT, () => {
      console.log("Server is started");
    });

    // Handle server startup errors
    server.on("error", (error) => {
      console.error("Server failed to start:", error);
      process.exit(1); // Exit the process with a failure code
    });
  })
  .catch((error) => {
    console.error("DB Connection Failed:", error);
    process.exit(1); // Exit the process with a failure code
  });
const jwt = require("jsonwebtoken"); // Import JWT for token verification

// Middleware function to authenticate the user using JWT
exports.auth = async (req, res, next) => {
  try {
    // Extract token from the Authorization header
    const token = req.header("Authorization").replace("Bearer ", "");

    // If JWT is missing, return 401 Unauthorized response
    if (!token) {
      return res.status(401).json({ success: false, message: `Token Missing` });
    }

    try {
      // Verifying the JWT using the secret key stored in environment variables
      const decode =jwt.verify(token, process.env.JWT_SECRET);
      console.log(decode);
      // Storing the decoded JWT payload in the request object for further use
      req.user = {userId:decode.id};
    } catch (error) {
      // If JWT verification fails, return 401 Unauthorized response
      console.log(error);
      return res
        .status(401)
        .json({
          success: false,
          message: "Token is invalid or Token is expired",
        });
    }

    // If JWT is valid, move on to the next middleware or request handler
    next();
  } catch (error) {
    // If there is an error during the authentication process, return 403 Forbidden response
    return res.status(403).json({
      success: false,
      message: `Something went wrong while validating the token`,
    });
  }
};

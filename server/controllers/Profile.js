
const Link  = require("../models/Link"); 
const LinkStats=require('../models/LinkStats')
const  User  = require("../models/User");
const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, mobileNo } = req.body; // Get new profile data from request body
    const { userId } = req.user; // Get the user ID from the authenticated user
    console.log(userId);
    // Validate the required fields
    if (!name && !email && !mobileNo) {
      return errorResponse(
        res,
        400,
        "At least one field (name, email, or mobile) is required to update."
      );
    }

    // Find the user and update their profile
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { name, email, mobileNo },
      { new: true }
    );

    if (!updatedUser) {
      return errorResponse(res, 404, "User not found.");
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Error in updating profile:", err);
    errorResponse(res, 500, "Server error. Please try again.");
  }
};
const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, "User not found.");
    }
    const userLinks = await Link.find({ userId });
    if (userLinks.length > 0) {
      const linkIds = userLinks.map((link) => link._id);
      await LinkStats.deleteMany({ linkId: { $in: linkIds } });
      await Link.deleteMany({ userId });
    }
    await User.deleteOne({ _id: userId });

    return res.status(200).json({
      success: true,
      message: "Account and associated data deleted successfully.",
    });
  } catch (err) {
    console.error("Error in deleting account:", err);
    errorResponse(res, 500, "Server error. Please try again.");
  }
};

module.exports={updateProfile,deleteAccount}
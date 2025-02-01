const { nanoid } = require("nanoid");
const UAParser = require("ua-parser-js");
const parser = new UAParser();
const Link = require("../models/Link");
const LinkStats = require("../models/LinkStats");
const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};



const getUserDeviceInfo = (req) => {
  const userAgentString = req.headers["user-agent"]; 
  parser.setUA(userAgentString); 

  const result = parser.getResult(); 

  return {
    browser: result.browser.name,
    platform: result.os.name, 
    userAgent: userAgentString,
  };
};
const createLink = async (req, res) => {
  try {
    const { url, remark, expiredAt } = req.body;
    const { userId } = req.user;
    if (!url || !remark) {
      return errorResponse(
        res,
        400,
        "Destination Url and remark cannot be empty"
      );
    }
    let userDeviceInfo = getUserDeviceInfo(req);
    console.log(userDeviceInfo)
    const uniqueID = nanoid(6);
    console.log(process.env.FRONTEND_BASE_URL)
    const shortUrl = `${process.env.FRONTEND_BASE_URL}/${uniqueID}`;
    const ipAddress = req.ip || req.headers["x-forwarded-for"];
    const userIP =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    console.log("User IP:", userIP);
    console.log(ipAddress);
    let device = userDeviceInfo.platform ? userDeviceInfo.platform : "Postman";
    await Link.create({
      url,
      shortUrl,
      userId,
      expiredAt: expiredAt ? expiredAt : null,
      userDevice: device,
      ipAddress: ipAddress == "::1" ? "127.0.0.1" : ipAddress,
      remark,
      uniqueId: uniqueID,
    });
    return res.status(201).json({
      success: true,
      message: "Link Created Successfully..",
    });
  } catch (err) {
    console.error("Signup error:", err);
    errorResponse(res, 500, "Server error. Please try again.");
  }
};
const editLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { url, remark, expiredAt } = req.body;
    const { userId } = req.user;

    // Validate inputs
    if (!url && !remark && !expiredAt) {
      return errorResponse(res, 400, "No valid fields to update.");
    }

    // Find the link
    const link = await Link.findOne({ _id: id, userId });
    if (!link) {
      return errorResponse(res, 404, "Link not found.");
    }

    // Only allow modification of 'url', 'remark', and 'expiredAt'
    const updateFields = {};
    if (url) updateFields.url = url;
    if (remark) updateFields.remark = remark;
    if (expiredAt !== undefined) updateFields.expiredAt = expiredAt;

    // Update the link
    const updatedLink = await Link.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: "Link updated successfully.",
      data: updatedLink,
    });
  } catch (err) {
    console.error("Error in editing link:", err);
    errorResponse(res, 500, "Server error. Please try again.");
  }
};
const deleteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const link = await Link.findOne({ _id: id, userId });

    if (!link) {
      return errorResponse(res, 404, "Link not found.");
    }
    await LinkStats.deleteMany({ linkId: id });
    await Link.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Link and associated stats deleted successfully.",
    });
  } catch (err) {
    console.error("Error in deleting link:", err);
    errorResponse(res, 500, "Server error. Please try again.");
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { search, timestampOrder, page = 1, limit = 10 } = req.query;
    const { userId } = req.user;
    const orderDirection = timestampOrder === "desc" ? -1 : 1;
    const query = { userId };
    if (search) {
      query.remark = { $regex: search, $options: "i" };
    }
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const links = await Link.find(query)
      .sort({ createdAt: orderDirection })
      .select("createdAt url shortUrl ipAddress userDevice remark")
      .skip(skip)
      .limit(limitNumber)
      .lean();
    const totalLink = await Link.countDocuments(query);
    return res.status(200).json({
      success: true,
      message: "Links fetched successfully.",
      data: {
        pageSize: limitNumber,
        pageNo: pageNumber,
        totalCount: totalLink,
        items: links,
      },
    });
  } catch (err) {
    console.error("Error in getAnalytics:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error. Please try again." });
  }
};

const getAllLinks = async (req, res) => {
  try {
    const {
      search,
      timestampOrder,
      statusOrder,
      page = 1,
      limit = 10,
    } = req.query;
    const { userId } = req.user;

    // Handle sorting direction for createdAt (timestampOrder)
    const timestampDirection = timestampOrder === "desc" ? -1 : 1;

    // Handle sorting direction for status (statusOrder)
    const statusDirection = statusOrder === "desc" ? -1 : 1;

    // Build the query object
    const query = { userId };

    // If search term is provided, add the remark search filter
    if (search) {
      query.remark = { $regex: search, $options: "i" }; // Case-insensitive search on 'remark'
    }

    // Pagination setup
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch links from the database
    const links = await Link.find(query)
      .sort({ createdAt: timestampDirection }) // Sorting by 'createdAt' timestamp first
      .select("_id createdAt url shortUrl ipAddress userDevice remark expiredAt") // Select necessary fields
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Check for expiry status and add 'status' field to each link
    const currentDate = new Date(); // Get current date for comparison
    const updatedLinks = links.map((link) => {
      // Determine if the link is expired (if expiredAt exists and current date is past it)
      if (link.expiredAt && currentDate > new Date(link.expiredAt)) {
        link.status = "InActive"; // Mark as inactive if expired
      } else {
        link.status = "Active"; // Otherwise, mark as active
      }
      return link;
    });
    if (statusOrder) {
      updatedLinks.sort((a, b) => {
        if (a.status === b.status) return 0;
        return (a.status === "Active" ? 1 : -1) * statusDirection;
      });
    }

    const linkIds = updatedLinks.map((link) => link._id.toString());
    console.log(linkIds);
    const clickCounts = await LinkStats.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      {
        $group: {
          _id: "$linkId",
          totalClicks: { $sum: 1 },
        },
      },
    ]);
    console.log(clickCounts);
    updatedLinks.forEach((link) => {
      const clickData = clickCounts.find(
        (click) => click._id.toString() === link._id.toString()
      );
      link.totalClicks = clickData ? clickData.totalClicks : 0;
    });
    const totalLink = await Link.countDocuments(query);
    return res.status(200).json({
      success: true,
      message: "Links fetched successfully.",
      data: {
        pageSize: limitNumber,
        pageNo: pageNumber,
        totalCount: totalLink,
        items: updatedLinks,
      },
    });
  } catch (err) {
    console.error("Error in getAllLinks:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error. Please try again." });
  }
};

const getUrl = async (req, res) => {
  try {
    const { id } = req.query;
    const link = await Link.findOne({ uniqueId: id }).select(
      "_id expiredAt url"
    );
    if (!link) {
      return errorResponse(res, 404, "Invalid link..");
    }
    const currentDate = new Date();
    if (link.expiredAt && currentDate > new Date(link.expiredAt)) {
      return errorResponse(res, 404, "Link has been expired...");
    }
    const userDevice = req.device.type;
    await LinkStats.create({ linkId: link._id, clickDevice: userDevice });
    return res.status(200).json({
      success: true,
      message: "Fetched link details.",
      url: link?.url,
    });
  } catch (err) {
    console.error("Error in updating profile:", err);
    errorResponse(res, 500, "Server error. Please try again.");
  }
};

module.exports = {
  createLink,
  editLink,
  deleteLink,
  getAnalytics,
  getAllLinks,
  getUrl,
};

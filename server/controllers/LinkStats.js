const LinkStats = require("../models/LinkStats"); // Assuming the model is in 'models/LinkStats.js'
const Link = require("../models/Link"); // Assuming the Link model

const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
const getClickStats = async (req, res) => {
  try {
    const { userId } = req.user;

    // Step 1: Get all links created by the user
    const links = await Link.find({ userId }).select("_id"); // Fetch link IDs

    // Step 2: Aggregate clicks by date and device for the links created by the user
    const result = await LinkStats.aggregate([
      {
        $match: {
          linkId: { $in: links.map((link) => link._id.toString()) },
        },
      },
      {
        $facet: {
          dateWiseClicks: [
            {
              $project: {
                day: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
              },
            },
            {
              $group: {
                _id: "$day",
                totalClicks: { $sum: 1 },
              },
            },
            {
              $sort: { totalClicks: -1 }, // Sort by totalClicks (descending)
            },
          ],
          // Aggregating clicks by device
          deviceWiseClicks: [
            {
              $group: {
                _id: "$clickDevice", // Group by clickDevice
                totalClicks: { $sum: 1 },
              },
            },
            {
              $sort: { totalClicks: -1 }, // Sort by totalClicks (descending)
            },
          ],
          // Calculate total clicks (sum of clicks across all links)
          totalClicks: [
            {
              $group: {
                _id: null, // No grouping, we just need the total count
                totalClicks: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    // Extract and map results from aggregation
    const dateWiseClicks = result[0].dateWiseClicks.map((item) => ({
      date: item._id,
      totalClicks: item.totalClicks,
    }));

    const deviceWiseClicks = result[0].deviceWiseClicks.map((item) => ({
      device: item._id,
      totalClicks: item.totalClicks,
    }));

    const totalClicks =
      result[0].totalClicks.length > 0
        ? result[0].totalClicks[0].totalClicks
        : 0;

    // Return response with click statistics
    return res.status(200).json({
      success: true,
      message: "Click statistics fetched successfully.",
      data: {
        dateWiseClicks,
        deviceWiseClicks,
        totalClicks, // Adding total clicks here
      },
    });
  } catch (err) {
    console.error("Error in getClickStats:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};


const updateClicks=async(req,res)=>{
    try{
      const {id}=req.query;
      const link = await Link.findOne({ uniqueId:id}).select("_id expiredAt url");
      if(!link){
        return errorResponse(
          res,
          404,
          "Invalid link.."
        );
      }
      const currentDate = new Date();
      if (link.expiredAt && currentDate > new Date(link.expiredAt)) {
        return errorResponse(res, 404, "Link has been expired...");
      }
      const userDevice = req.device.type;
      await LinkStats.create({linkId:link._id,clickDevice:userDevice})
      return res.status(200).json({
      success: true,
      message: "Fetched link details.",
      url: link?.url
    });
    }catch(err){
      console.error("Error in updating profile:", err);
      errorResponse(res, 500, "Server error. Please try again.");
    }
}



module.exports={getClickStats,updateClicks}
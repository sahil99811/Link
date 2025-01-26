const mongoose = require("mongoose"); 
const linkStatsSchema = new mongoose.Schema({
  linkId: {
    type: String,
    required: true,
  },
  clickDevice: {
    type: String,
    required: true,
  }
},{timestamps:true});

module.exports = mongoose.model("LinkStats", linkStatsSchema); 

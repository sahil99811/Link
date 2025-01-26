const mongoose = require("mongoose"); 
const linkSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true, 
  },
  uniqueId:{
    type:String,
    require:true
  },
  remark: {
    type: String,
    required: true,
  },
  expiredAt: {
    type: Date,
    default: null,
  },
  userDevice: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  }
},{timestamps:true});

module.exports = mongoose.model("Link", linkSchema); 

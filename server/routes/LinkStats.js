const express = require("express");
const router = express.Router();
const {
 getClickStats,
 updateClicks
} = require("../controllers/LinkStats"); 
const { auth } = require("../middlewares/Auth");

router.get('/getClickStats',auth,getClickStats);
module.exports = router;

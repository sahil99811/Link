const express = require("express"); 
const router = express.Router(); 
const { auth } = require("../middlewares/Auth");
const { updateProfile,deleteAccount,getProfile } = require("../controllers/Profile"); 

router.put("/update",auth,updateProfile); 
router.delete('/delete',auth,deleteAccount)
router.get('/',auth,getProfile);
module.exports = router;


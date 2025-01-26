const express = require("express");
const router = express.Router(); 
const { createLink,editLink,deleteLink,getAnalytics,getAllLinks,getUrl} = require("../controllers/Link"); // Import the login and signup controller functions
const {auth}=require('../middlewares/Auth');

router.post("/create",auth,createLink);
router.put('/edit/:id',auth,editLink);
router.delete('/delete/:id',auth,deleteLink);
router.get('/getAnalytics',auth,getAnalytics);
router.get('/getAllLinks',auth,getAllLinks); 
router.get('/',getUrl)
module.exports = router;

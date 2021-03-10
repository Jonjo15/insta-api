const  express = require('express');
const router = express.Router();
const passport = require("passport")
const User = require("../models/user")
const Notification = require("../models/notification")

router.use(passport.authenticate('jwt', { session: false }))
//GET 10 MOST RECENT NOTIFICATIONS FOR CURRENT USER
router.get("/", async(req, res) => {
    try {
        const notifications = await Notification.find({recipient: req.user._id, seen: false})
                                                .populate("sender", "username _id")
                                                .sort({"createdAt": -1})
                                                .limit(10)
                                              
        if(!notifications) throw Error("No notifications found")
        res.status(200).json({success: true, notifications})
    }
    catch(e) {
        res.status(400).json({success: false, msg: e.message})
    }
})
//MARK ALL NOTIFICATIONS READ
router.put("/all", async (req, res) => {
    try {
        const response = await Notification.updateMany({recipient: req.user._id, seen: false}, {seen: true})
        if(!response) throw Error("Something went wrong with updating notifications")
        res.status(200).json({success: true, response})
    }
    catch(e){
        res.status(400).json({success: false, msg: e.message})
    }
})
//MARK ONE OR MORE NOTIFICATIONS READ
router.put("/", async (req, res) => {
    try {
        const response = await Notification.updateMany({recipient: req.user._id, _id: {$in: req.body.notifications}}, {seen:true})
        if(!response) throw Error("Something went wrong with updating notifications")
        res.status(200).json({success: true, response})
    }
    catch(e) {
        res.status(400).json({success: false, msg: e.message})
    }
})
module.exports = router;
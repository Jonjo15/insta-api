var express = require('express');
var router = express.Router();
const User = require("../models/user")
const Notification = require("../models/notification")
const passport = require("passport")


router.use(passport.authenticate('jwt', { session: false }))

//SEND A FOLLOW REQUEST
router.post("/:userId", async(req, res) => {
  const following = req.user.following
  try {
        //MAKE SURE TO NOT SEND FRIEND REQUEST TO YOURSELF
        if(req.user._id.equals(req.params.userId)) throw Error("Cant send follow request to yourself")
        //FIND RECIPIENT
        const recipientUser = await User.findById(req.params.userId)
        if(!recipientUser) throw Error("User doesnt exist")
        //CHECK IF FOLLOW REQUEST ALREADY SENT
        const frIndex = recipientUser.follow_requests.findIndex((id) => String(id) === String(req.user._id))
        if (frIndex !== -1) {
            throw Error("Follow request already sent")
        }

        //CHECK IF ALREADY FRIENDS
        const index = following.findIndex((id) => String(id) === String(recipientUser._id))
        if (index === -1) {
            recipientUser.follow_requests.push(req.user._id)
        }
        else {
            throw Error("You are already friends with this user")
        }
        //SAVE FRIEND REQUEST IN RECIPIENT USER
        const updatedRecipient = await User.findByIdAndUpdate(req.params.userId, recipientUser, {new: true} ).select("-password")
        if(!updatedRecipient) throw Error("Something went wrong with saving friend request")
        res.status(200).json({success: true, updatedRecipient})
    }
    catch(e) {
        res.status(400).json({success:false, msg: e.message})
    }
})

//ACCEPT FOLLOW REQUEST
router.post("/:userId/accept", (req, res) => {
  //TODO:
})

//REJECT FOLLOW REQUEST
router.post("/:userId/reject", async(req, res) => {
  //TODO:
})

//Unfollow a user
router.post("/:userId/unfollow", async(req, res) => {
  //TODO: 
})
module.exports = router;

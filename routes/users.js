var express = require('express');
var router = express.Router();
const User = require("../models/user")
const Notification = require("../models/notification")
const passport = require("passport")


router.use(passport.authenticate('jwt', { session: false }))

//GETTING USER INFO AT REFRESH
router.get("/me", async(req, res, next) => {
    const user = await User.find({_id: req.user._id})
                            .populate("following", "username _id  profile_pic_url")
                            .populate("followers", "username _id  profile_pic_url")//TODO: REMOVE EMAIL FROM HERE
                            .populate("follow_requests", "username _id profile_pic_url")
                            .select("-password")
    res.json({success: true, user})
  })

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
router.post("/:userId/accept", async(req, res) => {
  try {
        const acceptedUser = await User.findById(req.params.userId)
        if(!acceptedUser) throw Error("User doesnt exist")
        //FIND IF THERE IS A FRIEND REQUEST IN THE USERS F.R. ARRAy
        const index = req.user.follow_requests.findIndex((id) => String(id) === String(req.params.userId))
        if (index === -1 ) throw Error("Friend request doesnt exist")

        //CHECK IF ALREDY FRIENDS
        const frIndx = req.user.followers.findIndex((id) => String(id) === String(req.params.userId)) 
        if (frIndx !== -1) throw Error("Alredy followed by this user")
        // friendRequests = friendRequests.filter()

        //REMOVE FRIEND REQUEST
        req.user.follow_requests = req.user.follow_requests.filter((id) => String(id) !== String(req.params.userId))

        //add each other in friends arrays
        req.user.followers.push(req.params.userId)
        acceptedUser.following.push(req.user._id)

        //save the documents
        const updatedUser = await User.findByIdAndUpdate(req.user._id, req.user, {new: true}).select("-password")
        if(!updatedUser) throw Error("Something went wrong with saving the user")
        const updAcceptedUser = await User.findByIdAndUpdate(req.params.userId, acceptedUser, {new: true}).select("-password")
        if(!updAcceptedUser) throw Error("Something went wrong with saving friendship in accepted user friend list")

        //CREATE AND SAVE NOTIFICATION
        let notify;
        if(!req.user._id.equals(req.params.userId)) {
            const newNotify = new Notification({
            sender: req.user._id,
            recipient: req.params.userId,
            type: "accept"
          })
          notify = await newNotify.save()
          if(!notify) throw Error("Something went wrong with saving notification")
        }

        res.status(200).json({success: true, updatedUser, updAcceptedUser, notify})
    }
    catch(e) {
        res.status(400).json({success:false, msg: e.message})
    }
})

//REJECT FOLLOW REQUEST
router.post("/:userId/reject", async(req, res) => {

    try {
        const declinedUser = await User.findById(req.params.userId)
        if(!declinedUser) throw Error("User doesnt exist")
        //FIND IF THERE IS A FOLLOW REQUEST IN THE USERS F.R. ARRAy
        const index = req.user.follow_requests.findIndex((id) => String(id) === String(req.params.userId))
        if (index === -1 ) throw Error("Follow request doesnt exist")
        //CHECK IF ALREDY Follower
        const frIndx = req.user.followers.findIndex((id) => String(id) === String(req.params.userId)) 
        if (frIndx !== -1) throw Error("Already followed by this user")
        //REMOVE FRIEND REQUEST
        req.user.follow_requests = req.user.follow_requests.filter((id) => String(id) !== String(req.params.userId))

        const updatedUser = await User.findByIdAndUpdate(req.user._id, req.user, {new: true})
        if (!updatedUser) throw("Something went wrong with saving the user")
        res.status(200).json({success: true, updatedUser})
    }
    catch(e) {
        res.status(400).json({success:false, msg: e.message})
    }
})

//Unfollow a user
router.post("/:userId/unfollow", async(req, res) => {
  //TODO: 
  try {
      const unfollowedUser = await User.findById(req.params.userId)
      if(!unfollowedUser) throw Error("User does not exist")

      //check if user is being followed by current user
      const index = req.user.following.findIndex((id) => String(id) === String(req.params.userId))
      if (index === -1 ) throw Error("You cant unfollow user which you don't follow")
      
      //remove target user from curr.user following
      req.user.following = req.user.following.filter((id) => String(id) !== String(req.params.userId))
      //remove curr.user from target users followers
      unfollowedUser.followers = unfollowedUser.followers.filter((id) => String(id) !== String(req.user._id))

      //save the documents
      const updatedCurrent = await User.findByIdAndUpdate(req.user._id, req.user, {new: true}).select("-password")
      if(!updatedCurrent) throw Error("Something went wrong with saving the user")
      const updUnfollowedUser = await User.findByIdAndUpdate(req.params.userId, unfollowedUser, {new: true}).select("-password")
      if(!updUnfollowedUser) throw Error("Something went wrong with saving friendship in accepted user friend list")

      res.status(200).json({success: true, updatedCurrent, updUnfollowedUser})
  }
  catch(e) {
    res.status(400).json({success:false, msg: e.message})
  }
})
module.exports = router;

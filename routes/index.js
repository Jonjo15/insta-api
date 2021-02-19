var express = require('express');
var router = express.Router();
const passport = require("passport")
const User = require("../models/user")
const Post = require("../models/post")
const Notification = require("../models/notification")
/* GET home page. */
router.get('/', passport.authenticate("jwt", {session: false}), async (req, res, next) =>{
  
    let following = req.user.following
    following.push(req.user._id)

    try {
        const timeline = await Post.find({ poster: {$in: following}})
                                    .populate("poster", "username profile_pic_url _id")
                                    .populate({ 
                                      path: 'comments',
                                      populate: [{
                                       path: 'commenter',
                                       select: 'username profile_pic_url _id'
                                      }]
                                    }).sort({"createdAt": -1}).limit(25)

        res.status(200).json({success: true, timeline})
    }
    catch(err) {
      res.status(400).json({success: false, msg: err.message})
    }
});
//GET 10 UNFOLLOWED USERS
router.get("/recommended", passport.authenticate("jwt", {session: false}), async (req, res, next) =>{

    let following = req.user.following
    following.push(req.user._id)

    try {
        const recommendedUsers = await User.find({_id: {$nin: following}})
                                            .select("_id username profile_pic_url")
                                            .limit(10)
        
        res.status(200).json({success: true, recommendedUsers})
    } catch (error) {
      res.status(400).json({success: false, msg: error.message})
    }
})
router.get("/explore/:skip", passport.authenticate("jwt", {session: false}), async (req, res, next) => {
    let following = req.user.following
    following.push(req.user._id)

    try {
        const users = await User.find({_id: {$nin: following}})
                                .sort('_id')
                                .select("_id username profile_pic_url")
                                .skip(Number(req.params.skip))
                                .limit(25)
        
        res.status(200).json({success: true, users})
    } catch (error) {
      res.status(400).json({success: false, msg: error.message})
    }
})
module.exports = router;

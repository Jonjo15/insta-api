var express = require('express');
var router = express.Router();
const Post = require("../models/post")
const Comment = require("../models/comment")
const Notification = require("../models/notification")
const passport = require("passport")
const { body, validationResult } = require("express-validator");


router.use(passport.authenticate('jwt', { session: false }))
//delete comment
router.delete("/:commentId", (req, res) => {
    //TODO:
})

//LIKE/UNLIKE COMMENT
router.put("/:commentId", async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId)
    
        if(!comment) throw Error("Comment not found")
        const index = comment.likes.findIndex((id) => String(id) === String(req.user._id))
    
        if (index === -1) {
          comment.likes.push(String(req.user._id))
        }
        else {
          comment.likes = comment.likes.filter((id) => String(id) !== String(req.user._id))
        }
        const updatedComment = await Comment.findByIdAndUpdate(req.params.commentId, comment, {new: true} )
        if(!updatedComment) throw Error("Something went wrong")
    
        if(String(req.user._id) !== String(comment.commenter)) {
          const newNotify = new Notification({
          sender: req.user._id,
          recipient: comment.commenter,
          commentId: comment._id,
          type: "like"
        })
        notify = await newNotify.save()
        if(!notify) throw Error("Something went wrong with saving notification")
      }
        res.status(200).json({success: true, updatedComment})
      }
      catch(e) {
        res.status(400).json({success:false, msg: e.message})
      }
})

module.exports = router;

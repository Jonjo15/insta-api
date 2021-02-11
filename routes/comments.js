var express = require('express');
var router = express.Router();
const Post = require("../models/post")
const Comment = require("../models/comment")
const Notification = require("../models/notification")
const passport = require("passport")

router.use(passport.authenticate('jwt', { session: false }))
//delete comment
router.delete("/:commentId", async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId)
        if(!comment) throw Error("Comment not found")
        const post = await Post.findById(comment.post)
        if(!post) throw Error("This comment is on a deleted Post")
    
        if(!comment.commenter.equals(req.user._id)) {
          return res.status(403).json({success: false, msg: "Can't delete someone else's comment"})
        }
        const response = await comment.delete()
        let postToSave
        if(response) {
          //REMOVE COMMENT FROM THE POST
          post.comments = post.comments.filter(id => String(id) !== String(comment._id))
          postToSave = await post.save()
          if(!postToSave) throw Error("Something went wrong")
        }
        res.status(200).json({success:true, response, postToSave,  msg: "Comment deleted successfully"})
      }
      catch(e) {
        res.status(400).json({success: false, msg: e.message})
      }
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
        
        let notify;
        if(String(req.user._id) !== String(comment.commenter) && index === -1) {
          const newNotify = new Notification({
          sender: req.user._id,
          recipient: comment.commenter,
          commentId: comment._id,
          postId: comment.post,
          type: "like"
        })
        notify = await newNotify.save()
        if(!notify) throw Error("Something went wrong with saving notification")
      }
        res.status(200).json({success: true, updatedComment, notify: notify || "none"})
      }
      catch(e) {
        res.status(400).json({success:false, msg: e.message})
      }
})

module.exports = router;

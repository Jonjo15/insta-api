var express = require('express');
var router = express.Router();
const Post = require("../models/post")
const Comment = require("../models/comment")
const passport = require("passport")
const { body, validationResult } = require("express-validator");


router.use(passport.authenticate('jwt', { session: false }))


router.post("/", [
    body("picture", "Post must have a picture").trim().isLength({min: 5}).escape(),
    async (req, res, next) => {
        const errors = validationResult(req);
  
        if (!errors.isEmpty()) {
          // There are errors. Render the form again with sanitized values/error messages.
          res.status(400).json({success: false, msg: "input error"})
          return;
        }
  
        const newPost = new Post({
          body: req.body.body,
          picture: req.body.picture,
          poster: req.user._id
        })
        try {
          const post = await newPost.save()
          if (!post) throw Error('Something went wrong creating a new post');
  
          return res.status(200).json({success: true, post, msg:"post created successfully"})
        }
        catch (e) {
          res.status(400).json({success: false,  msg: e.message });
        }
    }
  ])

router.delete("/:postId", async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
        if(!post) throw Error("Post not found")
        if (!post.poster.equals(req.user._id)) {
          return res.status(403).json({success: false, msg: "Can't delete someone else's post"})
        }
        const response = await post.delete()
        let result;
        if(response) {
          //DELETE POSTS COMMENTS
          result = await Comment.deleteMany({post: req.params.postId })
        }
        res.status(200).json({success:true, response, result: result || "none" ,  msg: "Post deleted successfully"})
      }
      catch(e) {
        res.status(400).json({success: false, msg: e.message})
      }
})



module.exports = router;
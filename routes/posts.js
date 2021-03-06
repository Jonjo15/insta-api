var express = require('express');
var router = express.Router();
require("dotenv").config()
const Post = require("../models/post")
const Comment = require("../models/comment")
const Notification = require("../models/notification")
const passport = require("passport")
const { body, validationResult } = require("express-validator");
const { cloudinary } = require("../config/cloudinary")


router.use(passport.authenticate('jwt', { session: false }))



router.post("/",
  async (req, res, next) => {

    try {
      const fileStr = req.body.picture;
      const uploadResponse = await cloudinary.uploader.upload(fileStr
        //   , {
        //     upload_preset: process.env.UPLOAD_PRESET,
        // }
      );
      const newPost = new Post({
        picture: uploadResponse.secure_url,
        body: req.body.body,
        poster: req.user._id
      })
      const post = await newPost.save()
      res.json({ msg: 'yaya', post });
    } catch (err) {
      console.error(err);
      res.status(500).json({ err: 'Something went wrong' });
    }
  });

router.delete("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
    if (!post) throw Error("Post not found")
    if (!post.poster.equals(req.user._id)) {
      return res.status(403).json({ success: false, msg: "Can't delete someone else's post" })
    }
    const response = await post.delete()
    let result;
    if (response) {
      //DELETE POSTS COMMENTS
      result = await Comment.deleteMany({ post: req.params.postId })
    }
    res.status(200).json({ success: true, response, result: result || "none", msg: "Post deleted successfully" })
  }
  catch (e) {
    res.status(400).json({ success: false, msg: e.message })
  }
})

router.get("/:postId", async (req, res) => {
  try {
    let following = req.user.following
    following.push(req.user._id)
    const post = await Post.findById(req.params.postId)
      .populate("poster", "username profile_pic_url _id profile_public_id")
      .populate({
        path: 'comments',
        populate: [{
          path: 'commenter',
          select: 'username profile_pic_url _id profile_public_id'
        }]
      })

    if (!post) throw Error("Post not found")
    // TODO: UNCOMMENT THIS AFTER TESTING OUT
    if (!following.includes(post.poster._id)) {
      throw Error("Unauthorized")
    }

    res.status(200).json({ success: true, post })
  } catch (e) {
    res.status(400).json({ success: false, msg: e.message })
  }
})

router.put("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
    if (!post) throw Error("Post not found")
    const index = post.likes.findIndex((id) => String(id) === String(req.user._id))

    if (index === -1) {
      post.likes.push(req.user._id)
    }
    else {
      post.likes = post.likes.filter((id) => String(id) !== String(req.user._id))
    }

    const updatedPost = await Post.findByIdAndUpdate(req.params.postId, post, { new: true })
    if (!updatedPost) throw Error("Something went wrong")
    let notify;
    if (String(req.user._id) !== String(post.poster) && index === -1) {
      const newNotify = new Notification({
        sender: req.user._id,
        recipient: post.poster,
        postId: post._id,
        type: "like"
      })
      notify = await newNotify.save()
      if (!notify) throw Error("Something went wrong with saving notification")
    }
    res.status(200).json({ success: true, updatedPost, notify })
  }
  catch (e) {
    res.status(400).json({ success: false, msg: e.message })
  }
})

router.post("/:postId", [
  body('body', 'Comment must not be empty').trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.status(401).json({ success: false, msg: "input error" })
      return;
    }
    const newComment = new Comment({
      body: req.body.body,
      commenter: req.user._id,
      post: req.params.postId
    })
    try {
      const post = await Post.findById(req.params.postId)
      if (!post) throw Error("Post doesnt exist")


      const comment = await newComment.save()
      if (!comment) throw Error('Something went wrong creating a new comment');
      post.comments.push(comment._id)
      //SAVE COMMENT IN POST MODEL ARRAY
      const updatedPost = await post.save()
      if (!updatedPost) throw Error("Something went wrong with saving a comment in Post")

      let notify;
      if (!req.user._id.equals(post.poster)) {
        const newNotify = new Notification({
          sender: req.user._id,
          recipient: post.poster,
          postId: post._id,
          type: "comment"
        })
        notify = await newNotify.save()
        if (!notify) throw Error("Something went wrong creating a notification")
      }
      return res.status(200).json({ success: true, comment, updatedPost, notify, msg: "comment created successfully" })
    }
    catch (e) {
      res.status(400).json({ success: false, msg: e.message });
    }
  }
])


module.exports = router;
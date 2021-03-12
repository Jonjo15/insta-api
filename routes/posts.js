var express = require('express');
var router = express.Router();
require("dotenv").config()
const Post = require("../models/post")
const Comment = require("../models/comment")
const Notification = require("../models/notification")
const passport = require("passport")
const { body, validationResult } = require("express-validator");
var cloudinary = require("cloudinary").v2
// const {cloudinary} = require("../config/cloudinary")

router.use(passport.authenticate('jwt', { session: false }))

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/", [
    body("picture", "Post must have a picture").trim().isLength({min: 5}).escape(),
    async (req, res, next) => {
        // console.log(process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_NAME, process.env.CLOUDINARY_API_SECRET)
        // console.log(cloudinary)
        const errors = validationResult(req);
        console.log(req.body)
        if (!errors.isEmpty()) {
          res.status(400).json({success: false, msg: "input error"})
          return;
        }
        
        // try {
          // const response = await cloudinary.uploader.upload(req.body.picture)
          // let url;
          cloudinary.uploader.upload(
            req.body.picture,
            {upload_preset: process.env.UPLOAD_PRESET},
            // { public_id: `blog/${uniqueFilename}`, tags: `blog` }, // directory and tags are optional
            function(err, image) {
              if (err) return res.send(err)
              console.log('file uploaded to Cloudinary')
      
              // var fs = require('fs')
              // fs.unlinkSync(path)
              console.log(image)
              res.json({post: {picture: image.secure_url, poster: req.user, body}})
            }
          )
          // cloudinary.uploader.upload(req.body.picture, { upload_preset: process.env.UPLOAD_PRESET },
          //   async function(err, image) {
          //     if (err) return res.status(400).json(err)
          //     console.log('file uploaded to Cloudinary')
          //     // remove file from server
          //     console.log(img)
          //     try {
          //       const newPost = new Post({
          //           body: req.body.body,
          //           picture: img.secure_url,
          //           poster: req.user._id
          //         })

          //         const post = await newPost.save()
          //         if(!post) throw Error("Something went wrong with saving post")
          //         return res.status(200).json({success: true, post})
          //     } catch (error) {
          //       return res.status(400).json({success: false,  message: "Something went wrtong" });
          //     }
              
          //   })
          // .then(function (image) {
          //   console.log(image)
          //   url = image.secure_url

          //   return new Post({
          //     body: req.body.body,
          //     picture: url,
          //     poster: req.user._id
          //   }).save()
          // }).then(result => {
          //   return res.status(200).json({success: true, post: result, msg:"post created successfully"})
          // })
          // .catch(function (err) {
          //   console.log(err)
          //   res.status(400).json({success: false,  message: "Something went wrtong" });
          // });
          // if(!response) throw Error("Something went wrong with cloudinary")
          // console.log(response)
        //  ' const newPost = new Post({
        //     body: req.body.body,
        //     picture: response.secure_url,'
        //     poster: req.user._id
        //   })
        //   const post = await newPost.save()
        //   if (!post) throw Error('Something went wrong creating a new post');'
  
        }
        // catch (e) {
        //   res.status(400).json({success: false,  msg: e.message });
        // }
    // }
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

router.get("/:postId", async(req, res) => {
  try {
      const post = await Post.findById(req.params.postId)
                              .populate("poster", "username profile_pic_url _id")
                              .populate({ 
                                path: 'comments',
                                populate: [{
                                path: 'commenter',
                                select: 'username profile_pic_url _id'
                                }]
                              })
      
      if(!post) throw Error("Post not found")
      // TODO: UNCOMMENT THIS AFTER TESTING OUT
      // if(!req.user.following.includes(post.poster._id)) {
      //   throw Error("Unauthorized")
      // }

      res.status(200).json({success: true, post})
  } catch (e) {
    res.status(400).json({success:false, msg: e.message})    
  }
})

router.put("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
    if(!post) throw Error("Post not found")
    const index = post.likes.findIndex((id) => String(id) === String(req.user._id))

    if (index === -1) {
      post.likes.push(req.user._id)
    }
    else {
      post.likes = post.likes.filter((id) => String(id) !== String(req.user._id))
    }

    const updatedPost = await Post.findByIdAndUpdate(req.params.postId, post, {new: true} )
    if(!updatedPost) throw Error("Something went wrong")
    let notify;
    if(String(req.user._id) !== String(post.poster) && index === -1) {
        const newNotify = new Notification({
        sender: req.user._id,
        recipient: post.poster,
        postId: post._id,
        type: "like"
      })
      notify = await newNotify.save()
      if(!notify) throw Error("Something went wrong with saving notification")
    }
    res.status(200).json({success: true, updatedPost, notify})
  }
  catch(e) {
    res.status(400).json({success:false, msg: e.message})
  }
})

router.post("/:postId",[
  body('body', 'Comment must not be empty').trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.status(401).json({success: false, msg: "input error"})
      return;
    }
    const newComment = new Comment({
      body: req.body.body,
      commenter: req.user._id,
      post: req.params.postId
    })
    try {
      const post = await Post.findById(req.params.postId)
      if(!post) throw Error("Post doesnt exist")

      
      const comment = await newComment.save()
      if (!comment) throw Error('Something went wrong creating a new comment');
      post.comments.push(comment._id)
      //SAVE COMMENT IN POST MODEL ARRAY
      const updatedPost = await post.save()
      if(!updatedPost) throw Error("Something went wrong with saving a comment in Post")

      let notify;
      if(!req.user._id.equals(post.poster)) {
          const newNotify = new Notification({
          sender: req.user._id,
          recipient: post.poster,
          postId: post._id,
          type: "comment"
        })
        notify = await newNotify.save()
        if (!notify) throw Error("Something went wrong creating a notification")    
      }
      return res.status(200).json({success: true, comment,updatedPost, notify, msg: "comment created successfully"})
    }
    catch (e) {
      res.status(400).json({success: false,  msg: e.message });
    }
  }
])


module.exports = router;
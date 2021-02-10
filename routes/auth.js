var express = require('express');
var router = express.Router();
const User = require("../models/user")
const bcrypt = require("bcryptjs")
require("dotenv").config()
const issueJWT = require("../util/util").issueJWT
const { body, validationResult } = require("express-validator");
const passport = require("passport")

router.get("/protected",  passport.authenticate('jwt', { session: false }), (req, res) => {
  res.status(200).json({success: true, user: req.user})
})

router.post("/login", async (req, res, next) => {
  try {
      // Check for existing user
      const user = await User.findOne({ email: req.body.email });
      if (!user) throw Error('User does not exist');
  
      const isMatch = await bcrypt.compare(req.body.password , user.password);
      if (!isMatch) throw Error('Invalid credentials');
  
      const {token} = issueJWT(user)
      if (!token) throw Error('Couldnt sign the token');
  
      res.status(200).json({
        success: true,
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          followers: user.followers,
          following: user.following,
          follow_requests: user.follow_requests,
          bio: user.bio,
          profile_pic_url: user.profile_pic_url
        }
      });
    } catch (e) {
      res.status(400).json({ msg: e.message });
    }
});

router.post("/register", [
  body("username", "username required").trim().isLength({min: 4}).escape(),
  body('email', 'Email required').trim().isLength({ min: 1 }).escape(),
  body("email","Email Addres must be valid").normalizeEmail().isEmail(),
  body('password', 'Password required').trim().isLength({ min: 4 }).escape(),

  async (req, res, next) => {

    const errors = validationResult(req);

    
    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.status(401).json({success: false, msg: "input error"})
      return;
    }
    try {
      const user = await User.findOne({ email: req.body.email });
      if (user) throw Error('User already exists');
  
  
      const hash = await bcrypt.hash(req.body.password, 10);
      if (!hash) throw Error('Something went wrong hashing the password');
  
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hash
      });
  
      const savedUser = await newUser.save();
      if (!savedUser) throw Error('Something went wrong saving the user');
  
      const {token} = issueJWT(savedUser)
  
      res.status(200).json({
        success: true, 
        token,
        user: {
          _id: savedUser._id,
          username: savedUser.username,
          email: savedUser.email,
          followers: savedUser.followers,
          following: savedUser.following,
          follow_requests: savedUser.follow_requests,
          bio: savedUser.bio,
          profile_pic_url: savedUser.profile_pic_url
        }
      });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
}]);


router.post("/google", passport.authenticate('google-plus-token', {session: false}), async(req, res, next) => {
  //TODO: GIVE TOKEN
  res.status(200).json({success: true, user: req.user})
})

module.exports = router;
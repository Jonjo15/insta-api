var express = require('express');
var router = express.Router();



//SEND A FOLLOW REQUEST
router.post("/:userId", (req, res) => {
  //TODO:
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

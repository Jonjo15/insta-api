var express = require('express');
var router = express.Router();
const Post = require("../models/post")
const Comment = require("../models/comment")
const Notification = require("../models/notification")

//delete comment
router.delete("/:commentId", (req, res) => {
    //TODO:
})

//LIKE/UNLIKE COMMENT
router.put("/:commentId", (req, res) => {
    //TODO:
})

module.exports = router;

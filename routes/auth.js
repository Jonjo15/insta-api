var express = require('express');
var router = express.Router();

router.post('/login', function(req, res, next) {
  res.status(200).json({success: true})
  //TODO:
});

router.post("/register", async(req, res) =>{
    res.status(200).json({success: true})
})

router.post("/google", async(req, res, next) => {
    res.status(200).json({success: true})
})

module.exports = router;
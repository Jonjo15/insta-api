const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
      username: {type: String, maxlength: 100, required: true},
      email: {type: String, required: true},
      password: {type: String},
      googleId: {type: String},
      bio: {type: String, maxlength: 300, default:"Hi"},
      profile_pic_url: {type: String, default: "https://res.cloudinary.com/jonjo15/image/upload/v1612707833/jqdeohhezcby05lismmr.png"},
      following: [{type: Schema.Types.ObjectId, ref: "User"}],
      followers: [{type: Schema.Types.ObjectId, ref: "User"}],
      follow_requests: [{type: Schema.Types.ObjectId, ref: "User"}]
    }
  );
  
  //Export model
  module.exports = mongoose.model('User', UserSchema);
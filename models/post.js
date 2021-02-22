const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const PostSchema = new Schema(
    {
      poster: {type: Schema.Types.ObjectId, ref: 'User', required: true},
      body: {type: String},
      picture: {type: String, default: "https://res.cloudinary.com/jonjo15/image/upload/v1612613128/sample.jpg"},
      likes:[{type:Schema.Types.ObjectId ,ref:"User"}],
      comments: [{ type: [Schema.Types.ObjectId], ref: "Comment", default: []}],
      createdAt: { type: Date, default: Date.now }
    }   
  );
  
  //Export model
  module.exports = mongoose.model('Post', PostSchema);
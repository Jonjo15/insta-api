const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const PostSchema = new Schema(
    {
      poster: {type: Schema.Types.ObjectId, ref: 'User', required: true},
      body: {type: String},
      picture: {type: String, required: true},
      likes:[{type:Schema.Types.ObjectId ,ref:"User"}],
      comments: [{ type: [Schema.Types.ObjectId], ref: "Comment", default: []}],
      createdAt: { type: Date, default: Date.now }
    }   
  );
  
  //Export model
  module.exports = mongoose.model('Post', PostSchema);
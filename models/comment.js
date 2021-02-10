const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const CommentSchema = new Schema(
    {
      commenter: {type: Schema.Types.ObjectId, ref: 'User', required: true},
      post: {type: Schema.Types.ObjectId, ref: 'Post', required: true},
      body: {type: String, required: true},
      likes:[{type:Schema.Types.ObjectId ,ref:"User"}],
      createdAt: { type: Date, default: Date.now }
    }   
  );
  
  //Export model
  module.exports = mongoose.model('Comment', CommentSchema);
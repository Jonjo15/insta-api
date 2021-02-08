const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const PostSchema = new Schema(
    {
      poster: {type: Schema.Types.ObjectId, ref: 'User', required: true},
      body: {type: String},
      picture: {type: String, required: true},
      likes: {type: [String], default: []},
      comments: [{ type: [Schema.Types.ObjectId], ref: "Comment", default: []}],
      createdAt: { type: Date, default: new Date().toISOString() }
    }   
  );
  
  //Export model
  module.exports = mongoose.model('Post', PostSchema);
const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
    {
      sender: {type: Schema.Types.ObjectId, ref: 'User', required: true},
      recipient: {type: Schema.Types.ObjectId, ref: 'User', required: true},
      postId: {type: Schema.Types.ObjectId, ref: "Post"},
    //   commentId: {type: Schema.Types.ObjectId, ref: "Comment"},
      type: {type: String, required: true},
      seen: {type: Boolean, default: false},
      createdAt: { type: Date, default: Date.now }
    }   
  );
  
  //Export model
  module.exports = mongoose.model('Notification', NotificationSchema);
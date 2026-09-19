const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ConversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);

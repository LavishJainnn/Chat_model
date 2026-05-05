const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
	user: { type: String, required: true, index: true },
	message: { type: String, required: true },
	room: { type: String, default: 'general', index: true },
	timestamp: { type: Date, default: Date.now, index: true },
});

// Compound index for efficient room-based queries with sorting
chatMessageSchema.index({ room: 1, timestamp: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
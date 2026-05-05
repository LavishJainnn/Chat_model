const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true, index: true },
	createdAt: { type: Date, default: Date.now },
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;

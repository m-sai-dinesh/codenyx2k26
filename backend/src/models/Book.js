const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
  title: { type: String, required: true },
  class: { type: Number, required: true },
  subject: { type: String, required: true },
  condition: {
    type: String,
    enum: ['new', 'good', 'fair'],
    required: true
  },
  district: { type: String, required: true },
  state: { type: String, default: 'Telangana' },
  status: {
    type: String,
    enum: ['available', 'claimed'],
    default: 'available'
  },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  claimedAt: { type: Date },
}, { timestamps: true });

const ngoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  state: { type: String, default: 'Telangana' },
  districts: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Book = mongoose.model('Book', bookSchema);
const NGO = mongoose.model('NGO', ngoSchema);

module.exports = { Book, NGO };

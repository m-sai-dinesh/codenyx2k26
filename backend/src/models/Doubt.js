const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
  subject: { type: String, required: true },
  topic: { type: String },
  question: { type: String },
  imageUrl: { type: String }, // Cloudinary URL
  imagePublicId: { type: String },

  // Answer
  answer: { type: String },
  answerImageUrl: { type: String },
  answerImagePublicId: { type: String },
  answeredAt: { type: Date },

  // Escalation
  escalatedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // peer mentor
  isEscalated: { type: Boolean, default: false },

  // Status
  status: {
    type: String,
    enum: ['pending', 'answered', 'resolved', 'reopened'],
    default: 'pending'
  },
  resolvedAt: { type: Date },
  responseTimeMinutes: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Doubt', doubtSchema);

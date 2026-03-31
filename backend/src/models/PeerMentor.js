const mongoose = require('mongoose');

const peerMentorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  class: { type: Number, required: true },
  subjects: [{ type: String }],
  juniorStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  capacity: { type: Number, default: 5 },

  // Approval
  isApproved: { type: Boolean, default: false },
  approvedAt: { type: Date },

  // Performance
  performanceScore: { type: Number, default: 0 },
  badges: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },

  // Ratings
  totalRatings: { type: Number, default: 0 },
  ratingSum: { type: Number, default: 0 },

  // Pause during own exams
  isPaused: { type: Boolean, default: false },
  pausedUntil: { type: Date },
}, { timestamps: true });

peerMentorSchema.virtual('avgRating').get(function () {
  if (this.totalRatings === 0) return 0;
  return (this.ratingSum / this.totalRatings).toFixed(1);
});

module.exports = mongoose.model('PeerMentor', peerMentorSchema);

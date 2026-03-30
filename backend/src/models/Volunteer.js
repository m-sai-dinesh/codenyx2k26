const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },
  highestDegree: { type: String, default: '' },
  teachingExperience: { type: Number, default: 0 }, // years
  teachingPreferences: [{
    class: { type: Number, required: true },
    subjects: [{ type: String, required: true }]
  }],

  // Qualification test
  qualificationScore: { type: Number, default: null },
  qualificationPassed: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },

  // Students assigned
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  capacity: { type: Number, default: 15 },

  // Performance
  performanceScore: { type: Number, default: 0 },
  avgDoubtResponseTime: { type: Number, default: 0 }, // minutes
  badges: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },

  // Ratings
  totalRatings: { type: Number, default: 0 },
  ratingSum: { type: Number, default: 0 },
}, { timestamps: true });

volunteerSchema.virtual('avgRating').get(function () {
  if (this.totalRatings === 0) return 0;
  return (this.ratingSum / this.totalRatings).toFixed(1);
});

volunteerSchema.virtual('studentCount').get(function () {
  return this.studentIds.length;
});

module.exports = mongoose.model('Volunteer', volunteerSchema);

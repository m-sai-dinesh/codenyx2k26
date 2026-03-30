const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },
  class: { type: Number, min: 1, max: 12 },
  age: { type: Number },
  schoolName: { type: String, default: '' },
  district: { type: String, default: '' },
  state: { type: String, default: 'Telangana' },
  weakSubjects: [{ type: String }],
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  mentorType: { type: String, enum: ['volunteer', 'peer_mentor'], default: null },

  // Diagnostic result
  diagnosticScore: { type: Number, default: null },
  diagnosticCompleted: { type: Boolean, default: false },
  isPeerMentorCandidate: { type: Boolean, default: false },

  // Subject health: { math: 'red' | 'yellow' | 'green' }
  subjectHealth: { type: Map, of: String, default: {} },

  // At-risk flags
  isAtRisk: { type: Boolean, default: false },
  atRiskReasons: [{ type: String }],

  // Attendance
  attendanceCount: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
}, { timestamps: true });

// Virtual attendance %
studentSchema.virtual('attendancePercentage').get(function () {
  if (this.totalSessions === 0) return 0;
  return Math.round((this.attendanceCount / this.totalSessions) * 100);
});

module.exports = mongoose.model('Student', studentSchema);

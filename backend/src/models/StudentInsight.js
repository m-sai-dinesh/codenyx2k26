const mongoose = require('mongoose');

const studentInsightSchema = new mongoose.Schema({
  studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId:      { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },

  riskLevel:         { type: String, enum: ['low', 'medium', 'high'], required: true },
  riskScore:         { type: Number, min: 0, max: 100, required: true },
  trendSummary:      { type: String, default: '' },
  weakSubjects:      [{ type: String }],
  subjectTrends: [{
    subject:  { type: String },
    trend:    { type: String, enum: ['improving', 'stable', 'declining'] },
    avgScore: { type: Number }
  }],
  recommendations:   [{ type: String }],
  attendanceFlagged: { type: Boolean, default: false },
  insufficientData:  { type: Boolean, default: false },

  dataSnapshot: {
    examCount:           { type: Number, default: 0 },
    attendedSessions:    { type: Number, default: 0 },
    totalSessions:       { type: Number, default: 0 },
    doubtCountBySubject: { type: Map, of: Number, default: {} }
  },

  dataHash:    { type: String, default: '' }, // MD5 of input data — used to skip unchanged students
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// One insight doc per student — upsert strategy keeps only the latest
studentInsightSchema.index({ studentId: 1, generatedAt: -1 });

module.exports = mongoose.model('StudentInsight', studentInsightSchema);

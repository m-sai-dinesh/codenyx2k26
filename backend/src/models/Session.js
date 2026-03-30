const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  class: { type: Number, required: true },
  scheduledDate: { type: Date, required: true },
  location: { type: String },

  // Recording
  recordingDriveLink: { type: String },
  recordingUploadedAt: { type: Date },

  // Attendance: [{ studentId, present }]
  attendance: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    present: { type: Boolean, default: false }
  }],

  // Post-session notes
  notes: { type: String },
  keyPoints: [{ type: String }],
  assignments: [{
    title: { type: String },
    description: { type: String },
    link: { type: String }, // YouTube or resource link
    dueDate: { type: Date }
  }],
  notesPublished: { type: Boolean, default: false },
  notesPublishedAt: { type: Date },

  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);

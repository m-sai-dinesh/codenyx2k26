const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  topic: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: Number }, // index of correct option
  marks: { type: Number, default: 1 }
});

const examSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },
  title: { type: String, required: true },
  subject: { type: String, required: true },
  class: { type: Number, required: true },
  type: {
    type: String,
    enum: ['diagnostic', 'weekly', 'monthly', 'qualification'],
    required: true
  },
  questions: [questionSchema],
  totalMarks: { type: Number },
  durationMinutes: { type: Number, default: 30 },
  scheduledDate: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Results sub-document stored separately
const examResultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },
  answers: [{ questionIndex: Number, selectedOption: Number }],
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number },

  // Topic-wise breakdown: { fractions: 40, algebra: 80 }
  topicBreakdown: { type: Map, of: Number, default: {} },
  weakTopics: [{ type: String }],
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Exam = mongoose.model('Exam', examSchema);
const ExamResult = mongoose.model('ExamResult', examResultSchema);

module.exports = { Exam, ExamResult };

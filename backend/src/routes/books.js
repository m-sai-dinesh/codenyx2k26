const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Book } = require('../models/Book');
const Student = require('../models/Student');

// POST /api/books/donate
router.post('/donate', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const book = await Book.create({
      donorId: req.user._id,
      ngoId: student.ngoId,
      district: student.district,
      ...req.body
    });
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/books — browse available books (filtered by district)
router.get('/', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const filter = { status: 'available' };
    if (student) filter.district = student.district;
    if (req.query.class) filter.class = parseInt(req.query.class);
    if (req.query.subject) filter.subject = req.query.subject;

    const books = await Book.find(filter)
      .populate('donorId', 'name')
      .sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/books/:id/claim
router.put('/:id/claim', protect, authorize('student'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || book.status !== 'available') {
      return res.status(400).json({ error: 'Book not available' });
    }
    await book.updateOne({
      status: 'claimed',
      claimedBy: req.user._id,
      claimedAt: new Date()
    });
    res.json({ message: 'Book claimed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

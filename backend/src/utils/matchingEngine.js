const Student = require('../models/Student');
const Volunteer = require('../models/Volunteer');
const PeerMentor = require('../models/PeerMentor');

/**
 * Matching Score Formula:
 * Subject Match (30) + Grade Match (25) + Language Match (15)
 * + Mentor Strength (20) + Student Weakness Alignment (10)
 * = Max 100
 */
// mentor is the full Volunteer/PeerMentor document (with .userId populated as User)
const calculateMatchScore = (student, mentor, mentorSubjects, mentorGrades) => {
  let score = 0;

  // Subject match
  const studentWeakSubjects = student.weakSubjects || [];
  const subjectOverlap = studentWeakSubjects.filter(s => mentorSubjects.includes(s));
  score += Math.min(30, (subjectOverlap.length / Math.max(studentWeakSubjects.length, 1)) * 30);

  // Grade match
  const gradeMatch = mentorGrades.includes(student.class);
  score += gradeMatch ? 25 : 0;

  // Language match — language is on the User record (mentor.userId)
  const mentorLanguage = mentor.userId?.language;
  if (mentorLanguage === student.language) score += 15;
  else score += 7; // partial credit

  // Mentor strength (based on performance score 0-100 → scaled to 20)
  score += Math.min(20, ((mentor.performanceScore || 0) / 100) * 20);

  // Capacity factor (penalize near-full mentors)
  const assignedCount = (mentor.studentIds?.length || 0) + (mentor.juniorStudentIds?.length || 0);
  const capacityUsed = assignedCount / (mentor.capacity || 10);
  score += capacityUsed < 0.5 ? 10 : capacityUsed < 0.8 ? 5 : 0;

  return Math.round(score);
};

/**
 * Find best mentor for a student
 * Tries Peer Mentor first, then Volunteer
 */
const findBestMentor = async (student, ngoId) => {
  // Try peer mentors first (same or adjacent class, approved, not paused, has capacity)
  const peerMentors = await PeerMentor.find({
    ngoId,
    isApproved: true,
    isPaused: false,
    $expr: { $lt: [{ $size: '$juniorStudentIds' }, '$capacity'] }
  }).populate('userId', 'name language');

  let bestPeer = null;
  let bestPeerScore = 0;

  for (const pm of peerMentors) {
    // Peer mentor should be at least 1 class above the student
    if (pm.class <= student.class) continue;
    const score = calculateMatchScore(student, pm, pm.subjects, [student.class, student.class - 1]);
    if (score > bestPeerScore) {
      bestPeerScore = score;
      bestPeer = pm;
    }
  }

  // Try volunteers
  const volunteers = await Volunteer.find({
    ngoId,
    isApproved: true,
    $expr: { $lt: [{ $size: '$studentIds' }, '$capacity'] }
  }).populate('userId', 'name language');

  let bestVolunteer = null;
  let bestVolunteerScore = 0;

  for (const vol of volunteers) {
    const score = calculateMatchScore(student, vol, vol.subjects, vol.grades);
    if (score > bestVolunteerScore) {
      bestVolunteerScore = score;
      bestVolunteer = vol;
    }
  }

  // Assign peer mentor if score is decent (>= 40), else assign volunteer
  if (bestPeer && bestPeerScore >= 40) {
    return { mentor: bestPeer, type: 'peer_mentor', score: bestPeerScore };
  }
  if (bestVolunteer) {
    return { mentor: bestVolunteer, type: 'volunteer', score: bestVolunteerScore };
  }

  return null; // waitlist
};

/**
 * Check & award badges for a mentor/peer mentor
 */
const evaluateBadges = async (mentorUserId, role) => {
  const badges = [];
  const Model = role === 'volunteer' ? Volunteer : PeerMentor;
  const mentor = await Model.findOne({ userId: mentorUserId });
  if (!mentor) return;

  const studentCount = (mentor.studentIds || mentor.juniorStudentIds || []).length;
  const avgRating = mentor.totalRatings > 0 ? mentor.ratingSum / mentor.totalRatings : 0;

  if (role === 'volunteer') {
    if (studentCount >= 5) badges.push('rising_mentor');
    if (mentor.avgDoubtResponseTime <= 120) badges.push('quick_responder');
    if (mentor.performanceScore >= 80) badges.push('impact_maker');
    if (avgRating >= 4.5 && mentor.totalRatings >= 10) badges.push('top_mentor');
  } else {
    if (studentCount >= 1) badges.push('peer_helper');
    if (avgRating >= 4.0 && mentor.totalRatings >= 5) badges.push('trusted_peer');
    if (mentor.performanceScore >= 75) badges.push('impact_peer');
  }

  // Verified — requires human approval + data threshold
  // Handled separately by NGO admin

  await Model.findOneAndUpdate({ userId: mentorUserId }, { badges });
};

/**
 * Calculate weekly performance score for mentor
 * Attendance (25%) + Exam Improvement (35%) + Response Time (20%) + Rating (20%)
 */
const calculatePerformanceScore = async (mentorUserId) => {
  // This is computed from aggregated data — simplified version
  const Volunteer = require('../models/Volunteer');
  const vol = await Volunteer.findOne({ userId: mentorUserId });
  if (!vol) return 0;

  const ratingScore = vol.totalRatings > 0 ? (vol.ratingSum / vol.totalRatings / 5) * 20 : 0;
  const responseScore = vol.avgDoubtResponseTime <= 60 ? 20 : vol.avgDoubtResponseTime <= 120 ? 15 : 5;

  // Attendance + improvement fetched from aggregated Progress data (simplified)
  const score = Math.round(ratingScore + responseScore + 30); // base 30 until more data
  return Math.min(100, score);
};

module.exports = { findBestMentor, evaluateBadges, calculatePerformanceScore };

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  GraduationCap, 
  Clock, 
  FileQuestion,
  Filter,
  CheckCircle2,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Subjects by class
const getSubjectsForClass = (cls) => {
  const c = parseInt(cls, 10);
  if (c >= 1 && c <= 5) {
    return ['First Language', 'English', 'Mathematics', 'Environmental Studies'];
  } else if (c >= 6 && c <= 10) {
    return ['First Language', 'English', 'Hindi', 'Mathematics', 'General Science', 'Social Studies'];
  } else {
    return ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
  }
};

export default function ManageQualificationTests() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [missingTests, setMissingTests] = useState([]);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const { data } = await api.get('/exams?type=qualification');
      setTests(data.exams || []);
      calculateMissingTests(data.exams || []);
    } catch (err) {
      toast.error(t('Failed to load tests'));
    } finally {
      setLoading(false);
    }
  };

  const calculateMissingTests = (existingTests) => {
    const missing = [];
    for (let cls = 1; cls <= 10; cls++) {
      const subjects = getSubjectsForClass(cls);
      subjects.forEach(subject => {
        const exists = existingTests.some(t => 
          t.class === cls && 
          t.subject.toLowerCase() === subject.toLowerCase()
        );
        if (!exists) {
          missing.push({ class: cls, subject });
        }
      });
    }
    setMissingTests(missing);
  };

  const handleDelete = async (testId) => {
    try {
      await api.delete(`/exams/${testId}`);
      toast.success(t('Test deleted successfully'));
      setShowDeleteModal(null);
      loadTests();
    } catch (err) {
      toast.error(t('Failed to delete test'));
    }
  };

  const handleCreateForClass = (cls, subject) => {
    navigate(`/ngo/exams?create=true&type=qualification&class=${cls}&subject=${encodeURIComponent(subject)}`);
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       test.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass ? test.class === parseInt(filterClass) : true;
    return matchesSearch && matchesClass;
  });

  // Group tests by class
  const groupedTests = filteredTests.reduce((acc, test) => {
    const classNum = test.class;
    if (!acc[classNum]) acc[classNum] = [];
    acc[classNum].push(test);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-200 rounded w-1/4"></div>
            <div className="h-32 bg-surface-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/ngo/dashboard')}
                className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-surface-600" />
              </button>
              <div>
                <h1 className="font-display font-bold text-2xl text-surface-900">
                  {t('Qualification Tests')}
                </h1>
                <p className="text-surface-500 text-sm">
                  {t('Tests for volunteer approval')} • {tests.length} {t('created')}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/ngo/exams?create=true&type=qualification')}
              className="btn-secondary flex items-center gap-2 px-5 py-2.5"
            >
              <Plus size={18} />
              {t('Create Test')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Missing Tests Alert */}
        {missingTests.length > 0 && !searchQuery && !filterClass && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">
                  {t('Missing Qualification Tests')}
                </h3>
                <p className="text-sm text-amber-800 mb-4">
                  {missingTests.length} {t('tests need to be created for complete coverage')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingTests.slice(0, 5).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCreateForClass(item.class, item.subject)}
                      className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm text-amber-800 hover:bg-amber-100 transition-colors"
                    >
                      Class {item.class} {item.subject}
                    </button>
                  ))}
                  {missingTests.length > 5 && (
                    <span className="px-3 py-1.5 text-sm text-amber-700">
                      +{missingTests.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-surface-400" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="input w-40"
            >
              <option value="">All Classes</option>
              {CLASSES.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Coverage Overview */}
        {!searchQuery && !filterClass && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(cls => {
              const subjects = getSubjectsForClass(cls);
              const existing = tests.filter(t => t.class === cls);
              const complete = existing.length === subjects.length;
              
              return (
                <div 
                  key={cls} 
                  className={`p-4 rounded-xl border ${
                    complete 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-surface-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-surface-900">Class {cls}</span>
                    {complete ? (
                      <CheckCircle2 size={16} className="text-green-600" />
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">
                        {existing.length}/{subjects.length}
                      </span>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-surface-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${complete ? 'bg-green-500' : 'bg-amber-400'}`}
                      style={{ width: `${(existing.length / subjects.length) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tests List */}
        {filteredTests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={28} className="text-surface-400" />
            </div>
            <h3 className="font-semibold text-surface-700 mb-2">
              {searchQuery || filterClass ? 'No tests match your filters' : 'No qualification tests yet'}
            </h3>
            <p className="text-surface-500 mb-6">
              Create tests for volunteers to prove their teaching abilities
            </p>
            <button
              onClick={() => navigate('/ngo/exams?create=true&type=qualification')}
              className="btn-primary"
            >
              <Plus size={18} className="mr-2" />
              Create Test
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedTests).sort((a, b) => a - b).map(classNum => (
              <div key={classNum} className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                {/* Class Header */}
                <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display font-bold text-lg text-purple-900">
                        Class {classNum}
                      </h2>
                      <p className="text-sm text-purple-700">
                        {groupedTests[classNum].length} test{groupedTests[classNum].length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/ngo/exams?create=true&type=qualification&class=${classNum}`)}
                      className="px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-sm text-purple-700 hover:bg-purple-100 transition-colors"
                    >
                      <Plus size={16} className="inline mr-1" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Tests Grid */}
                <div className="divide-y divide-surface-100">
                  {groupedTests[classNum].map(test => (
                    <div 
                      key={test._id}
                      className="p-6 hover:bg-surface-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-surface-900">{test.title}</h3>
                            {test.isActive ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-surface-200 text-surface-600 text-xs rounded-full font-medium">
                                Inactive
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-surface-600">
                            <span className="flex items-center gap-1.5">
                              <GraduationCap size={14} />
                              {test.subject}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <FileQuestion size={14} />
                              {test.questions?.length || 0} questions
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {test.durationMinutes} minutes
                            </span>
                            <span className="flex items-center gap-1.5">
                              <UserCheck size={14} />
                              Pass: 60%
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => navigate(`/ngo/edit-exam/${test._id}`)}
                            className="p-2 hover:bg-purple-100 text-surface-500 hover:text-purple-600 rounded-lg transition-colors"
                            title="Edit test"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(test)}
                            className="p-2 hover:bg-red-100 text-surface-500 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete test"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-surface-900">Delete Test?</h3>
            </div>
            <p className="text-surface-600 mb-6">
              Are you sure you want to delete "{showDeleteModal.title}"? This will remove the test and all volunteer results.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

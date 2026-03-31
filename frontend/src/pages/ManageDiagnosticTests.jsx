import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  BookOpen, 
  Clock, 
  FileQuestion,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function ManageDiagnosticTests() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const { data } = await api.get('/exams?type=diagnostic');
      setTests(data.exams || []);
    } catch (err) {
      toast.error(t('Failed to load tests'));
    } finally {
      setLoading(false);
    }
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
                  {t('Diagnostic Tests')}
                </h1>
                <p className="text-surface-500 text-sm">
                  {tests.length} {tests.length !== 1 ? t('tests created') : t('test created')}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/ngo/create-diagnostic')}
              className="btn-primary flex items-center gap-2 px-5 py-2.5"
            >
              <Plus size={18} />
              {t('Create New Test')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder={t('Search tests...')}
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
              <option value="">{t('All Classes')}</option>
              {CLASSES.map(c => (
                <option key={c} value={c}>{t('Class')} {c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tests List */}
        {filteredTests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-surface-400" />
            </div>
            <h3 className="font-semibold text-surface-700 mb-2">
              {searchQuery || filterClass ? t('No tests match your filters') : t('No diagnostic tests yet')}
            </h3>
            <p className="text-surface-500 mb-6">
              {searchQuery || filterClass ? t('Try adjusting your search or filters') : t('Create your first diagnostic test to get started')}
            </p>
            {!searchQuery && !filterClass && (
              <button
                onClick={() => navigate('/ngo/create-diagnostic')}
                className="btn-primary"
              >
                <Plus size={18} className="mr-2" />
                {t('Create Test')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedTests).sort((a, b) => a - b).map(classNum => (
              <div key={classNum} className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                {/* Class Header */}
                <div className="bg-brand-50 px-6 py-4 border-b border-brand-100">
                  <h2 className="font-display font-bold text-lg text-brand-900">
                    {t('Class')} {classNum}
                  </h2>
                  <p className="text-sm text-brand-700">
                    {groupedTests[classNum].length} {groupedTests[classNum].length !== 1 ? t('tests') : t('test')}
                  </p>
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
                                {t('Active')}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-surface-200 text-surface-600 text-xs rounded-full font-medium">
                                {t('Inactive')}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-surface-600">
                            <span className="flex items-center gap-1.5">
                              <BookOpen size={14} />
                              {test.subject}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <FileQuestion size={14} />
                              {test.questions?.length || 0} {t('questions')}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {test.durationMinutes} {t('minutes')}
                            </span>
                          </div>

                          <p className="text-xs text-surface-400 mt-3">
                            {t('Created')} {new Date(test.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => navigate(`/ngo/edit-exam/${test._id}`)}
                            className="p-2 hover:bg-brand-100 text-surface-500 hover:text-brand-600 rounded-lg transition-colors"
                            title={t('Edit test')}
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(test)}
                            className="p-2 hover:bg-red-100 text-surface-500 hover:text-red-600 rounded-lg transition-colors"
                            title={t('Delete test')}
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
              <h3 className="font-semibold text-surface-900">{t('Delete Test')}?</h3>
            </div>
            <p className="text-surface-600 mb-6">
              {t('Are you sure you want to delete')} "{showDeleteModal.title}"? {t('This action cannot be undone and all student results will be lost')}.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="btn-secondary px-4 py-2"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('Delete Test')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

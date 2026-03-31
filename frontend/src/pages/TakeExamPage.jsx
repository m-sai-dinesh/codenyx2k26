import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { ExamTaker } from './ExamsPage';
import { ArrowLeft } from 'lucide-react';

export default function TakeExamPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/exams/${id}`)
      .then(res => setExam(res.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="p-8 max-w-3xl mx-auto flex flex-col gap-4">
      <div className="h-40 card shimmer" />
      <div className="h-64 card shimmer" />
    </div>
  );

  if (!exam) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-6">
      <button 
        onClick={() => navigate('/dashboard')} 
        className="btn-ghost self-start text-surface-500 hover:text-surface-900"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <ExamTaker 
        exam={exam} 
        onDone={() => navigate('/dashboard')} 
      />
    </div>
  );
}

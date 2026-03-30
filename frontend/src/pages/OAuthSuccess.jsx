import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const isNew = searchParams.get('isNew') === 'true';

    if (!token) {
      navigate('/login');
      toast.error('Authentication failed. Please try again.');
      return;
    }

    loginWithToken(token)
      .then((user) => {
        const role = user.role;
        
        if (isNew) {
          if (role === 'volunteer' || role === 'peer_mentor') {
            toast.success('Welcome! Please complete your volunteer profile.');
            navigate('/complete-volunteer-profile');
          } else if (role === 'student') {
            toast.success('Account created! Time to take your diagnostic exam.');
            navigate('/student/exams');
          } else {
            navigate('/dashboard');
          }
        } else {
          if (role === 'volunteer' || role === 'peer_mentor') {
            navigate('/volunteer/dashboard');
          } else if (role === 'student') {
            navigate('/student/dashboard');
          } else if (role === 'ngo_admin') {
            navigate('/ngo/dashboard');
          } else {
            navigate('/dashboard');
          }
          toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
        }
      })
      .catch(() => {
        navigate('/login');
        toast.error('Authentication failed. Please try again.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-surface-600">Setting up your account...</p>
      </div>
    </div>
  );
}

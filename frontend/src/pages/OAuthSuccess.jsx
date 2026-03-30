import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const isNew = searchParams.get('isNew') === 'true';

    if (token && role) {
      // Store token
      localStorage.setItem('edu_token', token);
      
      if (isNew) {
        // New user - redirect to complete profile
        toast.success('Welcome! Please complete your profile.');
        navigate('/complete-volunteer-profile');
      } else {
        // Existing user - direct to dashboard
        switch (role) {
          case 'volunteer':
            navigate('/volunteer/dashboard');
            toast.success('Welcome back!');
            break;
          case 'student':
            navigate('/student/dashboard');
            toast.success('Welcome back!');
            break;
          default:
            navigate('/dashboard');
            toast.success('Welcome back!');
        }
      }
    } else {
      navigate('/login');
      toast.error('Authentication failed. Please try again.');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-surface-600">Setting up your account...</p>
      </div>
    </div>
  );
}

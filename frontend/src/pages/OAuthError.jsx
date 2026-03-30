import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function OAuthError() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = searchParams.get('error');
    
    switch (error) {
      case 'auth_failed':
        toast.error('Authentication failed. Please try again.');
        break;
      case 'access_denied':
        toast.error('Access denied. Please grant permission to continue.');
        break;
      default:
        toast.error('Something went wrong. Please try again.');
    }

    // Redirect to login after 2 seconds
    setTimeout(() => {
      navigate('/register/volunteer');
    }, 2000);
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-surface-900 mb-2">Authentication Failed</h2>
        <p className="text-surface-600">Redirecting you back to registration...</p>
      </div>
    </div>
  );
}

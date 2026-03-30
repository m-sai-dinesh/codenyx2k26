import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header({ showAuth = true, transparent = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headerClasses = transparent 
    ? 'sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-surface-100/50 px-4 sm:px-6 py-4'
    : 'sticky top-0 z-50 bg-white border-b border-surface-200 px-4 sm:px-6 py-4';

  return (
    <>
      <nav className={headerClasses}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
              <GraduationCap size={20} color="white" />
            </div>
            <span className="font-display font-bold text-xl text-surface-900">EduReach</span>
          </div>
          
          {showAuth && (
            <>
              {/* Desktop Navigation */}
              <div className="hidden sm:flex items-center gap-3">
                {user ? (
                  <button 
                    onClick={() => navigate('/dashboard')} 
                    className="btn-primary text-sm px-6 py-2.5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    Dashboard <ArrowRight size={16} />
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => navigate('/login')} 
                      className="btn-ghost text-sm font-medium"
                    >
                      Sign in
                    </button>
                    <button 
                      onClick={() => navigate('/register/student')} 
                      className="btn-primary text-sm px-6 py-2.5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      Get Started <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-lg hover:bg-surface-100 transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {showAuth && mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-40 pt-16">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative bg-white border-b border-surface-200 px-4 py-4 shadow-lg">
            <div className="flex flex-col gap-3">
              {user ? (
                <button 
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }} 
                  className="btn-primary w-full justify-center py-3 shadow-sm"
                >
                  Dashboard <ArrowRight size={16} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }} 
                    className="btn-secondary w-full justify-center py-3"
                  >
                    Sign in
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/register/student');
                      setMobileMenuOpen(false);
                    }} 
                    className="btn-primary w-full justify-center py-3 shadow-sm"
                  >
                    Get Started <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

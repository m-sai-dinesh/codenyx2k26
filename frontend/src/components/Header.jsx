import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight, Menu, X, BookOpen, Globe } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Header({ showAuth = true, transparent = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const headerClasses = transparent 
    ? 'sticky top-0 z-50 bg-gradient-to-r from-white/95 to-white/80 backdrop-blur-xl border-b border-brand-100/50 px-4 sm:px-6 py-3'
    : 'sticky top-0 z-50 bg-white border-b border-surface-200 px-4 sm:px-6 py-3';

  return (
    <>
      <nav className={headerClasses}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center">
              <span className="font-display font-bold text-2xl text-surface-900 tracking-tight">ShikshaSetu</span>
            </div>
          </div>
          
          {showAuth && (
            <>
              {/* Desktop Navigation */}
              <div className="hidden sm:flex items-center gap-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-1.5 mr-2">
                      <Globe size={16} className="text-surface-500" />
                      <select 
                        value={i18n.language} 
                        onChange={handleLanguageChange}
                        className="bg-transparent border-none text-surface-700 text-sm font-medium focus:ring-0 cursor-pointer outline-none appearance-none pr-4"
                        style={{ backgroundImage: 'none' }}
                      >
                        <option value="english">English</option>
                        <option value="hindi">हिंदी</option>
                        <option value="telugu">తెలుగు</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => navigate('/dashboard')} 
                      className="btn-primary text-sm px-6 py-2.5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {t('Dashboard')} <ArrowRight size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => navigate('/login')} 
                      className="btn-ghost text-sm font-medium"
                    >
                      {t('Sign in')}
                    </button>
                    <button 
                      onClick={() => navigate('/register/student')} 
                      className="btn-primary text-sm px-6 py-2.5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {t('Get Started')} <ArrowRight size={16} />
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
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-surface-50 rounded-lg mb-2">
                    <Globe size={18} className="text-surface-500" />
                    <select 
                      value={i18n.language} 
                      onChange={handleLanguageChange}
                      className="w-full bg-transparent border-none text-surface-700 font-medium focus:ring-0 cursor-pointer outline-none"
                    >
                      <option value="english">English</option>
                      <option value="hindi">हिंदी</option>
                      <option value="telugu">తెలుగు</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      navigate('/dashboard');
                      setMobileMenuOpen(false);
                    }} 
                    className="btn-primary w-full justify-center py-3 shadow-sm"
                  >
                    {t('Dashboard')} <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }} 
                    className="btn-secondary w-full justify-center py-3"
                  >
                    {t('Sign in')}
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/register/student');
                      setMobileMenuOpen(false);
                    }} 
                    className="btn-primary w-full justify-center py-3 shadow-sm"
                  >
                    {t('Get Started')} <ArrowRight size={16} />
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

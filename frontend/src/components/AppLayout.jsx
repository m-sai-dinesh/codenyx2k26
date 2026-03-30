import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
  LayoutDashboard, MessageCircleQuestion, Calendar, BookOpen,
  Trophy, BookMarked, LogOut, Menu, X, GraduationCap, Shield, ChevronRight
} from 'lucide-react';

const navConfigs = {
  student: [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/doubts', icon: MessageCircleQuestion, label: 'My Doubts' },
    { to: '/student/sessions', icon: Calendar, label: 'Sessions' },
    { to: '/student/exams', icon: BookOpen, label: 'Exams' },
    { to: '/student/books', icon: BookMarked, label: 'Book Exchange' },
    { to: '/student/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ],
  volunteer: [
    { to: '/volunteer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/volunteer/doubts', icon: MessageCircleQuestion, label: 'Doubts Queue' },
    { to: '/volunteer/sessions', icon: Calendar, label: 'Sessions' },
    { to: '/volunteer/exams', icon: BookOpen, label: 'Exams' },
    { to: '/volunteer/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ],
  ngo_admin: [
    { to: '/ngo/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/ngo/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ],
};

const roleLabel = {
  student: 'Student',
  volunteer: 'Volunteer',
  peer_mentor: 'Peer Mentor',
  ngo_admin: 'NGO Admin',
};

const roleColor = {
  student: 'bg-blue-100 text-blue-700',
  volunteer: 'bg-brand-100 text-brand-700',
  peer_mentor: 'bg-purple-100 text-purple-700',
  ngo_admin: 'bg-amber-100 text-amber-700',
};

export default function AppLayout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navKey = user?.role === 'peer_mentor' ? 'volunteer' : role;
  const navItems = navConfigs[navKey] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ animation: 'fadeIn 0.2s ease' }}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-surface-100
        flex flex-col z-30 transition-transform duration-300 shadow-lg lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-display font-bold text-lg text-surface-900 leading-none tracking-tight">ShikshaSetu</p>
              <p className="text-xs text-brand-600 font-medium mt-0.5">Learning Platform</p>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="px-4 py-4 border-b border-surface-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-surface-900 truncate">{user?.name}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor[user?.role] || 'bg-gray-100 text-gray-600'}`}>
                {roleLabel[user?.role] || user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              <ChevronRight size={14} className="opacity-30" />
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-surface-100">
          <button onClick={handleLogout} className="nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3 border-b border-surface-200">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-surface-900">ShikshaSetu</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { GraduationCap, Mail, Phone, MapPin, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface-950 text-surface-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-display font-bold text-2xl text-white tracking-tight">ShikshaSetu</span>
            </div>
            <p className="text-sm text-surface-400 mb-4">
              Empowering students everywhere with quality education and mentorship.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Globe size={14} className="text-surface-500" />
                <a href="https://youngistaanfoundation.org/" target="_blank" rel="noopener noreferrer">youngistaanfoundation.org</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-surface-500" />
                <span>Telangana , India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-surface-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-surface-500">
              © 2026 ShikshaSetu. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-surface-500">
              Empowering students everywhere.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

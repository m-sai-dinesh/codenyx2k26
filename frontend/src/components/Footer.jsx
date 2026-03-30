import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface-950 text-surface-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={24} className="text-brand-400" />
              <span className="font-display font-bold text-xl text-white">EduReach</span>
            </div>
            <p className="text-sm text-surface-400 mb-4">
              Empowering students everywhere with quality education and mentorship.
            </p>
            <div className="flex gap-4 text-sm">
              <a href="#" className="text-surface-400 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-surface-400 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-surface-400 hover:text-white transition-colors">GitHub</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/register/student" className="hover:text-white transition-colors">For Students</a></li>
              <li><a href="/register/volunteer" className="hover:text-white transition-colors">For Volunteers</a></li>
              <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/features" className="hover:text-white transition-colors">Features</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-surface-500" />
                <span>support@edureach.org</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-surface-500" />
                <span>+91 12345 67890</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-surface-500" />
                <span>India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-surface-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-surface-500">
              © 2024 EduReach. All rights reserved.
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

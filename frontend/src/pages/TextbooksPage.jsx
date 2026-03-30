import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ExternalLink, GraduationCap } from 'lucide-react';

const TEXTBOOKS = {
  1:  { English: 'https://drive.google.com/drive/folders/1qeMpTeyHnXtyw28xWz2QLhaJ2nqSqQOB?usp=drive_link', Telugu: 'https://drive.google.com/drive/folders/1xRAB75fjFeLtTQVDZzZ2YKlhoF09JeHA?usp=drive_link' },
  2:  { English: 'https://drive.google.com/drive/folders/1SAVu0WsmsgTTnlNMU9HwamE67udRuEMR?usp=drive_link', Telugu: 'https://drive.google.com/drive/folders/1UPX4628t99wJ3NV8VTmtDStZZJLv1pTg?usp=drive_link' },
  3:  { English: 'https://drive.google.com/drive/folders/1wC4VThnvgwMUqNnoZZhUhRwcZWL5i6Kf?usp=drive_link', Telugu: 'https://drive.google.com/drive/folders/1q-7Q1OlB_RKKJykyqA_s1uZIBRsPYJK2?usp=drive_link' },
  4:  { English: 'https://drive.google.com/drive/folders/1IvI8FozPkwuk4Fv6C4qbPDUUW72EQM_B?usp=drive_link', Telugu: 'https://drive.google.com/drive/folders/1X0vlJ5AeYEIygsEu5Yb2lmqkLEMzqugL?usp=drive_link' },
  5:  { English: 'https://drive.google.com/drive/folders/1rQ8W3c-_8hlb6glhwSF0pW_bt-DDYqFF?usp=drive_link', Telugu: 'https://drive.google.com/drive/folders/1wmo5J-s6IokcyTBNARw2wZZA-5-DL2nz?usp=drive_link' },
  6:  { English: 'https://drive.google.com/drive/folders/1qLHgzPWDRvn6rR4DEb7aOLi0dTtDVuea?usp=drive_link', Telugu: 'https://drive.google.com/drive/folders/1oBzjcpyT7_FvudQySGg5fQ6ghVsqmT3X?usp=drive_link' },
  7:  { English: 'https://drive.google.com/drive/folders/1FhohCG5I5DisVl79VrrAQ4-mH8bU0sQX?usp=drive_link', Telugu: 'https://drive.google.com/drive/folders/1i1JUU7gdB8x6gHYya4p_2uvBTI7PkChI?usp=drive_link' },
  8:  { English: 'https://drive.google.com/drive/folders/16zGhnGCNvuO4eW3Jt2_NkGaLGCvGBLB2?usp=drive_link', Telugu: 'https://drive.google.com/drive/folders/1Is0juzWuKES1mgAlBcHtfJq0qVOSDBKH?usp=drive_link' },
  9:  { English: 'https://drive.google.com/drive/folders/167yXQVwlzYXkEnpv73ojNjw0kc9SUoVg?usp=drive_link', Telugu: 'https://drive.google.com/drive/folders/1IPu3CGsoFrQkv8ZsFmO7Ifv5cTSpa501?usp=drive_link' },
  10: { English: 'https://drive.google.com/drive/folders/1Tb_dUr_Vp6uAKtHiCoojnGIZmEhPTV61?usp=drive_link', Telugu: 'https://drive.google.com/drive/folders/1MX8QSxc-6Ml6_BUCUB5zGL1raITPp4hL?usp=drive_link' },
};

export default function TextbooksPage() {
  const { user } = useAuth();
  const [language, setLanguage] = useState('English');

  const isStudent = user?.role === 'student';
  // Students see all classes but their own is highlighted; volunteers see all
  const classes = Object.keys(TEXTBOOKS).map(Number);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Textbooks</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Telangana government school textbooks — Classes 1 to 10
          </p>
        </div>

        {/* Language toggle */}
        <div className="flex items-center gap-1 bg-surface-100 rounded-xl p-1 self-start sm:self-auto">
          {['English', 'Telugu'].map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                language === lang
                  ? 'bg-white shadow text-brand-700 ring-1 ring-surface-200'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              {lang === 'English' ? '🇬🇧 English' : '🅣 Telugu'}
            </button>
          ))}
        </div>
      </div>

      {/* Info banner for students */}
      {isStudent && (
        <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
          <GraduationCap size={18} className="text-brand-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-brand-700">
            Your class is highlighted. Click any card to open the folder in Google Drive.
          </p>
        </div>
      )}

      {/* Class grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {classes.map(cls => {
          const link = TEXTBOOKS[cls][language];
          const isMyClass = isStudent && user?.class === cls;

          return (
            <a
              key={cls}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                isMyClass
                  ? 'border-brand-400 bg-brand-50 shadow-sm ring-2 ring-brand-200'
                  : 'border-surface-200 bg-white hover:border-brand-300'
              }`}
            >
              {isMyClass && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  My Class
                </span>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isMyClass ? 'bg-brand-600' : 'bg-surface-100 group-hover:bg-brand-100'
              } transition-colors`}>
                <BookOpen size={22} className={isMyClass ? 'text-white' : 'text-surface-500 group-hover:text-brand-600'} />
              </div>
              <div>
                <p className={`font-display font-bold text-lg leading-none ${isMyClass ? 'text-brand-700' : 'text-surface-900'}`}>
                  {cls}
                </p>
                <p className="text-xs text-surface-400 mt-0.5">Class {cls}</p>
              </div>
              <ExternalLink size={13} className={`${isMyClass ? 'text-brand-400' : 'text-surface-300 group-hover:text-brand-400'} transition-colors`} />
            </a>
          );
        })}
      </div>

      <p className="text-xs text-surface-400 text-center pt-2">
        Links open Google Drive folders. You need a Google account to access them.
      </p>
    </div>
  );
}

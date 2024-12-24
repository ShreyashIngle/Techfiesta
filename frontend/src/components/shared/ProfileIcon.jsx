import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../utils/translations';

function ProfileIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language].profile;

  useEffect(() => {
    // Check if profile is complete
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));
    setProfileComplete(!!userProfile?.avatar && !!userProfile?.location);

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    navigate('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-800 transition-colors"
      >
        <User className="w-6 h-6" />
        {!profileComplete && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-lg py-2 z-50"
          >
            <Link
              to="/profile"
              className="flex items-center px-4 py-2 hover:bg-gray-700 transition-colors"
            >
              <User className="w-5 h-5 mr-3" />
              {t.viewProfile}
            </Link>
            <Link
              to="/settings"
              className="flex items-center px-4 py-2 hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-5 h-5 mr-3" />
              {t.settings}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 hover:bg-gray-700 transition-colors text-red-400"
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t.logout}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfileIcon;
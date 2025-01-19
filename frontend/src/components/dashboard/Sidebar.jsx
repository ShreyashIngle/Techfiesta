import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, Leaf, MessageSquare, Newspaper, Map, GanttChart, FileText, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../utils/translations';
// import ProfileIcon from './ProfileIcon';
// import logo from "../../images/logo.png";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language].nav;
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const menuItems = userRole === 'farmer' 
    ? [
        { icon: Map, label: 'Map View', path: '/dashboard/map' },
        { icon: Leaf, label: 'Crop Recommendation', path: '/dashboard/crop-recommendation' },
        { icon: MessageSquare, label: 'Chatbot', path: '/dashboard/chatbot' },
        { icon: Newspaper, label: 'News', path: '/dashboard/news' },
        { icon: GanttChart, label: 'Government Schemes', path: '/dashboard/schemes' },
        { icon: FileText, label: 'Report', path: '/dashboard/report' },
        { icon: Cloud, label: 'Weather', path: '/dashboard/weather' }
      ]
    : [
        { icon: Map, label: 'Map View', path: '/dashboard/map' }
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-gray-900 h-full fixed left-0 top-20 p-4"
    >
      <div className="space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-green-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

export default Sidebar;
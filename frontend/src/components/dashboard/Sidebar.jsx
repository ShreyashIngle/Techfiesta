import { motion } from 'framer-motion';
import { Leaf, Map, MessageSquare, Newspaper } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { icon: Map, label: 'Map View', path: '/dashboard/map' },
  { icon: Leaf, label: 'Crop Recommendation', path: '/dashboard/crop-recommendation' },
  { icon: MessageSquare, label: 'Chatbot', path: '/dashboard/chatbot' },
  { icon: Newspaper, label: 'News', path: '/dashboard/news' }
];

function Sidebar() {
  const location = useLocation();

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
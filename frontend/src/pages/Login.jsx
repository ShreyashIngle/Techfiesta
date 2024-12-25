import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Github, Linkedin, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

function Login() {
  const navigate = useNavigate();
  const { language } = useLanguage();  // Get the current language from context
  const t = translations[language].login;  // Get the login translations based on current language

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-black to-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] shadow-xl overflow-hidden max-w-4xl w-full flex"
      >
        <div className="w-full md:w-1/2 p-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">{t.title}</h2>
          
          {/* <div className="flex gap-4 mb-6">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <Github className="w-6 h-6 text-gray-900" />
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <Linkedin className="w-6 h-6 text-[#0A66C2]" />
            </button>
          </div> */}

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">{t.orUseEmail}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                name="email"
                placeholder={t.emailPlaceholder}
                value={formData.email}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green text-black placeholder-gray-800"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder={t.passwordPlaceholder}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 placeholder-gray-800"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-gray-600"
              >
                {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-600 hover:text-brand-green"
              >
                {t.forgotPassword}
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors font-semibold"
            >
              {t.signInButton}
            </button>
          </form>
        </div>

        <div className="hidden md:block w-1/2 bg-green-900 p-12 text-white">
          <div className="h-full flex flex-col justify-center items-center text-center">
            <h2 className="text-4xl font-bold mb-6">{t.helloFriend}</h2>
            <p className="text-lg mb-12">{t.welcomeMessage}</p>
            <Link
              to="/signup"
              className="inline-block border-2 border-white text-white px-12 py-4 rounded-xl hover:bg-white hover:text-emerald-500 transition-colors text-center font-semibold"
            >
              {t.signUpText} {/* Translated SIGN UP text */}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;

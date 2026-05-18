import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Menu, X, User, LogOut, Home, ClipboardList, BarChart3, LayoutDashboard, Heart } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Inicio', path: '/', icon: Home },
    ...(user?.role === 'user' ? [{ name: 'Mi Encuesta', path: '/survey', icon: ClipboardList }] : []),
    ...(user?.role === 'user' ? [{ name: 'Panel', path: '/dashboard', icon: LayoutDashboard }] : []),
    ...(user?.role === 'admin' ? [{ name: 'Administración', path: '/admin', icon: BarChart3 }] : []),
    ...(user?.role === 'analyst' ? [{ name: 'Validación', path: '/analyst', icon: ClipboardList }] : []),
  ];

  return (
    <nav className="sticky top-0 z-[9999] bg-unidas-dark/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-unidas-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-unidas-primary/30">
                <Heart className="w-7 h-7 fill-current" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-2xl font-display font-black tracking-tighter text-white">Unidas</span>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">BARRIOS UNIDOS</span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-white/70 hover:text-white font-bold text-sm tracking-tight transition-colors flex items-center space-x-2"
              >
                <span>{link.name}</span>
              </Link>
            ))}
            {user ? (
              <div className="flex items-center space-x-5 pl-8 border-l border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white ring-1 ring-white/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-white leading-none mb-1">{user.name}</p>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                      {user.role === 'admin' ? 'Administrador' : user.role === 'analyst' ? 'Analista' : user.role === 'user' ? 'Cuidadora' : user.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <Link to="/login" className="text-white font-bold hover:text-white/80 transition-colors">
                  Ingresar
                </Link>
                <Link
                  to="/register"
                  className="px-8 py-3 bg-unidas-primary text-white font-black rounded-2xl shadow-xl shadow-unidas-primary/40 hover:scale-105 active:scale-95 transition-all"
                >
                  Registrarme
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-unidas-primary hover:bg-slate-100 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-unidas-dark border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <link.icon className="w-5 h-5" />
                    <span>{link.name}</span>
                  </div>
                </Link>
              ))}
              <div className="pt-4 border-t border-white/10">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-base font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                ) : (
                  <div className="space-y-3 px-2 pt-2">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center px-4 py-3 bg-white/5 text-white font-bold rounded-xl border border-white/10"
                    >
                      Ingresar
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center px-4 py-3 bg-unidas-primary text-white font-bold rounded-xl shadow-lg"
                    >
                      Registrarme
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

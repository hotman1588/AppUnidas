import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Menu, X, User, LogOut, Home, ClipboardList, BarChart3, LayoutDashboard, Heart, Settings, KeyRound, ChevronDown, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
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

  const [profileData, setProfileData] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({ full_name: '', phone: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUpdateModal(false);
        setShowPasswordModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      })
      .then(res => res.json())
      .then(data => {
        setProfileData(data);
        setUpdateForm({ full_name: data.full_name || '', phone: data.phone || '', email: data.email || '' });
      })
      .catch(console.error);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${useAuthStore.getState().token}` },
        body: JSON.stringify(updateForm)
      });
      if (res.ok) {
        alert('Datos actualizados exitosamente');
        setShowUpdateModal(false);
        const profileRes = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
        });
        if (profileRes.ok) setProfileData(await profileRes.json());
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) { console.error(err); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return alert('Las contraseñas nuevas no coinciden');
    }
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${useAuthStore.getState().token}` },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });
      if (res.ok) {
        alert('Contraseña actualizada exitosamente');
        setShowPasswordModal(false);
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) { console.error(err); }
  };

  const navLinks = [
    { name: 'Inicio', path: '/', icon: Home },
    ...(user?.role === 'user' ? [{ name: 'Mi Encuesta', path: '/survey', icon: ClipboardList }] : []),
    ...(user?.role === 'user' ? [{ name: 'Panel', path: '/dashboard', icon: LayoutDashboard }] : []),
    ...(user?.role === 'admin' ? [{ name: 'Administración', path: '/admin', icon: BarChart3 }] : []),
    ...(user?.role === 'analyst' ? [{ name: 'Validación', path: '/analyst', icon: ClipboardList }] : []),
  ];

  return (
    <>
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
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white ring-1 ring-white/20 group-hover:bg-white/20 transition-all">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-white leading-none mb-1">{user.name}</p>
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                        {user.role === 'admin' ? 'Administrador' : user.role === 'analyst' ? 'Analista' : user.role === 'user' ? 'Cuidadora' : user.role}
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full right-0 mt-4 w-56 bg-[#1a1b26] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <button 
                        onClick={() => { setShowProfileMenu(false); setShowUpdateModal(true); }}
                        className="w-full px-4 py-3 flex items-center space-x-3 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm font-bold">Actualizar Datos</span>
                      </button>
                      <button 
                        onClick={() => { setShowProfileMenu(false); setShowPasswordModal(true); }}
                        className="w-full px-4 py-3 flex items-center space-x-3 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left border-t border-white/5"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span className="text-sm font-bold">Cambiar Contraseña</span>
                      </button>
                    </motion.div>
                  )}
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

      {/* Update Profile Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <button 
              onClick={() => setShowUpdateModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-800 mb-6">Actualizar Datos</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cédula</label>
                <input 
                  type="text" 
                  disabled 
                  value={profileData?.document_number || ''}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={updateForm.full_name}
                  onChange={(e) => setUpdateForm({...updateForm, full_name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-unidas-primary outline-none focus:ring-2 focus:ring-unidas-primary/20 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
                <input 
                  type="tel" 
                  required
                  value={updateForm.phone}
                  onChange={(e) => setUpdateForm({...updateForm, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-unidas-primary outline-none focus:ring-2 focus:ring-unidas-primary/20 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  value={updateForm.email}
                  onChange={(e) => setUpdateForm({...updateForm, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-unidas-primary outline-none focus:ring-2 focus:ring-unidas-primary/20 text-slate-800"
                />
              </div>
              <button type="submit" className="w-full py-4 bg-unidas-primary text-white font-black rounded-xl hover:bg-unidas-secondary transition-colors mt-6">
                Guardar Cambios
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-800 mb-6">Cambiar Contraseña</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña Actual</label>
                <input 
                  type="password" 
                  required
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-unidas-primary outline-none focus:ring-2 focus:ring-unidas-primary/20 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nueva Contraseña</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-unidas-primary outline-none focus:ring-2 focus:ring-unidas-primary/20 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-unidas-primary outline-none focus:ring-2 focus:ring-unidas-primary/20 text-slate-800"
                />
              </div>
              <button type="submit" className="w-full py-4 bg-unidas-primary text-white font-black rounded-xl hover:bg-unidas-secondary transition-colors mt-6">
                Actualizar Contraseña
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Smartphone, CreditCard, Lock, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { DocumentType, DocumentTypeLabel, DOCUMENT_TYPES } from '../lib/documentTypes';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    document_type: 'CC',
    document_number: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();

  // Password validation function
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (!password) {
      errors.push('La contraseña es requerida');
    } else {
      if (password.length < 4) errors.push('Mínimo 4 caracteres');
      if (password.length > 12) errors.push('Máximo 12 caracteres');
    }
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate password while typing
    if (name === 'password') {
      setPasswordErrors(validatePassword(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validate password requirements
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError('La contraseña no cumple los requisitos: ' + passwordErrors.join(', '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Register via server API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          document_type: formData.document_type,
          document_number: formData.document_number,
          phone: formData.phone,
          email: formData.email,
          password: formData.password
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error en el registro');
      }

      // Auto-login after registration
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_number: formData.document_number,
          password: formData.password
        })
      });

      if (loginResponse.ok) {
        const data = await loginResponse.json();
        setUser({
          uid: String(data.user.id),
          name: data.user.name,
          role: data.user.role,
          email: formData.email
        });
        setToken(data.token);
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setError('Registro exitoso pero fallo el acceso automático. Por favor inicia sesión.');
        navigate('/login');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Fallo el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-unidas-dark py-12 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-unidas-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-unidas-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

      <div className="max-w-2xl mx-auto relative z-10">
        <Link to="/" className="inline-flex items-center space-x-3 text-white/40 hover:text-white font-black mb-12 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 group-hover:bg-white/10">
            <ChevronLeft className="w-5 h-5 text-unidas-primary" />
          </div>
          <span className="text-xs uppercase tracking-widest">Volver</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 p-8 md:p-14 rounded-[4rem] shadow-2xl backdrop-blur-xl border border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-unidas-primary via-unidas-secondary to-unidas-accent" />
          
          <div className="text-center mb-16">
            <div className="w-24 h-24 bg-white/5 text-unidas-secondary rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-2xl">
              <UserPlus className="w-12 h-12" />
            </div>
            <h1 className="text-5xl font-black text-white mb-6 font-display tracking-tight">Crea tu Cuenta</h1>
            <p className="text-white/40 font-medium text-lg leading-relaxed max-w-md mx-auto italic">
              Únete a la red de protección y cuidado más grande de Barrios Unidos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 focus:border-unidas-primary focus:bg-white/10 rounded-2xl transition-all outline-none font-bold text-white text-lg placeholder:text-white/5"
                    placeholder="Tu nombre y apellidos"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Tipo de Documento</label>
                <div className="relative">
                  <select
                    name="document_type"
                    value={formData.document_type}
                    onChange={handleChange}
                    className="w-full px-6 py-5 bg-white/5 border border-white/5 focus:border-unidas-primary rounded-2xl transition-all outline-none font-bold text-white text-lg appearance-none cursor-pointer"
                    required
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-unidas-dark">
                        {type} - {DocumentTypeLabel[type as DocumentType]}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronLeft className="w-5 h-5 -rotate-90 text-white/20" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Número de Documento</label>
                <div className="relative">
                  <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                  <input
                    type="text"
                    name="document_number"
                    value={formData.document_number}
                    onChange={handleChange}
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 focus:border-unidas-primary rounded-2xl transition-all outline-none font-bold text-white text-lg placeholder:text-white/5"
                    placeholder="Sin puntos ni comas"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Teléfono</label>
                <div className="relative">
                  <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 focus:border-unidas-primary rounded-2xl transition-all outline-none font-bold text-white text-lg placeholder:text-white/5"
                    placeholder="300 000 0000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 focus:border-unidas-primary rounded-2xl transition-all outline-none font-bold text-white text-lg placeholder:text-white/5"
                    placeholder="email@ejemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-14 pr-6 py-5 bg-white/5 border rounded-2xl transition-all outline-none font-bold text-white text-lg placeholder:text-white/5 ${
                      passwordErrors.length > 0 && formData.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-unidas-primary'
                    }`}
                    placeholder="Min. 4 caracteres, máx. 12"
                    required
                  />
                </div>
                {passwordErrors.length > 0 && formData.password && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm">
                    <p className="text-red-400 font-bold mb-2">Requisitos no cumplidos:</p>
                    <ul className="text-red-300 text-xs space-y-1">
                      {passwordErrors.map((err, idx) => (
                        <li key={idx}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {passwordErrors.length === 0 && formData.password && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 text-xs text-green-400 font-bold">
                    ✓ Contraseña válida
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={`w-full pl-14 pr-6 py-5 bg-white/5 border rounded-2xl transition-all outline-none font-bold text-white text-lg placeholder:text-white/5 ${
                      formData.confirm_password && formData.password !== formData.confirm_password 
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-white/5 focus:border-unidas-primary'
                    }`}
                    placeholder="Repite la contraseña"
                    required
                  />
                </div>
                {formData.confirm_password && formData.password !== formData.confirm_password && (
                  <p className="text-red-400 text-xs font-bold">Las contraseñas no coinciden</p>
                )}
                {formData.confirm_password && formData.password === formData.confirm_password && (
                  <p className="text-green-400 text-xs font-bold">✓ Las contraseñas coinciden</p>
                )}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3 text-red-500 bg-red-500/10 border border-red-500/20 p-5 rounded-2xl text-sm font-bold"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="pt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-gradient-to-r from-unidas-primary to-unidas-secondary text-white font-black rounded-2xl shadow-2xl shadow-unidas-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 text-xl"
              >
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <span>Confirmar Registro</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-16 pt-10 border-t border-white/5 text-center">
            <p className="text-white/30 font-medium">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="text-unidas-primary font-black hover:underline ml-1">
                Inicia Sesión aquí
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

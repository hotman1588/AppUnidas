import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LogIn, CreditCard, KeyRound, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setUser, setToken } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_number: documentNumber,
          password: password
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Credenciales inválidas');
      }

      const data = await response.json();
      const user = {
        uid: String(data.user.id),
        name: data.user.name,
        role: data.user.role as 'admin' | 'analyst' | 'user',
        email: ''
      };
      
      setUser(user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'analyst') navigate('/analyst');
      else navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error en el inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-unidas-dark relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-unidas-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-unidas-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 p-12 rounded-[3.5rem] shadow-2xl backdrop-blur-xl border border-white/10 overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-unidas-primary via-unidas-secondary to-unidas-accent" />
          
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-white/5 text-unidas-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10 group-hover:scale-110 transition-transform">
              <LogIn className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-white mb-4 font-display">Bienvenido</h1>
            <p className="text-white/40 font-medium italic">Ingresa tus credenciales para acceder al portal.</p>
            
            <div className="mt-8 p-4 bg-white/5 border border-white/5 rounded-2xl">
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-2">Credenciales de Acceso</p>
              <div className="grid grid-cols-1 gap-1 text-[11px] text-unidas-primary font-bold">
                <div>Usa tu documento y contraseña registrados.</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8" autoComplete="on">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Número de Documento</label>
              <div className="relative">
                <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                <input
                  type="text"
                  name="document_number"
                  id="document_number"
                  autoComplete="username"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 focus:border-unidas-primary rounded-2xl transition-all outline-none font-bold text-white text-lg placeholder:text-white/5"
                  placeholder="12345678"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 focus:border-unidas-primary rounded-2xl transition-all outline-none font-bold text-white text-lg placeholder:text-white/5"
                  placeholder="••••••••"
                  required
                />
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-unidas-primary to-unidas-secondary text-white font-black rounded-2xl shadow-2xl shadow-unidas-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 text-xl"
            >
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <span>Ingresar</span>
                  <ChevronRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-white/30 font-medium">
              ¿Eres nueva en UNIDAS?{' '}
              <Link to="/register" className="text-unidas-primary font-black hover:underline ml-1">
                Crea tu cuenta aquí
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

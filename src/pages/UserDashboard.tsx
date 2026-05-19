import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, Calendar, Bell, ShieldCheck, Clock, 
  MapPin, CheckCircle2, AlertCircle, ArrowRight, UserCircle2,
  FileSearch, Sparkles, XCircle, ChevronDown, Settings, KeyRound, LogOut
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';

export default function UserDashboard() {
  const { token, user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [surveyStatus, setSurveyStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);

  const [profileData, setProfileData] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [updateForm, setUpdateForm] = useState({ full_name: '', phone: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const surveyRes = await fetch('/api/user/survey', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const surveyData = await surveyRes.json();
        setSurveyStatus(surveyData);

        const historyRes = await fetch('/api/user/survey/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        setHistory(historyData);

        const eventsRes = await fetch('/api/user/events', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setUserEvents(eventsData);
        }

        const profileRes = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profData = await profileRes.json();
          setProfileData(profData);
          setUpdateForm({ full_name: profData.full_name || '', phone: profData.phone || '', email: profData.email || '' });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, searchParams]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateForm)
      });
      if (res.ok) {
        alert('Datos actualizados exitosamente');
        setShowUpdateModal(false);
        const profileRes = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

  const showConfirmation = searchParams.get('submitted') === 'true';

  if (loading) return null;

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': 
        return { 
          icon: Clock, 
          label: 'En Validación', 
          color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          desc: 'Un analista social está revisando tu información. Te notificaremos pronto.' 
        };
      case 'approved': 
        return { 
          icon: ShieldCheck, 
          label: 'Aprobada', 
          color: 'bg-green-500/10 text-green-500 border-green-500/20',
          desc: 'Tu encuesta ha sido validada con éxito. Ya puedes participar en eventos.' 
        };
      case 'rejected': 
        return { 
          icon: AlertCircle, 
          label: 'Requiere Ajustes', 
          color: 'bg-red-500/10 text-red-500 border-red-500/20',
          desc: 'Hay algunos detalles por corregir en tu encuesta. Por favor revisa las observaciones.' 
        };
      case 'rejected_final':
        return {
          icon: XCircle,
          label: 'Rechazada Definitivamente',
          color: 'bg-red-600/10 text-red-600 border-red-600/20',
          desc: 'Tu encuesta ha sido rechazada. Contacta a la institución para más detalles.'
        };
      default: 
        return { 
          icon: FileSearch, 
          label: 'Pendiente de Inicio', 
          color: 'bg-white/5 text-white/40 border-white/10',
          desc: 'Aún no has finalizado tu encuesta.' 
        };
    }
  };

  const statusInfo = getStatusDisplay(surveyStatus?.status || 'pending_start');

  return (
    <div className="min-h-screen bg-unidas-dark pb-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-unidas-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-unidas-secondary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        {showConfirmation && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 p-8 rounded-[2.5rem] mb-12 flex items-center space-x-6 backdrop-blur-xl"
          >
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">¡Encuesta enviada con éxito!</h3>
              <p className="text-white/50 font-medium">Su encuesta está en proceso de validación, espere un tiempo de 24 a 48 horas.</p>
            </div>
          </motion.div>
        )}

        {/* User Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-16 space-y-8 lg:space-y-0 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
          <div className="flex items-center space-x-8">
            <div className="w-24 h-24 bg-gradient-to-br from-unidas-primary to-unidas-secondary text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-unidas-primary/20 p-1">
              <div className="w-full h-full bg-unidas-dark rounded-[2.2rem] flex items-center justify-center">
                <UserCircle2 className="w-14 h-14 text-white" />
              </div>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 text-left group hover:opacity-80 transition-opacity"
              >
                <div>
                  <h1 className="text-5xl font-black text-white font-display mb-1">Hola, {user?.name}</h1>
                  <div className="flex items-center space-x-2 text-unidas-primary font-bold uppercase tracking-[0.2em] text-[10px]">
                     <Sparkles className="w-3 h-3" />
                     <span>Comunidad Unidas</span>
                  </div>
                </div>
                <ChevronDown className={`w-8 h-8 text-white/50 group-hover:text-white transition-all ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-4 w-64 bg-[#1a1b26] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <button 
                    onClick={() => { setShowProfileMenu(false); setShowUpdateModal(true); }}
                    className="w-full px-6 py-4 flex items-center space-x-3 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-bold">Actualizar Datos</span>
                  </button>
                  <button 
                    onClick={() => { setShowProfileMenu(false); setShowPasswordModal(true); }}
                    className="w-full px-6 py-4 flex items-center space-x-3 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left border-t border-white/5"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span className="text-sm font-bold">Cambiar Contraseña</span>
                  </button>
                  <button 
                    onClick={() => {
                      useAuthStore.getState().logout();
                      navigate('/');
                    }}
                    className="w-full px-6 py-4 flex items-center space-x-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left border-t border-white/5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-bold">Cerrar Sesión</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="px-8 py-4 rounded-2xl bg-white/5 border border-white/5 text-center">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Localidad</p>
              <p className="font-bold text-white">Barrios Unidos</p>
            </div>
            <div className={cn("px-8 py-4 rounded-2xl border font-black text-center min-w-[160px]", statusInfo.color)}>
              <p className="text-[10px] opacity-60 uppercase tracking-widest mb-1">Tu Estado</p>
              <p>{statusInfo.label}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Status Card */}
          <div className="lg:col-span-2 space-y-12">
            <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/10 flex flex-col md:flex-row items-center md:items-start space-y-10 md:space-y-0 md:space-x-12 relative overflow-hidden backdrop-blur-xl group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-unidas-primary via-unidas-secondary to-unidas-accent" />
              
              <div className={cn("w-32 h-32 rounded-[2.5rem] flex items-center justify-center flex-shrink-0 shadow-2xl transition-transform group-hover:scale-105", statusInfo.color)}>
                <statusInfo.icon className="w-16 h-16" />
              </div>
              <div className="flex-grow text-center md:text-left">
                <h2 className="text-3xl font-black text-white mb-4">Estado de la Encuesta</h2>
                <p className="text-white/50 mb-10 text-lg leading-relaxed font-medium">
                  {statusInfo.desc}
                </p>
                <button
                  disabled={surveyStatus?.status === 'pending' || surveyStatus?.status === 'approved' || surveyStatus?.status === 'rejected_final'}
                  onClick={() => navigate('/survey')}
                  className={cn(
                    "inline-flex items-center space-x-4 px-10 py-5 font-black rounded-2xl shadow-2xl transition-all text-xl cursor-pointer",
                    (surveyStatus?.status === 'pending' || surveyStatus?.status === 'approved' || surveyStatus?.status === 'rejected_final')
                      ? "bg-white/10 text-white/30 cursor-not-allowed border border-white/5 shadow-none"
                      : "bg-gradient-to-r from-unidas-primary to-unidas-accent text-white hover:scale-[1.02] active:scale-95 shadow-unidas-primary/40"
                  )}
                >
                  <span>
                    {surveyStatus?.status === 'pending'
                      ? 'Encuesta en Revisión'
                      : surveyStatus?.status === 'approved'
                        ? 'Encuesta Aprobada'
                        : surveyStatus?.status === 'rejected_final'
                          ? 'Encuesta Rechazada'
                          : surveyStatus?.status === 'rejected'
                            ? 'Corregir Encuesta'
                            : (surveyStatus?.answers && Object.keys(surveyStatus.answers).length > 0 ? 'Continuar Encuesta' : 'Comenzar Encuesta')}
                  </span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Events Section (Only if approved) */}
            <div className="space-y-8">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <div className="flex items-center space-x-2 text-unidas-secondary font-black uppercase tracking-widest text-[10px] mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Beneficios Institucionales</span>
                  </div>
                  <h3 className="text-4xl font-black text-white">Eventos y Talleres</h3>
                </div>
                {surveyStatus?.status === 'approved' && (
                  <button className="text-unidas-primary font-bold hover:underline mb-2">Ver catálogo completo</button>
                )}
              </div>

              {surveyStatus?.status === 'approved' ? (
                userEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {userEvents.map(evt => (
                      <div key={evt.id} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group scale-in overflow-hidden relative flex items-start space-x-6">
                        {/* Left: Premium Calendar Day Card */}
                        <div className="w-20 h-24 bg-gradient-to-br from-unidas-primary to-unidas-secondary rounded-2xl p-0.5 flex flex-col items-center justify-center text-center shadow-lg group-hover:scale-105 transition-transform flex-shrink-0">
                          <div className="w-full h-full bg-unidas-dark rounded-[14px] flex flex-col items-center justify-center p-2">
                            <span className="text-[10px] font-black text-unidas-primary uppercase tracking-widest leading-none mb-1">
                              {new Date(evt.date).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase()}
                            </span>
                            <span className="text-3xl font-black text-white leading-none">
                              {new Date(evt.date).getDate()}
                            </span>
                            <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-none mt-1">
                              {new Date(evt.date).toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Right: Info */}
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2 text-[10px] font-bold text-unidas-secondary uppercase tracking-widest mb-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Matriculado con Éxito</span>
                          </div>
                          <h4 className="text-xl font-black text-white leading-tight mb-2 group-hover:text-unidas-primary transition-colors">{evt.title}</h4>
                          <p className="text-white/40 text-xs mb-4 leading-relaxed font-medium line-clamp-2">{evt.description}</p>
                          
                          <div className="flex flex-wrap gap-2">
                            <div className="flex items-center space-x-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-[10px] font-bold text-white/60">
                              <Clock className="w-3 h-3 text-unidas-primary" />
                              <span>
                                {new Date(evt.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-[10px] font-bold text-white/60">
                              <MapPin className="w-3 h-3 text-unidas-secondary" />
                              <span>{evt.location || 'Casa del Cuidado'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[3rem] p-16 text-center backdrop-blur-sm">
                    <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/20 mx-auto mb-8 border border-white/5">
                      <Calendar className="w-10 h-10" />
                    </div>
                    <h4 className="text-2xl font-black text-white mb-4">Aún no te has inscrito a ningún evento</h4>
                    <p className="text-white/40 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                      Explora el catálogo oficial de talleres para solicitar tu matriculación y potenciar tu bienestar.
                    </p>
                  </div>
                )
              ) : (
                <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[3rem] p-16 text-center backdrop-blur-sm">
                  <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/20 mx-auto mb-8 border border-white/5">
                    <Calendar className="w-10 h-10" />
                  </div>
                  <h4 className="text-2xl font-black text-white mb-4">Módulo de Eventos Bloqueado</h4>
                  <p className="text-white/40 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                    Podrás inscribirte a eventos institucionales una vez que tu encuesta sea aprobada por un analista.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-12">
            {/* Notifications */}
            <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 backdrop-blur-xl">
              <h3 className="text-2xl font-black text-white mb-10 flex items-center space-x-4">
                <Bell className="w-7 h-7 text-unidas-primary" />
                <span>Noticias</span>
              </h3>
              <div className="space-y-8">
                <div className="flex space-x-6 group cursor-pointer">
                  <div className="w-1.5 h-12 bg-unidas-primary rounded-full group-hover:h-16 transition-all" />
                  <div className="flex-grow">
                    <p className="font-black text-white mb-1 group-hover:text-unidas-primary transition-colors">Bienvenida a UNIDAS</p>
                    <p className="text-xs text-white/40 font-medium">Tu cuenta ha sido creada con éxito.</p>
                  </div>
                </div>
                <div className="flex space-x-6 group cursor-pointer opacity-50">
                  <div className="w-1.5 h-12 bg-white/10 rounded-full" />
                  <div className="flex-grow">
                    <p className="font-black text-white mb-1">Guía de la Encuesta</p>
                    <p className="text-xs text-white/40 font-medium">Revisa los documentos necesarios.</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-12 py-5 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/5 rounded-2xl transition-all border border-white/5">
                Ver historial de avisos
              </button>
            </div>

            {/* Traceability Timeline */}
            <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 backdrop-blur-xl group">
              <h3 className="text-2xl font-black text-white mb-10 flex items-center space-x-4">
                <Clock className="w-7 h-7 text-unidas-accent" />
                <span>Hoja de Ruta</span>
              </h3>
              
              <div className="space-y-10 relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-2 bottom-0 w-0.5 bg-white/5" />
                
                {history.map((item, idx) => (
                  <div key={item.id} className="relative pl-16 group/item">
                    <div className={cn(
                      "absolute left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-unidas-dark z-10 transition-transform group-hover/item:scale-125",
                      idx === 0 ? "bg-unidas-accent shadow-[0_0_15px_rgba(255,100,200,0.5)]" : "bg-white/20"
                    )} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-unidas-accent uppercase tracking-widest mb-1">
                        {new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <p className="font-bold text-white text-sm mb-1">{item.action}</p>
                      <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{item.details}</p>
                    </div>
                  </div>
                ))}

                {history.length === 0 && (
                  <p className="text-white/20 text-xs italic pl-16">Sin registros de actividad aún.</p>
                )}
              </div>
            </div>

            {/* Quick Help */}
            <div className="bg-gradient-to-br from-unidas-secondary to-pink-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-unidas-secondary/30 relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10" />
              <h3 className="text-2xl font-black mb-4">¿Necesitas ayuda?</h3>
              <p className="text-white/70 text-lg mb-10 leading-relaxed font-medium">
                Contamos con una línea de atención prioritaria para resolver tus dudas sobre el proceso.
              </p>
              <button className="w-full py-5 bg-white text-unidas-secondary font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
                Hablar con Soporte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Update Profile Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
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
    </div>
  );
}

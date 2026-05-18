import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, Calendar, Bell, ShieldCheck, Clock, 
  MapPin, CheckCircle2, AlertCircle, ArrowRight, UserCircle2,
  FileSearch, Sparkles, XCircle
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, searchParams]);

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
            <div>
              <h1 className="text-5xl font-black text-white font-display mb-1">Hola, {user?.name.split(' ')[0]}</h1>
              <div className="flex items-center space-x-2 text-unidas-primary font-bold uppercase tracking-[0.2em] text-[10px]">
                 <Sparkles className="w-3 h-3" />
                 <span>Comunidad Unidas</span>
              </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[1, 2].map(evt => (
                    <div key={evt} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group scale-in overflow-hidden relative">
                      <div className="aspect-video bg-white/5 rounded-3xl mb-6 overflow-hidden relative">
                        <img src={`https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=400&auto=format&fit=crop&sig=${evt}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
                        <div className="absolute top-4 left-4 bg-unidas-dark/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                          15 Plazas Libres
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] font-bold text-unidas-secondary uppercase tracking-widest mb-3">
                        <Sparkles className="w-4 h-4" />
                        <span>Inscripciones Abiertas</span>
                      </div>
                      <h4 className="text-xl font-black text-white mb-4 leading-tight group-hover:text-unidas-primary transition-colors">Taller de Respiro y Bienestar Emocional</h4>
                      <div className="flex items-center space-x-6 text-sm text-white/40 font-bold">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>15 Jun</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Casa del Cuidado</span>
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
    </div>
  );
}

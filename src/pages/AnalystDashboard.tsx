import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, Clock, Search, Filter, Eye, CheckCircle2, XCircle, 
  AlertCircle, ChevronRight, MessageSquare, User, FileText, Calendar,
  Users, MapPin, ClipboardList, Plus, X, UserPlus
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';

import { DocumentViewer } from '../components/DocumentViewer';
import { PresentialSurveyModal } from '../components/PresentialSurveyModal';

export default function AnalystDashboard() {
  const { token } = useAuthStore();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<any>({});
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [surveyHistory, setSurveyHistory] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ status: 'approved', observations: '' });
  const [activeTab, setActiveTab] = useState('surveys');
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedEventForEnroll, setSelectedEventForEnroll] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewerConfig, setViewerConfig] = useState<{ url: string; title: string } | null>(null);
  const [showPresentialModal, setShowPresentialModal] = useState(false);

  useEffect(() => {
    fetchSurveys();
    fetchEvents();
    fetchUsers();
  }, [token]);

  const fetchSurveys = async () => {
    try {
      const res = await fetch('/api/admin/surveys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar encuestas');
      const data = await res.json();
      setSurveys(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events', { headers: { 'Authorization': `Bearer ${token}` } });
      setEventsList(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
      setAllUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleReviewOpen = async (survey: any) => {
    try {
      // Fetch answers
      const res = await fetch(`/api/admin/users/${survey.user_id}/survey`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSurveyAnswers(data.answers || {});

      // Fetch documents
      const docRes = await fetch(`/api/admin/users/${survey.user_id}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const docData = await docRes.json();
      setUserDocuments(docData || []);

      // Fetch history
      const historyRes = await fetch(`/api/admin/surveys/${survey.id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      setSurveyHistory(historyData || []);

      setSelectedSurvey(survey);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEnroll = async (event: any) => {
    setSelectedEventForEnroll(event);
    try {
      const res = await fetch(`/api/admin/events/${event.id}/attendees`, { headers: { 'Authorization': `Bearer ${token}` } });
      setAttendees(await res.json());
      setShowEnrollModal(true);
    } catch (err) { console.error(err); }
  };

  const handleEnrollUser = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/events/${selectedEventForEnroll.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        const attRes = await fetch(`/api/admin/events/${selectedEventForEnroll.id}/attendees`, { headers: { 'Authorization': `Bearer ${token}` } });
        setAttendees(await attRes.json());
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) { console.error(err); }
  };

  const handleReview = async () => {
    try {
      await fetch(`/api/admin/surveys/${selectedSurvey.id}/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(reviewForm)
      });
      setSelectedSurvey(null);
      fetchSurveys();
    } catch (err) {
      console.error(err);
    }
  };

  const surveysToDisplay = surveys.filter(s => s.status !== 'pending_start');
  const filteredSurveys = surveysToDisplay.filter(s => 
    s.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.document_number?.includes(searchTerm)
  );
  const pendingSurveys = surveysToDisplay.filter(s => s.status === 'pending');
  const pendingCount = pendingSurveys.length;

  if (loading) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 space-y-6 md:space-y-0">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 font-display">Bandeja de Validación</h1>
          <p className="text-slate-500 font-medium">Revisión documental y caracterización social</p>
        </div>
        <div className="flex items-center space-x-4 bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100">
           <Clock className="w-6 h-6 text-amber-600" />
           <div>
             <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
             <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Pendientes por revisar</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-unidas-primary/5 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setActiveTab('surveys')}
              className={cn("font-bold pb-1 transition-all", activeTab === 'surveys' ? "text-unidas-primary border-b-2 border-unidas-primary" : "text-slate-400 font-medium")}
            >
              Surveys
            </button>
            <button 
              onClick={() => setActiveTab('events')}
              className={cn("font-bold pb-1 transition-all", activeTab === 'events' ? "text-unidas-primary border-b-2 border-unidas-primary" : "text-slate-400 font-medium")}
            >
              Matriculación Eventos
            </button>
          </div>
          {activeTab === 'surveys' && (
            <div className="flex space-x-3 w-full md:w-auto">
              <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowPresentialModal(true)}
                className="flex items-center space-x-2 bg-unidas-primary text-white px-4 py-2 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-unidas-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Caracterización</span>
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-unidas-primary"
                />
              </div>
            </div>
              <button className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50">
                <Filter className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          )}
        </div>

        {activeTab === 'surveys' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Cuidadora</th>
                  <th className="px-8 py-5">Documento</th>
                  <th className="px-8 py-5">Progreso</th>
                  <th className="px-8 py-5">Recibido</th>
                  <th className="px-8 py-5 text-right">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSurveys.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{s.user_name}</p>
                          <p className="text-[10px] font-bold text-slate-400">
                             {s.status === 'pending' ? 'Pendiente' : 
                              s.status === 'approved' ? 'Aprobada' : 
                              s.status === 'rejected' ? 'Devuelta' : 
                              s.status === 'rejected_final' ? 'Rechazada' : 'Borrador'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-medium text-slate-600">{s.document_number}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn(
                            "h-full w-full transition-all",
                            s.status === 'approved' ? "bg-green-500" : 
                            s.status === 'pending' ? "bg-amber-500" : "bg-slate-300"
                          )} />
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                          s.status === 'approved' ? "bg-green-100 text-green-600" : 
                          s.status === 'pending' ? "bg-amber-100 text-amber-600" : 
                          s.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
                        )}>
                          {s.status === 'pending' ? 'Pendiente' : 
                           s.status === 'approved' ? 'Aprobada' : 
                           s.status === 'rejected' ? 'Devuelta' : 
                           s.status === 'rejected_final' ? 'Rechazada' : 'Borrador'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-medium text-slate-400 text-sm">
                      <div className="flex items-center space-x-2">
                         <Calendar className="w-4 h-4" />
                         <span>{new Date(s.updated_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button 
                          onClick={() => handleReviewOpen(s)}
                          className={cn(
                            "px-4 py-2 font-bold rounded-xl text-xs transition-all flex items-center space-x-2 ml-auto",
                            s.status === 'pending' 
                              ? "bg-unidas-primary text-white shadow-lg shadow-unidas-primary/20 hover:scale-105" 
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          )}
                        >
                         <Eye className="w-4 h-4" />
                         <span>{s.status === 'pending' ? 'Validar' : 'Ver Detalles'}</span>
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {surveysToDisplay.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-bold">¡Todo al día! No hay encuestas enviadas.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsList.map(e => (
              <div key={e.id} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                <h4 className="text-lg font-bold text-slate-900 mb-2">{e.title}</h4>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{e.description}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(e.date).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
                    <MapPin className="w-4 h-4" />
                    <span>{e.location}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenEnroll(e)}
                  className="w-full py-3 bg-unidas-primary text-white font-bold rounded-xl shadow-lg shadow-unidas-primary/20 flex items-center justify-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Matricular Usuarios</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {viewerConfig && (
          <DocumentViewer 
            url={viewerConfig.url} 
            title={viewerConfig.title} 
            onClose={() => setViewerConfig(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSurvey && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSurvey(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-unidas-dark rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] border border-white/10"
            >
              <div className="flex-grow overflow-y-auto p-12 border-r border-white/10 relative">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-black text-white font-display">Expediente Social</h3>
                  <button 
                    onClick={() => setSelectedSurvey(null)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all flex items-center space-x-2"
                  >
                    <X className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Volver</span>
                  </button>
                </div>
                <div className="space-y-10">
                  <Section title="Información Personal">
                    <DataRow label="Nombre Competo" value={selectedSurvey.user_name} />
                    <DataRow label="Documento" value={selectedSurvey.document_number} />
                    <DataRow label="Ubicación" value="Barrios Unidos / UPZ Doce de Octubre" />
                  </Section>

                  <Section title="Documentos Cargados">
                    <div className="grid grid-cols-3 gap-4">
                      {['id_frontal', 'id_reverso', 'utility_bill'].map(type => {
                        const doc = userDocuments.find(d => d.type === type);
                        const label = type === 'id_frontal' ? 'Cédula Front' : type === 'id_reverso' ? 'Cédula Back' : 'Servicio Púb.';
                        return (
                          <DocThumbnail 
                            key={type}
                            label={label} 
                            doc={doc}
                            onView={(url: string) => setViewerConfig({ url, title: label })}
                          />
                        );
                      })}
                    </div>
                  </Section>

                  <Section title="Respuestas de la Caracterización">
                    <div className="space-y-6">
                      {Object.keys(surveyAnswers).length === 0 ? (
                        <p className="text-white/30 text-xs italic">Cargando respuestas...</p>
                      ) : (
                        Object.entries(surveyAnswers).map(([module, moduleAnswers]: [string, any]) => (
                          <div key={module} className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <h5 className="text-[9px] font-black text-unidas-primary uppercase tracking-[0.2em] mb-4">{module}</h5>
                            <div className="space-y-3">
                              {Object.entries(moduleAnswers).map(([q, a]: [string, any]) => (
                                <div key={q} className="flex flex-col space-y-1">
                                  <span className="text-[10px] text-white/30 font-bold uppercase">{q.replace(/_/g, ' ')}</span>
                                  <span className="text-sm text-white/80 font-medium">{String(a)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Section>

                  <Section title="Historial y Trazabilidad">
                    <div className="space-y-4">
                      {surveyHistory.map((h) => (
                        <div key={h.id} className="flex space-x-4 group">
                          <div className="w-1 bg-white/10 rounded-full group-hover:bg-unidas-primary transition-all" />
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-[10px] font-black text-unidas-primary uppercase tracking-widest">{h.action}</span>
                              <span className="text-[10px] text-white/30 font-bold">•</span>
                              <span className="text-[10px] text-white/30 font-bold">{new Date(h.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed italic">"{h.details}"</p>
                            <p className="text-[8px] text-white/20 font-black uppercase tracking-tighter mt-1">Registrado por: {h.user_name}</p>
                          </div>
                        </div>
                      ))}
                      {surveyHistory.length === 0 && <p className="text-white/20 text-xs italic">Sin historial registrado.</p>}
                    </div>
                  </Section>
                </div>
              </div>

              <div className="w-full md:w-[320px] p-10 bg-white/5 flex flex-col justify-between backdrop-blur-md">
                <div>
                  <h4 className="text-lg font-black text-white mb-6 flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-unidas-primary" />
                    <span>Resolución</span>
                  </h4>
                  <div className="space-y-4 mb-8">
                    <ResolutionOption 
                      active={reviewForm.status === 'approved'} 
                      onClick={() => setReviewForm({...reviewForm, status: 'approved'})}
                      icon={CheckCircle2} 
                      label="Aprobar" 
                      color="text-green-500 bg-green-500/10" 
                    />
                    <ResolutionOption 
                      active={reviewForm.status === 'rejected'} 
                      onClick={() => setReviewForm({...reviewForm, status: 'rejected'})}
                      icon={AlertCircle} 
                      label="Solicitar Ajustes" 
                      color="text-amber-500 bg-amber-500/10" 
                    />
                    <ResolutionOption 
                      active={reviewForm.status === 'rejected_final'} 
                      onClick={() => setReviewForm({...reviewForm, status: 'rejected_final'})}
                      icon={XCircle} 
                      label="Rechazar" 
                      color="text-red-500 bg-red-500/10" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center space-x-2">
                      <MessageSquare className="w-3 h-3" />
                      <span>Observaciones</span>
                    </label>
                    <textarea 
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-white outline-none focus:border-unidas-primary text-sm h-32"
                      placeholder="Escribe comentarios..."
                      value={reviewForm.observations}
                      onChange={(e) => setReviewForm({...reviewForm, observations: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleReview}
                  className="w-full py-4 bg-gradient-to-r from-unidas-primary to-unidas-secondary text-white font-black rounded-2xl shadow-xl shadow-unidas-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-8"
                >
                  Confirmar Acción
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Enroll Modal */}
      <AnimatePresence>
        {showEnrollModal && selectedEventForEnroll && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEnrollModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Matriculación: {selectedEventForEnroll.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">Gestiona los asistentes a esta jornada social</p>
                </div>
                <button onClick={() => setShowEnrollModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              
              <div className="flex-grow overflow-hidden flex flex-col lg:flex-row">
                <div className="w-full lg:w-1/2 p-8 border-r border-slate-100 overflow-y-auto">
                  <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Matricular Nueva Cuidadora</span>
                  </h4>
                  <div className="space-y-4">
                    {allUsers.filter(u => u.role === 'user').map(u => {
                      const isEnrolled = attendees.some(a => a.document_number === u.document_number);
                      const isApproved = u.survey_status === 'approved';
                      
                      return (
                        <div key={u.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{u.full_name}</p>
                            <div className="flex items-center space-x-2">
                              <p className="text-[10px] font-mono text-slate-400">{u.document_type} {u.document_number}</p>
                              <span className={cn(
                                "text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter",
                                isApproved ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                              )}>
                                {u.survey_status || 'Sin encuesta'}
                              </span>
                            </div>
                          </div>
                          {isEnrolled ? (
                            <div className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase">Matriculada</div>
                          ) : isApproved ? (
                            <button onClick={() => handleEnrollUser(u.id)} className="px-4 py-2 bg-unidas-primary text-white text-xs font-bold rounded-xl hover:scale-105 transition-all shadow-lg shadow-unidas-primary/20">Matricular</button>
                          ) : (
                            <div className="px-3 py-1 bg-slate-200 text-slate-400 rounded-lg text-[10px] font-black uppercase">Pendiente Aprobación</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="w-full lg:w-1/2 p-8 bg-slate-50/30 overflow-y-auto">
                  <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center space-x-2">
                    <ClipboardList className="w-4 h-4" />
                    <span>Lista de Asistentes ({attendees.length})</span>
                  </h4>
                  <div className="space-y-3">
                    {attendees.length === 0 && <p className="text-center text-slate-400 py-10 italic">No hay cuidadoras matriculadas aún</p>}
                    {attendees.map(a => (
                      <div key={a.id} className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{a.full_name}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">{new Date(a.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Presential Survey Modal */}
      <PresentialSurveyModal 
        isOpen={showPresentialModal}
        onClose={() => setShowPresentialModal(false)}
        onSuccess={() => {
          fetchSurveys();
          fetchUsers();
        }}
        token={token}
      />
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">{title}</p>
      {children}
    </div>
  );
}

function DataRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5">
      <span className="text-white/40 font-bold text-sm tracking-tight">{label}</span>
      <span className="text-white font-black">{value}</span>
    </div>
  );
}

function DocThumbnail({ label, doc, onView }: any) {
  if (!doc) {
    return (
      <div className="aspect-square bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-4 opacity-30">
        <XCircle className="w-8 h-8 text-white/20 mb-2" />
        <span className="text-[9px] font-black text-white/20 text-center uppercase tracking-tighter">{label}</span>
        <span className="text-[7px] text-white/10 mt-1 uppercase">No cargado</span>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onView(doc.file_path)}
      className="aspect-square bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-4 hover:border-unidas-primary transition-all cursor-pointer group"
    >
      <FileText className="w-8 h-8 text-unidas-primary mb-2 transition-transform group-hover:scale-110" />
      <span className="text-[9px] font-black text-white/40 text-center uppercase tracking-tighter group-hover:text-white/60 transition-colors">{label}</span>
      <span className={cn(
        "text-[7px] font-black mt-2 px-2 py-0.5 rounded-full border",
        doc.status === 'approved' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      )}>
        {doc.status === 'approved' ? 'APROBADO' : 'PENDIENTE'}
      </span>
    </div>
  );
}

function ResolutionOption({ active, onClick, icon: Icon, label, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center space-x-4 px-4 py-4 rounded-xl border transition-all font-black text-xs uppercase tracking-widest",
        active ? "border-unidas-primary bg-white/10 text-white shadow-lg shadow-unidas-primary/20" : "border-transparent bg-white/5 text-white/20 hover:bg-white/10 hover:text-white/40"
      )}
    >
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <span>{label}</span>
    </button>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ClipboardCheck, Calendar, Bell, 
  TrendingUp, Download, PieChart as PieIcon,
  BarChart3, Settings, Search, Filter,
  MoreVertical, CheckCircle2, XCircle, Clock,
  Plus, Edit2, Shield, UserPlus, X, Lock,
  Newspaper, MapPin, Image, Trash2, ClipboardList,
  Sparkles, AlertCircle, FileText, Upload, ChevronLeft,
  Menu, MessageSquare
} from 'lucide-react';
import { DocumentType, DocumentTypeLabel, DOCUMENT_TYPES } from '../lib/documentTypes';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import { DocumentViewer } from '../components/DocumentViewer';

export default function AdminDashboard() {
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [analysts, setAnalysts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingSurvey, setEditingSurvey] = useState<any>(null);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [selectedEventForEnroll, setSelectedEventForEnroll] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<any>(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<any>({});
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [habeasDataPath, setHabeasDataPath] = useState<string | null>(null);
  const [uploadingHabeas, setUploadingHabeas] = useState(false);
  const [viewerConfig, setViewerConfig] = useState<{ url: string; title: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [surveyHistory, setSurveyHistory] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ status: 'approved', observations: '' });

  const [formData, setFormData] = useState({
    full_name: '',
    document_type: 'CC',
    document_number: '',
    phone: '',
    email: '',
    password: '',
    role: 'user'
  });

  const [newsFormData, setNewsFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    category: 'Institucional',
    is_active: true
  });

  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: 50,
    is_active: true
  });

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const statsRes = await fetch('/api/stats', { headers });
      if (statsRes.ok) setStats(await statsRes.json());

      const surveysRes = await fetch('/api/admin/surveys', { headers });
      if (surveysRes.ok) setSurveys(await surveysRes.json());

      const usersRes = await fetch('/api/admin/users', { headers });
      if (usersRes.ok) setAllUsers(await usersRes.json());

      const newsRes = await fetch('/api/admin/news', { headers });
      if (newsRes.ok) setNewsList(await newsRes.json());

      const eventsRes = await fetch('/api/admin/events', { headers });
      if (eventsRes.ok) setEventsList(await eventsRes.json());

      const analystsRes = await fetch('/api/admin/analysts-stats', { headers });
      if (analystsRes.ok) setAnalysts(await analystsRes.json());

      const settingsRes = await fetch('/api/settings/habeas_data');
      const settingsData = await settingsRes.json();
      setHabeasDataPath(settingsData.value);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción es irreversible.')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      document_type: 'CC',
      document_number: '',
      phone: '',
      email: '',
      password: '',
      role: 'user'
    });
    setFormError('');
    setShowUserModal(true);
  };

  const handleOpenEditUser = (user: any) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      document_type: user.document_type,
      document_number: user.document_number,
      phone: user.phone || '',
      email: user.email || '',
      password: '', // Keep empty to not change unless typed
      role: user.role
    });
    setFormError('');
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PATCH' : 'POST';
      
      const payload = { ...formData };
      if (editingUser && !payload.password) {
        delete (payload as any).password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar usuario');
      }

      await fetchData();
      setShowUserModal(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenSurvey = async (survey: any) => {
    setEditingSurvey(survey);
    setReviewForm({ status: survey.status === 'pending' ? 'approved' : survey.status, observations: '' });
    try {
      const res = await fetch(`/api/admin/users/${survey.user_id}/survey`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSurveyAnswers(data.answers || {});
      
      const docRes = await fetch(`/api/admin/users/${survey.user_id}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const docData = await docRes.json();
      setUserDocuments(docData || []);

      const historyRes = await fetch(`/api/admin/surveys/${survey.id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      setSurveyHistory(historyData || []);

      setShowSurveyModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSurvey = async () => {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/surveys/${editingSurvey.id}/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(reviewForm)
      });
      if (res.ok) {
        setShowSurveyModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // News Management
  const handleOpenNewsModal = (news: any = null) => {
    setEditingNews(news);
    setNewsFormData({
      title: news?.title || '',
      content: news?.content || '',
      image_url: news?.image_url || '',
      category: news?.category || 'Institucional',
      is_active: news ? !!news.is_active : true
    });
    setShowNewsModal(true);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = editingNews ? `/api/admin/news/${editingNews.id}` : '/api/admin/news';
      const res = await fetch(url, {
        method: editingNews ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newsFormData)
      });
      if (res.ok) {
        setShowNewsModal(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setFormLoading(false); }
  };

  const handleDeleteNews = async (id: number) => {
    if (!confirm('¿Eliminar esta noticia?')) return;
    try {
      await fetch(`/api/admin/news/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  // Event Management
  const handleOpenEventModal = (event: any = null) => {
    setEditingEvent(event);
    setEventFormData({
      title: event?.title || '',
      description: event?.description || '',
      date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : '',
      location: event?.location || '',
      capacity: event?.capacity || 50,
      is_active: event ? !!event.is_active : true
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = editingEvent ? `/api/admin/events/${editingEvent.id}` : '/api/admin/events';
      const res = await fetch(url, {
        method: editingEvent ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(eventFormData)
      });
      if (res.ok) {
        setShowEventModal(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setFormLoading(false); }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('¿Eliminar este evento?')) return;
    try {
      await fetch(`/api/admin/events/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleOpenEnroll = async (event: any) => {
    setSelectedEventForEnroll(event);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Cargar asistentes matriculados
      const attendeesRes = await fetch(`/api/admin/events/${event.id}/attendees`, { headers });
      const attendeesData = await attendeesRes.json();
      setAttendees(attendeesData);
      
      // Cargar usuarios disponibles para matricularse
      const availableRes = await fetch(`/api/admin/events/${event.id}/available-users`, { headers });
      const availableData = await availableRes.json();
      setAvailableUsers(availableData);
      
      // Cargar estadísticas de matriculación
      const statsRes = await fetch(`/api/admin/events/${event.id}/enrollment-stats`, { headers });
      const statsData = await statsRes.json();
      setEnrollmentStats(statsData);
      
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
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Actualizar asistentes
        const attRes = await fetch(`/api/admin/events/${selectedEventForEnroll.id}/attendees`, { headers });
        setAttendees(await attRes.json());
        
        // Actualizar usuarios disponibles
        const availRes = await fetch(`/api/admin/events/${selectedEventForEnroll.id}/available-users`, { headers });
        setAvailableUsers(await availRes.json());
        
        // Actualizar estadísticas
        const statsRes = await fetch(`/api/admin/events/${selectedEventForEnroll.id}/enrollment-stats`, { headers });
        setEnrollmentStats(await statsRes.json());
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) { console.error(err); }
  };

  const handleUnenrollUser = async (userId: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar a este cuidador del taller/evento?')) return;
    try {
      const res = await fetch(`/api/admin/events/${selectedEventForEnroll.id}/enroll/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Actualizar asistentes
        const attRes = await fetch(`/api/admin/events/${selectedEventForEnroll.id}/attendees`, { headers });
        setAttendees(await attRes.json());
        
        // Actualizar usuarios disponibles
        const availRes = await fetch(`/api/admin/events/${selectedEventForEnroll.id}/available-users`, { headers });
        setAvailableUsers(await availRes.json());
        
        // Actualizar estadísticas
        const statsRes = await fetch(`/api/admin/events/${selectedEventForEnroll.id}/enrollment-stats`, { headers });
        setEnrollmentStats(await statsRes.json());
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) { console.error(err); }
  };

  const handleHabeasUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHabeas(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('key', 'habeas_data');

    try {
      const res = await fetch('/api/admin/settings/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      const data = await res.json();
      if (res.ok) {
        setHabeasDataPath(data.path);
        alert('Documento de Habeas Data actualizado con éxito');
      } else {
        alert(data.error || 'Error al subir documento');
      }
    } catch (err) {
      console.error(err);
      alert('Error en la comunicación con el servidor');
    } finally {
      setUploadingHabeas(false);
    }
  };

  const exportToExcel = () => {
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden exportar el consolidado.');
      return;
    }

    // 1. Definir el orden lógico de los metadatos y de los módulos de la encuesta
    const baseHeaders = ['ID Encuesta', 'Nombre Cuidadora', 'Documento', 'Rol Activo', 'Estado', 'Fecha Actualización'];
    const moduleOrder = ['socio', 'economia', 'cuidado', 'bienestar', 'proyecciones', 'documentos'];
    const moduleLabels: Record<string, string> = {
      socio: 'PERFIL SOCIODEMOGRÁFICO',
      economia: 'ECONOMÍA Y AUTONOMÍA',
      cuidado: 'CARGA DE CUIDADO',
      bienestar: 'BIENESTAR Y SEGURIDAD',
      proyecciones: 'SUEÑOS Y PROYECCIONES',
      documentos: 'DOCUMENTOS DE SOPORTE'
    };

    // Colección de preguntas únicas detectadas por cada módulo
    const moduleColumns: Record<string, Set<string>> = {
      socio: new Set(),
      economia: new Set(),
      cuidado: new Set(),
      bienestar: new Set(),
      proyecciones: new Set(),
      documentos: new Set()
    };

    // 2. Escanear todas las encuestas para recopilar el universo completo de preguntas existentes
    surveys.forEach(s => {
      if (s.answers && typeof s.answers === 'object') {
        Object.entries(s.answers).forEach(([module, questions]: [string, any]) => {
          const modKey = module.toLowerCase();
          if (moduleColumns[modKey] && questions && typeof questions === 'object') {
            Object.keys(questions).forEach(q => {
              // Convertir "campo_de_ejemplo" a "Campo De Ejemplo" para presentación premium
              const cleanQuestion = q.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const prefix = moduleLabels[modKey] || module.toUpperCase();
              moduleColumns[modKey].add(`${prefix} - ${cleanQuestion}`);
            });
          }
        });
      }
    });

    // 3. Crear el listado final y ordenado de encabezados para el reporte Excel
    const orderedHeaders = [...baseHeaders];
    moduleOrder.forEach(mod => {
      const sortedCols = Array.from(moduleColumns[mod]).sort();
      orderedHeaders.push(...sortedCols);
    });

    // 4. Mapear cada encuesta a un objeto plano con las columnas estructuradas
    const flattenedData = surveys.map(s => {
      const flat: any = {
        'ID Encuesta': s.id,
        'Nombre Cuidadora': s.user_name,
        'Documento': s.document_number,
        'Rol Activo': s.user_role === 'admin' ? 'Administrador' : s.user_role === 'analyst' ? 'Analista' : 'Cuidadora',
        'Estado': s.status === 'approved' ? 'Aprobada' : s.status === 'pending' ? 'Pendiente' : 'Borrador',
        'Fecha Actualización': new Date(s.updated_at).toLocaleDateString(),
      };

      if (s.answers && typeof s.answers === 'object') {
        Object.entries(s.answers).forEach(([module, questions]: [string, any]) => {
          const modKey = module.toLowerCase();
          if (questions && typeof questions === 'object') {
            Object.entries(questions).forEach(([q, a]: [string, any]) => {
              const cleanQuestion = q.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const prefix = moduleLabels[modKey] || module.toUpperCase();
              flat[`${prefix} - ${cleanQuestion}`] = String(a);
            });
          }
        });
      }

      return flat;
    });

    // 5. Crear la hoja de cálculo con la ordenación estricta de encabezados por módulo
    const ws = XLSX.utils.json_to_sheet(flattenedData, { header: orderedHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Respuestas Consolidadas");
    XLSX.writeFile(wb, "UNIDAS_Consolidado_Encuestas.xlsx");
  };

  const COLORS = ['#7C3AED', '#DB2777', '#10B981', '#F59E0B'];

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-unidas-dark relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-unidas-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-unidas-secondary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 bg-white/5 border-r border-white/10 p-10 pt-24 relative z-20 backdrop-blur-xl">
        <div className="mb-12 px-2">
          <h2 className="text-unidas-primary font-black uppercase tracking-[0.3em] text-[10px] mb-2 flex items-center space-x-2">
            <Shield className="w-3 h-3" />
            <span>Admin Suite</span>
          </h2>
          <p className="text-white font-black text-2xl font-display">UNIDAS Cloud</p>
        </div>
        <div className="space-y-4">
          <SidebarItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={BarChart3} label="Vista General" />
          <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Usuarios y Roles" />
          <SidebarItem active={activeTab === 'caracterizacion'} onClick={() => setActiveTab('caracterizacion')} icon={ClipboardCheck} label="Encuesta" />
          <SidebarItem active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={Calendar} label="Eventos" />
          <SidebarItem active={activeTab === 'analysts'} onClick={() => setActiveTab('analysts')} icon={Shield} label="Bandeja de Analistas" />
          <SidebarItem active={activeTab === 'news'} onClick={() => setActiveTab('news')} icon={Bell} label="Noticias" />
          <div className="pt-10">
             <SidebarItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Configuración" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-10 pt-14 relative z-10 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 space-y-6 md:space-y-0">
            <div className="w-full md:w-auto">
              <div className="flex items-center space-x-2 text-unidas-secondary font-black uppercase tracking-widest text-[10px] mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Panel de Control Institucional</span>
              </div>
              <div className="flex items-center justify-between md:justify-start md:space-x-6 mb-4">
                <h1 className="text-4xl md:text-5xl font-black text-white font-display leading-none">Administración</h1>
                <button 
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden px-5 py-3 bg-white/5 border border-white/10 text-white font-black rounded-2xl flex items-center space-x-3 hover:bg-white/10 active:scale-95 transition-all shadow-xl"
                >
                  <Menu className="w-5 h-5 text-unidas-primary" />
                  <span className="text-[10px] uppercase tracking-wider">Menú</span>
                </button>
              </div>
              <p className="text-white/40 font-medium text-lg italic">Gestión integral del sistema UNIDAS</p>
            </div>
            {user?.role === 'admin' && (
              <button 
                onClick={exportToExcel}
                className="px-8 py-4 bg-white/5 border border-white/5 text-white font-black rounded-2xl flex items-center space-x-4 hover:bg-white/10 transition-all shadow-2xl"
              >
                <Download className="w-6 h-6 text-unidas-primary" />
                <span>Exportar Consolidado</span>
              </button>
            )}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-16">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard icon={Users} color="bg-unidas-primary" label="Usuarios Totales" value={stats.totalUsers} trend="+12% mensual" />
                <StatCard icon={ClipboardCheck} color="bg-unidas-accent" label="Encuestas Aprobadas" value={stats.completedSurveys} trend="+8% mensual" />
                <StatCard icon={Clock} color="bg-amber-500" label="Pendientes Validación" value={stats.pendingSurveys} trend="-5% semanal" />
                <StatCard icon={Calendar} color="bg-unidas-secondary" label="Eventos Activos" value={stats.registeredEvents} trend="Estable" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-white/5 p-12 rounded-[3.5rem] border border-white/10 backdrop-blur-xl">
                  <h3 className="text-2xl font-black text-white mb-12 flex items-center space-x-4">
                    <TrendingUp className="w-8 h-8 text-unidas-primary" />
                    <span>Tendencia de Registro</span>
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.registryTrend?.length ? stats.registryTrend : (() => {
                        const fallback = [];
                        for (let i = 6; i >= 0; i--) {
                          const d = new Date();
                          d.setDate(d.getDate() - i);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          fallback.push({ name: `${day}/${month}`, val: 0 });
                        }
                        return fallback;
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900 }} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                          contentStyle={{ backgroundColor: '#13111C', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                          itemStyle={{ color: '#fff', fontWeight: 900 }}
                        />
                        <Bar dataKey="val" fill="url(#colorBar)" radius={[12, 12, 4, 4]} barSize={45}>
                          <defs>
                            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7C3AED" stopOpacity={1}/>
                              <stop offset="100%" stopColor="#DB2777" stopOpacity={1}/>
                            </linearGradient>
                          </defs>
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/10 backdrop-blur-xl">
                  <h3 className="text-2xl font-black text-white mb-12 flex items-center space-x-4">
                    <PieIcon className="w-8 h-8 text-unidas-secondary" />
                    <span>Segmentación</span>
                  </h3>
                  <div className="h-80 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.educationDist?.length ? stats.educationDist : [
                            { label: 'Primaria', value: 0 }, { label: 'Secundaria', value: 0 }, { label: 'Técnico', value: 0 }
                          ]}
                          innerRadius={80}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                          nameKey="label"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#13111C', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <span className="text-white/20 font-black text-sm uppercase tracking-widest">Educación</span>
                    </div>
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {(stats.educationDist?.length ? stats.educationDist : [
                      { label: 'Primaria', value: 0 }, { label: 'Secundaria', value: 0 }, { label: 'Técnico', value: 0 }
                    ]).map((item: any, i: number) => (
                      <div key={i} className="flex items-center space-x-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                         <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                         <span className="text-[9px] font-black text-white/40 uppercase truncate">{item.label} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity Table */}
              <div className="bg-white/5 rounded-[4rem] border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="p-12 border-b border-white/10 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
                  <div>
                    <h3 className="text-3xl font-black text-white mb-2">Últimos Registros</h3>
                    <p className="text-white/30 font-medium italic">Actividad de las últimas 24 horas</p>
                  </div>
                  <div className="flex space-x-4">
                    <div className="relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-unidas-primary transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Buscar por cédula..." 
                        className="pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm outline-none focus:border-unidas-primary text-white font-bold w-72"
                      />
                    </div>
                    <button className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                      <Filter className="w-6 h-6 text-white/40" />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto px-6 pb-6">
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-8 py-8">Mujer / Cuidadora</th>
                        <th className="px-8 py-8">Documento</th>
                        <th className="px-8 py-8">Estado</th>
                        <th className="px-8 py-8">Fecha</th>
                        <th className="px-8 py-8 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {surveys.slice(0, 5).map((s) => (
                        <tr key={s.id} className="group hover:bg-white/5 transition-all rounded-2xl">
                          <td className="px-8 py-8">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-unidas-primary group-hover:bg-unidas-primary group-hover:text-white transition-colors">
                                {(s.full_name || 'U')[0]}
                              </div>
                              <div>
                                <p className="font-black text-white text-lg">{s.full_name || 'Usuario'}</p>
                                <p className="text-xs text-white/30 font-medium italic">Bogotá D.C.</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-8 font-bold text-white/60 tabular-nums">{s.document_number}</td>
                          <td className="px-8 py-8">
                            <span className={cn(
                              "px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest",
                              s.status === 'approved' ? "bg-green-500/10 text-green-500" : 
                              s.status === 'pending' ? "bg-amber-500/10 text-amber-500" : "bg-white/5 text-white/30"
                            )}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-8 py-8 font-black text-white/20">{new Date(s.created_at).toLocaleDateString()}</td>
                          <td className="px-8 py-8 text-right">
                             <button className="p-4 bg-white/5 border border-white/5 rounded-2xl group-hover:bg-unidas-primary group-hover:text-white transition-all">
                               <MoreVertical className="w-5 h-5" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white/5 rounded-[4rem] border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="p-12 border-b border-white/10 flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
                <div>
                  <h3 className="text-3xl font-black text-white mb-2">Gestión de Usuarios</h3>
                  <p className="text-white/30 font-medium italic">Control de roles y accesos institucionales</p>
                </div>
                <div className="flex space-x-6">
                  <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-unidas-primary" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o documento..." 
                      className="pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm outline-none focus:border-unidas-primary text-white font-bold min-w-[320px]"
                    />
                  </div>
                  <button 
                    onClick={handleOpenCreateUser}
                    className="px-8 py-4 bg-unidas-primary text-white font-black rounded-2xl flex items-center space-x-3 shadow-2xl shadow-unidas-primary/30 hover:scale-105 transition-all"
                  >
                    <Plus className="w-6 h-6" />
                    <span>Nuevo Usuario</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto px-6 pb-6">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-8 py-8">Usuario</th>
                      <th className="px-8 py-8">Documento</th>
                      <th className="px-8 py-8">Contacto</th>
                      <th className="px-8 py-8">Rol</th>
                      <th className="px-8 py-8 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="group hover:bg-white/5 transition-all">
                        <td className="px-8 py-8">
                          <p className="font-black text-white text-lg">{u.full_name}</p>
                          <p className="text-[10px] text-white/20 font-mono italic">{u.email}</p>
                        </td>
                        <td className="px-8 py-8 font-bold text-white/60">{u.document_type} {u.document_number}</td>
                        <td className="px-8 py-8 font-bold text-white/40">{u.phone}</td>
                        <td className="px-8 py-8">
                          <select 
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className={cn(
                              "px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest outline-none border border-white/5 cursor-pointer bg-white/5",
                              u.role === 'admin' ? "text-purple-400 border-purple-500/20" : 
                              u.role === 'analyst' ? "text-blue-400 border-blue-500/20" : "text-white/40"
                            )}
                          >
                            <option value="user" className="bg-unidas-dark">Cuidadora</option>
                            <option value="analyst" className="bg-unidas-dark">Analista</option>
                            <option value="admin" className="bg-unidas-dark">Administrador</option>
                          </select>
                        </td>
                        <td className="px-8 py-8 text-right">
                          <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                              onClick={() => handleOpenEditUser(u)}
                              className="p-3 text-white/40 hover:text-unidas-primary hover:bg-unidas-primary/10 rounded-xl border border-white/5 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-3 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl border border-white/5 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'caracterizacion' && (
            <div className="bg-white/5 rounded-[4rem] border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="p-12 border-b border-white/10">
                <h3 className="text-3xl font-black text-white mb-2">Encuesta Social</h3>
                <p className="text-white/30 font-medium italic">Consolidado de cuidadoras identificadas</p>
              </div>
              <div className="overflow-x-auto px-6 pb-6">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-8 py-8">Nombre</th>
                      <th className="px-8 py-8">Cédula</th>
                      <th className="px-8 py-8">Estado</th>
                      <th className="px-8 py-8">Análisis</th>
                      <th className="px-8 py-8 text-right">Ficha</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {surveys.map((s) => (
                      <tr key={s.id} className="group hover:bg-white/5 transition-all">
                        <td className="px-8 py-8 font-black text-white text-lg">{s.full_name || 'Usuario'}</td>
                        <td className="px-8 py-8 font-bold text-white/60 tabular-nums">{s.document_number}</td>
                        <td className="px-8 py-8">
                          <span className={cn(
                            "px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest",
                            s.status === 'approved' ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-8 py-8 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white/20 font-medium italic">
                          {s.analyst_summary || "Sin análisis previo"}
                        </td>
                        <td className="px-8 py-8 text-right">
                          <button 
                            onClick={() => handleOpenSurvey(s)}
                            className="text-unidas-primary font-black text-[10px] uppercase tracking-widest bg-unidas-primary/5 px-6 py-3 rounded-2xl border border-unidas-primary/10 hover:bg-unidas-primary hover:text-white transition-all shadow-xl shadow-unidas-primary/10"
                          >
                            Expediente
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end space-y-6 md:space-y-0">
                <div>
                  <h3 className="text-4xl font-black text-white mb-3">Eventos y Jornadas</h3>
                  <p className="text-white/30 font-medium italic">Manejo de capacidad y matriculación social</p>
                </div>
                <button 
                  onClick={() => handleOpenEventModal()}
                  className="px-8 py-4 bg-unidas-secondary text-white font-black rounded-2xl flex items-center space-x-3 shadow-2xl shadow-unidas-secondary/30 hover:scale-[1.02] transition-all"
                >
                  <Plus className="w-6 h-6" />
                  <span>Crear Evento</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {eventsList.map((e) => (
                  <div key={e.id} className="bg-white/5 rounded-[3rem] p-10 border border-white/10 hover:bg-white/10 transition-all group relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[4rem]" />
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border", e.is_active ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-white/20 border-white/5 bg-white/5")}>
                        {e.is_active ? 'Activo' : 'Finalizado'}
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleOpenEventModal(e)} className="p-3 text-white/20 hover:text-unidas-primary hover:bg-white/5 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteEvent(e.id)} className="p-3 text-white/20 hover:text-red-500 hover:bg-white/5 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    
                    <h4 className="text-2xl font-black text-white mb-4 leading-tight group-hover:text-unidas-primary transition-colors">{e.title}</h4>
                    <p className="text-sm text-white/40 line-clamp-2 mb-8 font-medium italic">{e.description}</p>
                    
                    <div className="space-y-4 mb-10">
                      <div className="flex items-center space-x-4 text-xs text-white/30 font-black uppercase tracking-widest">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-unidas-primary" />
                        </div>
                        <span>{new Date(e.date).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-white/30 font-black uppercase tracking-widest">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-unidas-secondary" />
                        </div>
                        <span className="truncate">{e.location}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-white/30 font-black uppercase tracking-widest">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-unidas-accent" />
                        </div>
                        <span>Cupos: {attendees.filter(a => a.event_id === e.id).length} / {e.capacity}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleOpenEnroll(e)}
                      className="w-full py-5 bg-gradient-to-r from-unidas-primary to-unidas-secondary text-white font-black rounded-2xl shadow-xl shadow-unidas-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
                    >
                      Matricular Cuidadoras
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analysts' && (
            <div className="space-y-12">
              <div>
                <h3 className="text-4xl font-black text-white mb-3">Bandeja de Analistas</h3>
                <p className="text-white/30 font-medium italic">Supervisión de casos en revisión por los analistas</p>
              </div>

              {/* Analysts Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {analysts.length > 0 && (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-3">Total de Analistas</p>
                      <p className="text-5xl font-black text-unidas-primary">{analysts.length}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-3">Casos Aprobados</p>
                      <p className="text-5xl font-black text-green-500">{analysts.reduce((sum, a) => sum + (a.approved_cases || 0), 0)}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-3">Casos Pendientes</p>
                      <p className="text-5xl font-black text-yellow-500">{analysts.reduce((sum, a) => sum + (a.pending_cases || 0), 0)}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-3">Casos Rechazados</p>
                      <p className="text-5xl font-black text-red-500">{analysts.reduce((sum, a) => sum + (a.rejected_cases || 0) + (a.final_rejected_cases || 0), 0)}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Analysts Table */}
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-white/2">
                  <h4 className="text-2xl font-black text-white">Detalle de Analistas</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/2 border-b border-white/5">
                      <tr>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-white/40 uppercase tracking-widest">Analista</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Aprobadas</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Pendientes</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Rechazadas</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Definitivas</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {analysts.map(analyst => (
                        <tr key={analyst.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-6">
                            <div>
                              <p className="font-black text-white">{analyst.full_name}</p>
                              <p className="text-[10px] text-white/30 font-mono">{analyst.email}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-center">
                              <p className="text-2xl font-black text-green-500">{analyst.approved_cases || 0}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-center">
                              <p className="text-2xl font-black text-yellow-500">{analyst.pending_cases || 0}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-center">
                              <p className="text-2xl font-black text-orange-500">{analyst.rejected_cases || 0}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-center">
                              <p className="text-2xl font-black text-red-500">{analyst.final_rejected_cases || 0}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-center">
                              <p className="text-2xl font-black text-unidas-primary">{analyst.total_cases || 0}</p>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {analysts.length === 0 && (
                  <div className="p-16 text-center">
                    <Shield className="w-16 h-16 text-white/10 mx-auto mb-4" />
                    <p className="text-white/30 font-medium">No hay analistas registrados en el sistema</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end space-y-6 md:space-y-0">
                <div>
                  <h3 className="text-4xl font-black text-white mb-3">Noticias y Avisos</h3>
                  <p className="text-white/30 font-medium italic">Publicaciones destacadas en el banner principal</p>
                </div>
                <button 
                  onClick={() => handleOpenNewsModal()}
                  className="px-8 py-4 bg-unidas-accent text-white font-black rounded-2xl flex items-center space-x-3 shadow-2xl shadow-unidas-accent/30 hover:scale-[1.02] transition-all"
                >
                  <Plus className="w-6 h-6" />
                  <span>Redactar Noticia</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {newsList.map((n) => (
                  <div key={n.id} className="bg-white/5 rounded-[4rem] overflow-hidden border border-white/10 flex flex-col md:flex-row group relative backdrop-blur-xl hover:bg-white/10 transition-all">
                    <div className="w-full md:w-56 h-64 md:h-auto overflow-hidden relative">
                      <img src={n.image_url} alt={n.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-unidas-dark via-transparent to-transparent md:bg-gradient-to-r" />
                    </div>
                    <div className="flex-grow p-10 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-[10px] font-black text-unidas-secondary uppercase tracking-[0.2em] bg-unidas-secondary/10 px-4 py-2 rounded-xl border border-unidas-secondary/20">{n.category}</span>
                          <div className="flex space-x-2">
                             <button onClick={() => handleOpenNewsModal(n)} className="p-3 text-white/20 hover:text-unidas-primary hover:bg-white/5 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                             <button onClick={() => handleDeleteNews(n.id)} className="p-3 text-white/20 hover:text-red-500 hover:bg-white/5 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <h4 className="text-2xl font-black text-white mb-4 leading-tight group-hover:text-unidas-primary transition-colors">{n.title}</h4>
                        <p className="text-sm text-white/30 line-clamp-3 mb-6 font-medium italic">{n.content}</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-black text-white/10 uppercase tracking-widest">
                        <span>Publicado: {new Date(n.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center space-x-2">
                          <div className={cn("w-2 h-2 rounded-full", n.is_active ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-white/10")} />
                          <span className={n.is_active ? "text-green-500/40" : "text-white/10"}>
                            {n.is_active ? 'Visible en Web' : 'Borrador'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-12">
              <div>
                <h3 className="text-4xl font-black text-white mb-3">Configuraciones Globales</h3>
                <p className="text-white/30 font-medium italic">Gestión de parámetros y documentos legales del sistema</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white/5 p-12 rounded-[4rem] border border-white/10 backdrop-blur-xl group">
                  <div className="flex items-center space-x-6 mb-10">
                    <div className="w-16 h-16 bg-unidas-primary/10 rounded-3xl flex items-center justify-center text-unidas-primary border border-unidas-primary/20">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white mb-1">Habeas Data</h4>
                      <p className="text-white/30 text-xs font-medium italic">Documento de política de tratamiento de datos</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {habeasDataPath ? (
                      <div className="p-6 bg-white/5 rounded-3xl border border-unidas-primary/10 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <FileText className="w-8 h-8 text-unidas-primary" />
                          <div>
                            <p className="text-white font-bold text-sm">Política Actual Cargada</p>
                            <button 
                              onClick={() => setViewerConfig({ url: habeasDataPath || '', title: 'Habeas Data' })}
                              className="text-[10px] font-black text-unidas-secondary uppercase tracking-widest hover:underline"
                            >
                              Visualizar Documento
                            </button>
                          </div>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center">
                        <AlertCircle className="w-10 h-10 text-amber-500/40 mb-4" />
                        <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No se ha cargado la política aún</p>
                      </div>
                    )}

                    <div className="relative">
                      <input 
                        type="file" 
                        id="habeas-upload" 
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                        onChange={handleHabeasUpload}
                        disabled={uploadingHabeas}
                      />
                      <label 
                        htmlFor="habeas-upload"
                        className={cn(
                          "w-full py-5 bg-white/5 border border-white/5 text-white font-black rounded-2xl flex items-center justify-center space-x-4 hover:bg-white/10 transition-all cursor-pointer",
                          uploadingHabeas && "opacity-50 cursor-wait"
                        )}
                      >
                        <Upload className="w-6 h-6 text-unidas-primary" />
                        <span>{uploadingHabeas ? 'Subiendo...' : (habeasDataPath ? 'Actualizar Documento' : 'Cargar Documento PDF')}</span>
                      </label>
                    </div>
                    <p className="text-[10px] text-white/20 text-center font-medium italic">
                      Este documento será accesible para todas las usuarias al momento de aceptar el tratamiento de datos.
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 p-12 rounded-[4rem] border border-white/10 backdrop-blur-xl opacity-50">
                  <div className="flex items-center space-x-6 mb-10">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-white/20">
                      <Lock className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white/40 mb-1">Más Configuraciones</h4>
                      <p className="text-white/10 text-xs font-medium italic">Próximamente: Términos y Condiciones generales</p>
                    </div>
                  </div>
                  <div className="h-40 flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl">
                     <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">Modulo en desarrollo</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {viewerConfig && (
          <DocumentViewer 
            url={viewerConfig.url} 
            title={viewerConfig.title} 
            onClose={() => setViewerConfig(null)} 
          />
        )}
      </AnimatePresence>

      {/* User Management Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-unidas-dark/95 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#13111C] border border-white/10 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-unidas-primary/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="p-12 border-b border-white/5 flex justify-between items-center relative z-10">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-unidas-primary to-unidas-secondary rounded-3xl flex items-center justify-center text-white shadow-xl">
                  {editingUser ? <Edit2 className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white leading-none mb-2">
                    {editingUser ? 'Perfil Institucional' : 'Alta de Usuario'}
                  </h3>
                  <p className="text-white/30 font-medium italic">Acceso y privilegios del sistema</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUserModal(false)}
                className="p-4 hover:bg-white/5 rounded-2xl transition-all text-white/20 hover:text-white"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-12 space-y-8 relative z-10">
              {formError && (
                <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl text-sm font-black uppercase tracking-widest flex items-center space-x-4">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Nombre Completo</label>
                  <input 
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Ej. María Pérez"
                    className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-unidas-primary transition-all font-bold text-white placeholder:text-white/10"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Tipo de Documento</label>
                  <div className="relative">
                    <select
                      name="document_type"
                      value={formData.document_type}
                      onChange={(e) => setFormData({...formData, document_type: e.target.value})}
                      className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-unidas-primary transition-all font-bold text-white appearance-none cursor-pointer"
                      required
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-unidas-dark">
                          {type} - {DocumentTypeLabel[type as DocumentType]}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronLeft className="w-5 h-5 -rotate-90 text-white/20" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Número de Documento</label>
                  <input 
                    required
                    type="text"
                    value={formData.document_number}
                    onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                    placeholder="Número de documento"
                    className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-unidas-primary transition-all font-bold text-white placeholder:text-white/10"
                  />
                </div>
                <div className="space-y-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Correo Electrónico</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="usuario@dominio.com"
                    className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-unidas-primary transition-all font-bold text-white placeholder:text-white/10"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Celular / Contacto</label>
                  <input 
                    required
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="300 000 0000"
                    className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-unidas-secondary transition-all font-bold text-white placeholder:text-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Contraseña (Mín. 4 caracteres)</label>
                  <input 
                    required={!editingUser}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editingUser ? "••••" : "Por defecto: 1234"}
                    className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-unidas-accent transition-all font-bold text-white placeholder:text-white/10"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Rol Asignado</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['user', 'analyst', 'admin'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({...formData, role: r})}
                        className={cn(
                          "py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          formData.role === r 
                            ? "bg-unidas-primary border-unidas-primary text-white shadow-lg shadow-unidas-primary/20" 
                            : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10"
                        )}
                      >
                        {r === 'user' ? 'Mujer' : r === 'analyst' ? 'Analista' : 'Admin'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-6 pt-10">
                <button 
                  type="button" 
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-5 bg-white/5 text-white/40 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="flex-[2] py-5 bg-gradient-to-r from-unidas-primary to-unidas-secondary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-2xl shadow-unidas-primary/30 hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 animate-pulse" />
                  <span className="relative z-10">{formLoading ? 'Procesando...' : editingUser ? 'Actualizar Perfil' : 'Dar de Alta'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Survey Review Modal */}
      {showSurveyModal && editingSurvey && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-unidas-dark/95 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#13111C] border border-white/10 rounded-[3.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
          >
            {/* Left Panel - Information Viewer */}
            <div className="flex-grow overflow-y-auto p-12 border-r border-white/10 relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-unidas-primary/10 rounded-3xl flex items-center justify-center text-unidas-primary border border-unidas-primary/20">
                    <ClipboardCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white mb-1">Expediente Social</h3>
                    <p className="text-white/30 font-medium italic">Revisión documental y encuesta social</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSurveyModal(false)}
                  className="p-4 hover:bg-white/5 rounded-2xl transition-all text-white/20 hover:text-white"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-12">
                {/* Profile Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-white/5 rounded-[3rem] border border-white/5">
                  <div>
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">Nombre Completo</label>
                    <p className="text-xl font-black text-white">{editingSurvey.full_name || editingSurvey.user_name || 'Cuidadora'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">Documento</label>
                    <p className="text-xl font-black text-white/60 tabular-nums">{editingSurvey.document_number}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">Ubicación</label>
                    <p className="text-xl font-black text-unidas-secondary">Barrios Unidos</p>
                  </div>
                </div>

                {/* Support Documents Section */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-unidas-primary uppercase tracking-[0.3em] flex items-center space-x-3">
                    <FileText className="w-5 h-5" />
                    <span>Documentos de Soporte</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['id_frontal', 'id_reverso', 'utility_bill'].map(type => {
                      const doc = userDocuments.find(d => d.type === type);
                      const label = type === 'id_frontal' ? 'Cédula Frontal' : type === 'id_reverso' ? 'Cédula Reverso' : 'Recibo';
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
                </div>

                {/* Survey Answers Section */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-unidas-primary uppercase tracking-[0.3em] flex items-center space-x-3">
                    <ClipboardList className="w-5 h-5" />
                    <span>Respuestas de la Encuesta</span>
                  </h4>
                  <div className="space-y-6">
                    {Object.keys(surveyAnswers).length === 0 ? (
                      <p className="text-white/30 text-xs italic">Cargando respuestas...</p>
                    ) : (
                      Object.entries(surveyAnswers).map(([module, moduleAnswers]: [string, any]) => (
                        <div key={module} className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                          <h5 className="text-[10px] font-black text-unidas-primary uppercase tracking-[0.2em] mb-6">{module}</h5>
                          <div className="space-y-4">
                            {Object.entries(moduleAnswers).map(([q, a]: [string, any]) => (
                              <div key={q} className="flex flex-col space-y-1">
                                <span className="text-[9px] text-white/30 font-black uppercase tracking-wider">{q.replace(/_/g, ' ')}</span>
                                <span className="text-sm text-white/80 font-medium">{String(a)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Tracking / History Section */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-unidas-primary uppercase tracking-[0.3em] flex items-center space-x-3">
                    <Clock className="w-5 h-5" />
                    <span>Historial y Trazabilidad</span>
                  </h4>
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
                </div>
              </div>
            </div>

            {/* Right Panel - Resolution Drawer */}
            <div className="w-full md:w-[360px] p-10 bg-white/5 flex flex-col justify-between backdrop-blur-md">
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
                onClick={handleReviewSurvey}
                disabled={formLoading}
                className="w-full py-4 bg-gradient-to-r from-unidas-primary to-unidas-secondary text-white font-black rounded-2xl shadow-xl shadow-unidas-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-8 relative overflow-hidden"
              >
                {formLoading ? 'Procesando...' : 'Confirmar Acción'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* News Modal */}
      {showNewsModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-unidas-dark/95 backdrop-blur-2xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#13111C] border border-white/10 rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/2">
              <h3 className="text-3xl font-black text-white">{editingNews ? 'Redactar Noticia' : 'Nueva Noticia'}</h3>
              <button onClick={() => setShowNewsModal(false)} className="p-4 hover:bg-white/5 rounded-2xl transition-all text-white/20 hover:text-white"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={handleSaveNews} className="p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Título de la Publicación</label>
                  <input required value={newsFormData.title} onChange={e => setNewsFormData({...newsFormData, title: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-unidas-secondary" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Categoría</label>
                  <select value={newsFormData.category} onChange={e => setNewsFormData({...newsFormData, category: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-unidas-secondary">
                    <option value="Institucional" className="bg-unidas-dark text-white">Institucional</option>
                    <option value="Salud" className="bg-unidas-dark text-white">Salud</option>
                    <option value="Educación" className="bg-unidas-dark text-white">Educación</option>
                    <option value="Cultura" className="bg-unidas-dark text-white">Cultura</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">URL de la Imagen (Banner)</label>
                <input required value={newsFormData.image_url} onChange={e => setNewsFormData({...newsFormData, image_url: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-unidas-secondary" placeholder="https://..." />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Contenido de la Noticia</label>
                <textarea required rows={5} value={newsFormData.content} onChange={e => setNewsFormData({...newsFormData, content: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-unidas-secondary" />
              </div>
              <div className="flex items-center space-x-4 py-4 px-6 bg-white/5 rounded-2xl border border-white/5">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={newsFormData.is_active} onChange={e => setNewsFormData({...newsFormData, is_active: e.target.checked})} id="news_active" className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-unidas-secondary shadow-inner"></div>
                </div>
                <label htmlFor="news_active" className="text-sm font-black text-white/40 uppercase tracking-widest">Publicar en el Inicio</label>
              </div>
              <div className="flex space-x-6 pt-6">
                <button type="button" onClick={() => setShowNewsModal(false)} className="flex-1 py-5 bg-white/5 text-white/40 font-black rounded-2xl uppercase tracking-widest text-xs">Cancelar</button>
                <button type="submit" disabled={formLoading} className="flex-[2] py-5 bg-unidas-secondary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-2xl shadow-unidas-secondary/30 hover:scale-[1.02] transition-all">
                  {formLoading ? 'Procesando...' : 'Publicar Noticia'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-unidas-dark/95 backdrop-blur-2xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#13111C] border border-white/10 rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/2">
              <h3 className="text-3xl font-black text-white">{editingEvent ? 'Configurar Evento' : 'Nueva Jornada'}</h3>
              <button onClick={() => setShowEventModal(false)} className="p-4 hover:bg-white/5 rounded-2xl transition-all text-white/20 hover:text-white"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={handleSaveEvent} className="p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Título de la Jornada</label>
                  <input required value={eventFormData.title} onChange={e => setEventFormData({...eventFormData, title: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-unidas-primary" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Fecha y Hora</label>
                  <input required type="datetime-local" value={eventFormData.date} onChange={e => setEventFormData({...eventFormData, date: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-unidas-primary [color-scheme:dark]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Lugar / Ubicación</label>
                  <input required value={eventFormData.location} onChange={e => setEventFormData({...eventFormData, location: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-unidas-primary" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Capacidad Máxima</label>
                  <input required type="number" value={eventFormData.capacity} onChange={e => setEventFormData({...eventFormData, capacity: Number(e.target.value)})} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-unidas-primary" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Descripción General</label>
                <textarea required rows={4} value={eventFormData.description} onChange={e => setEventFormData({...eventFormData, description: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-unidas-primary" />
              </div>
              <div className="flex items-center space-x-4 py-4 px-6 bg-white/5 rounded-2xl border border-white/5">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={eventFormData.is_active} onChange={e => setEventFormData({...eventFormData, is_active: e.target.checked})} id="event_active" className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-unidas-primary shadow-inner"></div>
                </div>
                <label htmlFor="event_active" className="text-sm font-black text-white/40 uppercase tracking-widest">Activar Convocatoria</label>
              </div>
              <div className="flex space-x-6 pt-6">
                <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 py-5 bg-white/5 text-white/40 font-black rounded-2xl uppercase tracking-widest text-xs">Cancelar</button>
                <button type="submit" disabled={formLoading} className="flex-[2] py-5 bg-unidas-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-2xl shadow-unidas-primary/30 hover:scale-[1.02] transition-all">
                  {formLoading ? 'Procesando...' : 'Confirmar Evento'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && selectedEventForEnroll && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-unidas-dark/95 backdrop-blur-2xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#13111C] border border-white/10 rounded-[4rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/2">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-unidas-primary to-unidas-secondary rounded-3xl flex items-center justify-center text-white shadow-xl">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white leading-none mb-2">Matriculación</h3>
                  <p className="text-white/30 font-medium italic truncate max-w-sm">Jornada: {selectedEventForEnroll.title}</p>
                </div>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="p-4 hover:bg-white/5 rounded-2xl transition-all text-white/20 hover:text-white"><X className="w-8 h-8" /></button>
            </div>

            {/* Enrollment Statistics */}
            {enrollmentStats && (
              <div className="px-12 py-8 bg-white/[0.02] border-b border-white/5 grid grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest font-black mb-1">Matriculadas</p>
                  <p className="text-3xl font-black text-unidas-primary">{enrollmentStats.enrolled_count}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest font-black mb-1">Disponibles</p>
                  <p className="text-3xl font-black text-unidas-secondary">{enrollmentStats.available_count}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest font-black mb-1">Capacidad</p>
                  <p className="text-3xl font-black text-unidas-accent">{enrollmentStats.capacity}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest font-black mb-1">Cupos Restantes</p>
                  <p className={`text-3xl font-black ${enrollmentStats.remaining_capacity > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.max(0, enrollmentStats.remaining_capacity)}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex-grow overflow-hidden flex flex-col lg:flex-row">
              <div className="w-full lg:w-1/2 p-12 border-r border-white/5 overflow-y-auto">
                <h4 className="text-[10px] font-black text-unidas-primary uppercase tracking-[0.3em] mb-10 flex items-center space-x-3">
                  <UserPlus className="w-5 h-5 text-unidas-primary" />
                  <span>Candidatas Disponibles ({availableUsers.length})</span>
                </h4>
                <div className="space-y-4">
                  {availableUsers.length === 0 && (
                    <div className="bg-white/2 rounded-3xl p-16 border border-white/5 border-dashed flex flex-col items-center justify-center text-center">
                      <Users className="w-12 h-12 text-white/10 mb-4" />
                      <p className="text-white/20 font-medium italic">Todas las candidatas disponibles ya están matriculadas</p>
                    </div>
                  )}
                  {availableUsers.map(u => (
                    <div key={u.id} className="p-6 bg-white/2 rounded-3xl flex justify-between items-center border border-white/5 group hover:bg-white/5 transition-all">
                      <div>
                        <p className="text-lg font-black text-white">{u.full_name}</p>
                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{u.document_type} {u.document_number}</p>
                      </div>
                      <button 
                        onClick={() => handleEnrollUser(u.id)} 
                        className="px-6 py-3 bg-unidas-primary/10 text-unidas-primary text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-unidas-primary hover:text-white transition-all border border-unidas-primary/20"
                      >
                        Matricular
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="w-full lg:w-1/2 p-12 bg-white/[0.01] overflow-y-auto">
                <h4 className="text-[10px] font-black text-unidas-secondary uppercase tracking-[0.3em] mb-10 flex items-center space-x-3">
                  <ClipboardList className="w-5 h-5 text-unidas-secondary" />
                  <span>Listado de Asistencia ({attendees.length})</span>
                </h4>
                <div className="space-y-4">
                  {attendees.length === 0 && (
                    <div className="bg-white/2 rounded-3xl p-16 border border-white/5 border-dashed flex flex-col items-center justify-center text-center">
                      <Users className="w-12 h-12 text-white/10 mb-4" />
                      <p className="text-white/20 font-medium italic">No hay cuidadoras matriculadas aún en esta jornada</p>
                    </div>
                  )}
                  {attendees.map(a => (
                    <div key={a.id} className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-unidas-secondary to-unidas-accent flex items-center justify-center font-black text-white shadow-lg">
                          {a.full_name[0]}
                        </div>
                        <div>
                          <p className="text-base font-black text-white">{a.full_name}</p>
                          <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest">Registrada: {new Date(a.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                        <button
                          onClick={() => handleUnenrollUser(a.user_id)}
                          className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-md flex items-center justify-center cursor-pointer"
                          title="Eliminar matrícula"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[110] lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-unidas-dark/80 backdrop-blur-sm"
            />
            {/* Drawer Content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 bottom-0 left-0 w-80 bg-[#13111C] border-r border-white/10 p-10 pt-24 z-50 flex flex-col"
            >
              <div className="mb-12 px-2 flex justify-between items-center">
                <div>
                  <h2 className="text-unidas-primary font-black uppercase tracking-[0.3em] text-[10px] mb-2 flex items-center space-x-2">
                    <Shield className="w-3 h-3" />
                    <span>Admin Suite</span>
                  </h2>
                  <p className="text-white font-black text-2xl font-display">UNIDAS Cloud</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <SidebarItem active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }} icon={BarChart3} label="Vista General" />
                <SidebarItem active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }} icon={Users} label="Usuarios y Roles" />
                <SidebarItem active={activeTab === 'caracterizacion'} onClick={() => { setActiveTab('caracterizacion'); setMobileMenuOpen(false); }} icon={ClipboardCheck} label="Encuesta" />
                <SidebarItem active={activeTab === 'events'} onClick={() => { setActiveTab('events'); setMobileMenuOpen(false); }} icon={Calendar} label="Eventos" />
                <SidebarItem active={activeTab === 'analysts'} onClick={() => { setActiveTab('analysts'); setMobileMenuOpen(false); }} icon={Shield} label="Bandeja de Analistas" />
                <SidebarItem active={activeTab === 'news'} onClick={() => { setActiveTab('news'); setMobileMenuOpen(false); }} icon={Bell} label="Noticias" />
                <div className="pt-10">
                   <SidebarItem active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }} icon={Settings} label="Configuración" />
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-black transition-all text-[11px] uppercase tracking-[0.1em]",
        active ? "bg-unidas-primary text-white shadow-2xl shadow-unidas-primary/30" : "text-white/20 hover:text-white/40 hover:bg-white/5"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-white" : "text-unidas-primary")} />
      <span>{label}</span>
    </button>
  );
}

function StatCard({ icon: Icon, color, label, value, trend }: any) {
  return (
    <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-all">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-[3rem]" />
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110", color)}>
          <Icon className="w-7 h-7" />
        </div>
        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
           <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{trend}</span>
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-black text-white mb-2 font-display tabular-nums">{value}</p>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{label}</p>
      </div>
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

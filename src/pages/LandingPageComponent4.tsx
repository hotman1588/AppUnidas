import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ArrowRight, Newspaper, Calendar,
  X, Shield, Users, Search, Heart, BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

// ─── Brand palette ───────────────────────────────────────────────────────────
const C = {
  U:  '#209AD0',
  n:  '#D93654',
  i:  '#F8A45C',
  d:  '#468587',
  o:  '#209AD0',
  s:  '#F8A45C',
  navy:    '#191D35',
  blue:    '#A2C3F4',
  salmon:  '#F0947E',
  yellow:  '#F9F7A1',
  teal:    '#8CCFD6',
  purple:  '#B86E9D',
  gold:    '#E1B307',
  rose:    '#E17A93',
};

function UnidosLogo({ size = 'xl' }: { size?: 'sm' | 'md' | 'xl' }) {
  const sizes = { sm: 'text-[54px]', md: 'text-[90px]', xl: 'text-[135px] lg:text-[195px]' };
  return (
    <div
      className={`tracking-tight leading-none ${sizes[size]}`}
      style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontWeight: 700 }}
    >
      <span style={{ color: C.U }}>U</span>
      <span style={{ color: C.n }}>n</span>
      <span style={{ color: C.i }}>i</span>
      <span style={{ color: C.d }}>d</span>
      <span style={{ color: C.o }}>o</span>
      <span style={{ color: C.s }}>s</span>
    </div>
  );
}

const FEATURES = [
  {
    icon: Search,
    title: 'Caracterización y Diagnóstico',
    desc: 'Identificamos factores asociados a la violencia familiar y sexual mediante datos cuantitativos y cualitativos con enfoque diferencial.',
    bg: C.blue,
    text: C.navy,
  },
  {
    icon: Shield,
    title: 'Estrategias de Prevención',
    desc: 'Diseño e implementación de acciones coordinadas que transforman factores sociales generadores de violencia, promoviendo convivencia y derechos.',
    bg: C.teal,
    text: C.navy,
  },
  {
    icon: Users,
    title: 'Grupos Focales Comunitarios',
    desc: 'Trabajo con comunidades diversas —afrodescendientes, indígenas, migrantes— para fortalecer redes de apoyo y garantizar derechos.',
    bg: C.salmon,
    text: C.navy,
  },
];

const PHASES = [
  { num: '01', label: 'Formulación y Preparación', desc: 'Definición de objetivos, antecedentes, contexto e identificación de variables e indicadores.' },
  { num: '02', label: 'Diseño de Instrumentos', desc: 'Encuestas, entrevistas y grupos focales adaptados a los enfoques diferencial y de género.' },
  { num: '03', label: 'Aplicación y Recolección', desc: 'Aplicación de instrumentos de diagnóstico y caracterización en la localidad.' },
  { num: '04', label: 'Sistematización', desc: 'Base de datos estructurada y análisis estadístico con matriz de priorización de necesidades.' },
  { num: '05', label: 'Análisis y Resultados', desc: 'Análisis estadístico y cualitativo; cruce de evidencia cuantitativa con patrones y ciclos de violencia.' },
  { num: '06', label: 'Informe y Recomendaciones', desc: 'Presentación de resultados y recomendaciones para orientar futuras políticas de inversión local.' },
];

export default function LandingPageComponent4() {
  const [stats, setStats] = useState({ totalUsers: 0, completedSurveys: 0, registeredEvents: 0 });
  const [news, setNews] = useState<any[]>([]);
  const [selectedNews, setSelectedNews] = useState<any>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
    fetch('/api/news').then(r => r.json()).then(setNews).catch(() => {});
  }, []);

  return (
    <div className="overflow-hidden relative" style={{ background: '#FAFBFF', color: C.navy }}>

      {/* ─── FONDO GLOBAL ─────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url("/imagen%20fondo%20componente%204.jpg?v=2")',
          backgroundSize: '100% auto',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'local',
          opacity: 0.1,
          zIndex: 0,
        }}
      />

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-32 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] rounded-full opacity-20 blur-[100px]"
            style={{ background: C.blue }} />
          <div className="absolute bottom-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full opacity-20 blur-[100px]"
            style={{ background: C.rose }} />
          <div className="absolute top-[30%] right-[15%] w-[200px] h-[200px] rounded-full opacity-15 blur-[80px]"
            style={{ background: C.yellow }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            >
              {/* Badge */}
              <div
                className="inline-flex items-center space-x-2 px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest mb-8 border"
                style={{ background: `${C.blue}30`, borderColor: `${C.blue}60`, color: C.navy }}
              >
                <Shield className="w-4 h-4" style={{ color: C.d }} />
                <span>Prevención de Violencia</span>
              </div>

              {/* Logo */}
              <UnidosLogo size="xl" />
              <p
                className="text-2xl lg:text-3xl font-black uppercase tracking-[0.15em] mt-2 mb-10"
                style={{ color: C.navy }}
              >
                por nuestra familia
              </p>

              <p className="text-xl mb-12 max-w-lg leading-relaxed font-medium" style={{ color: C.navy }}>
                Gestión e implementación de acciones para la <strong style={{ color: C.d }}>prevención de violencias</strong> en el contexto familiar y sexual, promoviendo los derechos de niñas, niños, adolescentes y familias de <strong style={{ color: C.U }}>Barrios Unidos</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="px-10 py-5 font-black rounded-2xl shadow-xl flex items-center justify-center space-x-3 group transition-all hover:scale-105 active:scale-95 text-white"
                  style={{ background: C.navy, boxShadow: `0 20px 40px ${C.navy}40` }}
                >
                  <span>Participar Ahora</span>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#about"
                  className="px-10 py-5 font-black rounded-2xl border-2 flex items-center justify-center transition-all hover:scale-105"
                  style={{ borderColor: C.d, color: C.d, background: `${C.d}10` }}
                >
                  Conocer más
                </a>
              </div>
            </motion.div>

            {/* Right column — visual card stack */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="relative flex justify-center"
            >
              <div className="relative w-full max-w-md">
                {/* Back card */}
                <div
                  className="absolute top-6 left-6 right-0 h-full rounded-[3rem] opacity-50"
                  style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.teal})` }}
                />
                {/* Main card */}
                <div
                  className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4"
                  style={{ borderColor: 'white' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=900&auto=format&fit=crop"
                    alt="Familia Barrios Unidos"
                    className="w-full h-[500px] object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to top, ${C.navy}CC, transparent 60%)` }}
                  />
                  {/* Overlay badge */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <div
                      className="rounded-2xl p-5"
                      style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)' }}
                    >
                      <p className="text-white font-black text-lg">Meta de la Vigencia</p>
                      <p className="text-white/80 text-sm font-medium mt-1">
                        Vincular <span className="font-black text-white text-xl" style={{ color: C.yellow }}>100 personas</span> en procesos de prevención de violencias
                      </p>
                    </div>
                  </div>
                </div>
                {/* Decorative dots */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-30" style={{ background: C.gold }} />
                <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full opacity-30" style={{ background: C.purple }} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="py-16 relative overflow-hidden" style={{ background: C.navy }}>
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 text-center text-white">
            {[
              { val: '100', label: 'Personas Meta', color: C.yellow },
              { val: `+${stats.totalUsers || 240}`, label: 'Participantes', color: C.blue },
              { val: `+${stats.registeredEvents || 15}`, label: 'Actividades Realizadas', color: C.teal },
              { val: '100%', label: 'Enfoque Diferencial', color: C.rose },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-5xl font-black mb-2" style={{ color: s.color }}>{s.val}</p>
                <p className="text-white/50 font-bold uppercase tracking-widest text-xs">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-32 relative" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/95 rounded-[3rem] p-10 shadow-lg">
          <div className="text-center mb-24">
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: C.d }}>Nuestros Pilares</p>
            <h2 className="text-5xl font-black mb-6" style={{ color: C.navy }}>Tres Ejes de Acción</h2>
            <div className="w-20 h-1.5 mx-auto rounded-full mb-8" style={{ background: C.n }} />
            <p className="max-w-2xl mx-auto text-xl leading-relaxed font-medium" style={{ color: C.navy }}>
              Actuamos de manera coordinada desde los enfoques diferencial, de género, interseccional e intercultural para transformar contextos de violencia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="group rounded-[2.5rem] p-10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                style={{ background: `${f.bg}55`, border: `2px solid ${f.bg}99` }}
              >
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-10 text-white group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl"
                  style={{ background: f.bg }}
                >
                  <f.icon className="w-10 h-10" style={{ color: f.text }} />
                </div>
                <h3 className="text-2xl font-black mb-4" style={{ color: C.navy }}>{f.title}</h3>
                <p className="leading-relaxed font-medium" style={{ color: C.navy }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT / PHASES ───────────────────────────────────────────────── */}
      <section id="about" className="py-32 relative" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/95 rounded-[3rem] p-10 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

            {/* Left: description */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: C.U }}>Componente 4</p>
              <h2 className="text-4xl font-black mb-8 leading-tight" style={{ color: C.navy }}>
                Prevención de Violencia<br />
                <span style={{ color: C.n }}>en el Contexto Familiar</span><br />
                y Violencia Sexual
              </h2>
              <div className="space-y-5 font-medium leading-relaxed" style={{ color: C.navy }}>
                <p>
                  El objetivo del componente es gestionar e implementar acciones y procesos de
                  <strong style={{ color: C.navy }}> prevención de violencia en el contexto familiar, sexual</strong> y otras
                  vulneraciones, así como la <strong style={{ color: C.navy }}>promoción de los derechos</strong> de las niñas,
                  los niños, adolescentes y las familias de la localidad de Barrios Unidos.
                </p>
                <p>
                  El componente orienta sus acciones desde una perspectiva de
                  <strong style={{ color: C.d }}> inclusión y equidad</strong>, reconociendo la diversidad étnica,
                  territorial, cultural y psicosocial de las comunidades participantes.
                </p>
                <p>
                  La caracterización identifica, analiza y comprende los factores asociados a la
                  ocurrencia de violencias, cruzando evidencia cuantitativa (estadísticas oficiales y
                  encuestas) y cualitativa (patrones y ciclos de violencia) para formular
                  recomendaciones que orientan acciones de prevención y atención.
                </p>
              </div>

              {/* Enfoques tags */}
              <div className="flex flex-wrap gap-3 mt-10">
                {['Enfoque Diferencial', 'Género', 'Interseccional', 'Intercultural', 'Poblacional'].map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider"
                    style={{ background: `${C.teal}30`, color: C.d, border: `1px solid ${C.teal}` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right: phases timeline */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <p className="text-xs font-black uppercase tracking-widest mb-6" style={{ color: C.n }}>Etapas del Proceso</p>
              {PHASES.map((ph, i) => {
                const phaseColors = [C.U, C.n, C.i, C.d, C.purple, C.gold];
                const col = phaseColors[i];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start space-x-5 p-5 rounded-2xl transition-all hover:shadow-md"
                    style={{ background: `${col}30`, border: `2px solid ${col}80` }}
                  >
                    <span
                      className="text-3xl font-black shrink-0 leading-none"
                      style={{ color: col, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {ph.num}
                    </span>
                    <div>
                      <p className="font-black text-sm mb-1" style={{ color: C.navy }}>{ph.label}</p>
                      <p className="text-xs leading-relaxed font-medium" style={{ color: C.navy }}>{ph.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
          </div>
        </div>
      </section>

      {/* ─── NEWS SECTION ─────────────────────────────────────────────────── */}
      <section className="py-32 relative" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/95 rounded-[3rem] p-10 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl lg:text-5xl font-black mb-6 flex items-center space-x-4" style={{ color: C.navy }}>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${C.blue}40` }}
                >
                  <Newspaper className="w-6 h-6" style={{ color: C.U }} />
                </div>
                <span>Noticias y Convocatorias</span>
              </h2>
              <p className="font-medium text-xl leading-relaxed" style={{ color: C.navy }}>
                Mantente informada sobre las últimas jornadas sociales y eventos comunitarios en Barrios Unidos.
              </p>
            </div>
            <Link
              to="/news"
              className="flex items-center space-x-2 font-bold hover:underline py-2"
              style={{ color: C.U }}
            >
              <span>Ver todas las noticias</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {news.length > 0 && (
            <div className="space-y-12">
              {/* Hero news */}
              <div
                onClick={() => setSelectedNews(news[0])}
                className="group cursor-pointer rounded-[3rem] border overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col lg:flex-row items-center"
                style={{ background: 'white', borderColor: `${C.blue}40` }}
              >
                <div className="w-full lg:w-1/2 p-8 lg:p-12">
                  <div className="flex items-center space-x-3 text-[12px] font-bold uppercase tracking-widest mb-6" style={{ color: C.d }}>
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(news[0].created_at).toLocaleDateString()}</span>
                  </div>
                  <h3
                    className="text-3xl lg:text-4xl font-black mb-6 leading-tight transition-colors"
                    style={{ color: C.navy }}
                  >
                    {news[0].title}
                  </h3>
                  <p className="text-lg leading-relaxed font-medium mb-8" style={{ color: C.navy }}>
                    {news[0].content.length > 200 ? news[0].content.substring(0, 200) + '...' : news[0].content}
                  </p>
                  <div className="inline-flex items-center space-x-2 font-bold group-hover:translate-x-2 transition-transform" style={{ color: C.n }}>
                    <span>Leer nota completa</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
                <div className="w-full lg:w-1/2 p-4" style={{ background: `${C.blue}15` }}>
                  <img
                    src={news[0].image_url}
                    className="w-full h-auto max-h-[460px] object-contain rounded-[2rem] group-hover:scale-[1.02] transition-transform duration-700"
                    alt={news[0].title}
                  />
                </div>
              </div>

              {/* Grid news */}
              {news.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {news.slice(1).map((item, idx) => {
                    const cardColors = [C.teal, C.rose, C.yellow, C.blue, C.purple, C.salmon];
                    const cc = cardColors[idx % cardColors.length];
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedNews(item)}
                        className="group cursor-pointer rounded-[2.5rem] border overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 flex flex-col"
                        style={{ background: 'white', borderColor: `${cc}40` }}
                      >
                        <div className="p-4" style={{ background: `${cc}20` }}>
                          <img
                            src={item.image_url}
                            className="w-full h-auto max-h-[220px] object-contain rounded-2xl group-hover:scale-[1.05] transition-transform duration-700"
                            alt={item.title}
                          />
                        </div>
                        <div className="p-7 flex-grow flex flex-col">
                          <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: C.d }}>
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-xl font-black mb-3 leading-snug" style={{ color: C.navy }}>{item.title}</h3>
                          <p className="text-sm leading-relaxed font-medium mb-5 flex-grow" style={{ color: C.navy }}>
                            {item.content.length > 110 ? item.content.substring(0, 110) + '...' : item.content}
                          </p>
                          <div className="inline-flex items-center space-x-2 font-bold text-sm group-hover:translate-x-2 transition-transform" style={{ color: C.n }}>
                            <span>Leer nota completa</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {news.length === 0 && (
            <div className="text-center py-20" style={{ color: `${C.navy}40` }}>
              <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-bold text-lg">No hay noticias disponibles en este momento.</p>
            </div>
          )}

          {/* News modal */}
          <AnimatePresence>
            {selectedNews && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                style={{ background: 'rgba(25,29,53,0.85)', backdropFilter: 'blur(8px)' }}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="w-full max-w-5xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
                  style={{ background: 'white', border: `2px solid ${C.blue}50` }}
                >
                  <div
                    className="flex justify-between items-center p-6 border-b shrink-0"
                    style={{ borderColor: `${C.blue}30` }}
                  >
                    <div className="flex items-center space-x-3 font-bold uppercase tracking-widest text-[10px]" style={{ color: C.d }}>
                      <Newspaper className="w-5 h-5" />
                      <span>Noticias y Convocatorias</span>
                    </div>
                    <button
                      onClick={() => setSelectedNews(null)}
                      className="p-3 rounded-xl transition-all hover:scale-110"
                      style={{ background: `${C.navy}10`, color: C.navy }}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="overflow-y-auto p-8 lg:p-12 space-y-10 custom-scrollbar">
                    <div className="text-center">
                      <div
                        className="inline-flex items-center space-x-3 text-sm font-bold uppercase tracking-widest mb-6 px-6 py-2 rounded-full"
                        style={{ background: `${C.teal}30`, color: C.d }}
                      >
                        <Calendar className="w-5 h-5" />
                        <span>
                          {new Date(selectedNews.created_at).toLocaleDateString('es-ES', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-5xl font-black leading-tight max-w-4xl mx-auto" style={{ color: C.navy }}>
                        {selectedNews.title}
                      </h2>
                    </div>
                    <div className="rounded-[2.5rem] p-4 mx-auto max-w-4xl" style={{ background: `${C.blue}15` }}>
                      <img
                        src={selectedNews.image_url}
                        className="w-full h-auto max-h-[500px] object-contain rounded-3xl"
                        alt={selectedNews.title}
                      />
                    </div>
                    <div className="max-w-4xl mx-auto text-lg md:text-xl leading-relaxed font-medium whitespace-pre-wrap" style={{ color: C.navy }}>
                      {selectedNews.content}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: '#F4F7FF' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl"
            style={{ background: C.navy }}
          >
            {/* Decorative color strips */}
            <div className="absolute top-0 left-0 w-full h-2 flex">
              {[C.U, C.n, C.i, C.d, C.o, C.s].map((col, i) => (
                <div key={i} className="flex-1" style={{ background: col }} />
              ))}
            </div>
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,0 L100,100 M100,0 L0,100" stroke="white" strokeWidth="0.5" />
              </svg>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <UnidosLogo size="md" />
              <p className="text-white/60 font-black uppercase tracking-[0.2em] text-sm mb-8 mt-2">por nuestra familia</p>

              <h2 className="text-4xl lg:text-5xl font-black text-white mb-8 leading-tight">
                Juntos construimos<br />
                <span style={{ color: C.yellow }}>entornos seguros</span> para las familias.
              </h2>
              <p className="text-xl mb-12 max-w-2xl mx-auto font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Únete al proceso de prevención de violencia en la localidad Barrios Unidos. Tu participación transforma la comunidad.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Link
                  to="/register"
                  className="px-10 py-5 font-black rounded-2xl shadow-xl flex items-center justify-center group transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'white', color: C.navy }}
                >
                  <span>Registrarme Gratis</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="px-10 py-5 font-black rounded-2xl border-2 border-white/30 text-white flex items-center justify-center transition-all hover:bg-white/10"
                >
                  <Heart className="w-5 h-5 mr-2" style={{ color: C.rose }} />
                  Ya tengo cuenta
                </Link>
              </div>

              {/* Bottom info strip */}
              <div className="flex flex-wrap justify-center gap-8 mt-14">
                {[
                  { icon: BookOpen, label: 'Caracterización Social' },
                  { icon: Shield, label: 'Prevención de Violencias' },
                  { icon: Users, label: 'Grupos Focales Comunitarios' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-2 font-bold text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <item.icon className="w-5 h-5" style={{ color: [C.blue, C.teal, C.rose][i] }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

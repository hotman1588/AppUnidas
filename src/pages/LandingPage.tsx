import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Heart, Users, Star, ArrowRight, Newspaper, Calendar, TrendingUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    completedSurveys: 0,
    registeredEvents: 0
  });
  const [news, setNews] = useState<any[]>([]);
  const [selectedNews, setSelectedNews] = useState<any>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
    
    fetch('/api/news')
      .then(res => res.json())
      .then(data => setNews(data))
      .catch(err => console.error(err));
  }, []);

  const features = [
    {
      title: 'Encuesta Social',
      desc: 'Diagnóstico profundo de las necesidades de las cuidadoras.',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Acompañamiento',
      desc: 'Rutas de atención y apoyo institucional especializado.',
      icon: Heart,
      color: 'bg-pink-500'
    },
    {
      title: 'Eventos y Formación',
      desc: 'Espacios de aprendizaje, bienestar y encuentro comunitario.',
      icon: Star,
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="overflow-hidden bg-unidas-dark">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-unidas-primary/20 rounded-full blur-[120px] -translate-x-1/2" />
          <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-unidas-secondary/10 rounded-full blur-[100px] translate-x-1/3" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 font-bold text-xs uppercase tracking-widest mb-8 backdrop-blur-sm">
                <Star className="w-4 h-4 text-unidas-primary fill-current" />
                <span>Barrios Unidos se cuida contigo</span>
              </div>
              
              <h1 className="text-6xl lg:text-[100px] font-black tracking-tight text-white mb-8 leading-[0.95]">
                Reconociendo el <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-unidas-primary to-unidas-accent">valor de tu </span> <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-unidas-primary to-unidas-accent">cuidado</span>
              </h1>

              <p className="text-xl text-white/50 mb-12 max-w-lg leading-relaxed font-medium">
                Plataforma de encuestas y diagnóstico social para mujeres cuidadoras de la Localidad Barrios Unidos. Tu voz es el motor para construir el cambio.
              </p>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                <Link
                  to="/register"
                  className="px-10 py-5 bg-gradient-to-r from-unidas-primary to-unidas-accent text-white font-black rounded-2xl shadow-2xl shadow-unidas-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-3 group"
                >
                  <span>Iniciar Encuesta</span>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative lg:ml-auto"
            >
              <div className="aspect-[4/5] w-full max-w-sm lg:max-w-md relative rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border-4 border-white/5">
                <img
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1000&auto=format&fit=crop"
                  alt="Mujer Cuidadora"
                  className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-unidas-dark via-transparent to-transparent opacity-60" />
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-unidas-primary/20 rounded-full blur-3xl" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-unidas-accent/20 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid - Updated for Dark Theme */}
      <section className="py-32 bg-unidas-dark relative rounded-t-[4rem] -mt-10 z-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black text-white mb-6">Nuestro Compromiso Social</h2>
            <div className="w-20 h-1.5 bg-unidas-primary mx-auto rounded-full mb-8" />
            <p className="text-white/60 max-w-2xl mx-auto text-xl leading-relaxed font-medium">
              Transformamos la visión del cuidado integrando servicios que dignifican el rol de las mujeres en Barrios Unidos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-10 rounded-[2.5rem] bg-white/5 hover:bg-white/10 transition-all duration-500 border border-white/10"
              >
                <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl", f.color)}>
                  <f.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4">{f.title}</h3>
                <p className="text-white/50 leading-relaxed font-medium">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-unidas-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-white">
            <div>
              <p className="text-5xl font-bold mb-2">+{stats.totalUsers || 240}</p>
              <p className="text-unidas-primary-foreground/70 font-medium uppercase tracking-widest text-xs">Mujeres Registradas</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">+{stats.completedSurveys || 85}%</p>
              <p className="text-unidas-primary-foreground/70 font-medium uppercase tracking-widest text-xs">Casos Aprobados</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">+{stats.registeredEvents || 12}</p>
              <p className="text-unidas-primary-foreground/70 font-medium uppercase tracking-widest text-xs">Eventos Mensuales</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">100%</p>
              <p className="text-unidas-primary-foreground/70 font-medium uppercase tracking-widest text-xs">Impacto Local</p>
            </div>
          </div>
        </div>
      </section>

      {/* News / Campaign Section */}
      <section className="py-32 bg-unidas-dark relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 space-y-6 md:space-y-0">
            <div className="max-w-xl">
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 flex items-center space-x-4">
                <div className="w-12 h-12 bg-unidas-primary/20 rounded-2xl flex items-center justify-center">
                  <Newspaper className="w-6 h-6 text-unidas-primary" />
                </div>
                <span>Noticias y Convocatorias</span>
              </h2>
              <p className="text-white/50 font-medium text-xl leading-relaxed">
                Mantente informada sobre las últimas jornadas sociales y eventos comunitarios en Barrios Unidos.
              </p>
            </div>
            <Link to="/news" className="flex items-center space-x-2 text-unidas-primary font-bold hover:underline py-2">
              <span>Ver todas las noticias</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {news.length > 0 && (
            <div className="space-y-12">
              {/* Hero News (First Item) */}
              <div 
                onClick={() => setSelectedNews(news[0])}
                className="group cursor-pointer bg-white/5 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl hover:shadow-unidas-primary/20 transition-all duration-500 flex flex-col lg:flex-row items-center"
              >
                <div className="w-full lg:w-1/2 p-6 lg:p-12">
                  <div className="flex items-center space-x-3 text-[12px] font-bold text-unidas-primary uppercase tracking-widest mb-6">
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(news[0].created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-3xl lg:text-5xl font-black text-white mb-6 group-hover:text-unidas-primary transition-colors leading-tight">
                    {news[0].title}
                  </h3>
                  <p className="text-white/50 text-lg leading-relaxed font-medium mb-8">
                    {news[0].content.length > 200 ? news[0].content.substring(0, 200) + '...' : news[0].content}
                  </p>
                  <div className="inline-flex items-center space-x-2 text-unidas-secondary font-bold group-hover:translate-x-2 transition-transform">
                    <span>Leer nota completa</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
                <div className="w-full lg:w-1/2 bg-black/40 p-4">
                  <img src={news[0].image_url} className="w-full h-auto max-h-[500px] object-contain rounded-[2rem] group-hover:scale-[1.02] transition-transform duration-700" alt={news[0].title} />
                </div>
              </div>

              {/* Grid News (Remaining Items) */}
              {news.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {news.slice(1).map((item) => (
                    <div key={item.id} onClick={() => setSelectedNews(item)} className="group cursor-pointer bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl hover:shadow-unidas-primary/20 transition-all duration-500 flex flex-col">
                      <div className="bg-black/40 p-4">
                        <img src={item.image_url} className="w-full h-auto max-h-[250px] object-contain rounded-2xl group-hover:scale-[1.05] transition-transform duration-700" alt={item.title} />
                      </div>
                      <div className="p-8 flex-grow flex flex-col">
                        <div className="flex items-center space-x-3 text-[10px] font-bold text-unidas-primary uppercase tracking-widest mb-4">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 group-hover:text-unidas-primary transition-colors leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-white/40 leading-relaxed font-medium mb-6 flex-grow">
                          {item.content.length > 120 ? item.content.substring(0, 120) + '...' : item.content}
                        </p>
                        <div className="inline-flex items-center space-x-2 text-unidas-secondary font-bold text-sm group-hover:translate-x-2 transition-transform">
                          <span>Leer nota completa</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <AnimatePresence>
            {selectedNews && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-[#13111C] w-full max-w-5xl max-h-[90vh] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                >
                  <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
                    <div className="flex items-center space-x-3 text-unidas-primary font-bold uppercase tracking-widest text-[10px]">
                      <Newspaper className="w-5 h-5" />
                      <span>Noticias y Convocatorias</span>
                    </div>
                    <button 
                      onClick={() => setSelectedNews(null)}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="overflow-y-auto custom-scrollbar p-8 lg:p-12 space-y-10">
                    <div className="text-center">
                      <div className="inline-flex items-center space-x-3 text-sm font-bold text-unidas-secondary uppercase tracking-widest mb-6 bg-unidas-secondary/10 px-6 py-2 rounded-full">
                        <Calendar className="w-5 h-5" />
                        <span>{new Date(selectedNews.created_at).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <h2 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-4xl mx-auto">
                        {selectedNews.title}
                      </h2>
                    </div>

                    <div className="bg-black/40 rounded-[2.5rem] p-4 mx-auto max-w-4xl">
                      <img 
                        src={selectedNews.image_url} 
                        className="w-full h-auto max-h-[600px] object-contain rounded-3xl" 
                        alt={selectedNews.title} 
                      />
                    </div>

                    <div className="max-w-4xl mx-auto text-lg md:text-xl text-white/70 leading-relaxed font-medium whitespace-pre-wrap">
                      {selectedNews.content}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-unidas-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-unidas-primary to-violet-800 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-unidas-primary/30">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
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
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
                Es momento de que te cuidemos a ti.
              </h2>
              <p className="text-xl text-violet-100 mb-12 max-w-2xl mx-auto">
                Únete a la comunidad de UNIDAS y accede a diagnósticos, acompañamiento y beneficios institucionales.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
                <Link
                  to="/register"
                  className="px-10 py-5 bg-white text-unidas-primary font-bold rounded-2xl shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center group"
                >
                  <span>Registrarme Gratis</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/contact"
                  className="px-10 py-5 bg-unidas-primary/10 text-white font-bold rounded-2xl border border-white/30 hover:bg-white/10 transition-all flex items-center justify-center"
                >
                  Más información
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Calendar, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        setNews(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white py-12 px-6 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <Link to="/" className="inline-flex items-center space-x-2 text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">Volver al inicio</span>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Newspaper className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Noticias y Convocatorias
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#1e3a5f]/30 border-t-[#1e3a5f] rounded-full animate-spin" />
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
            {news.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedNews(item)}
                className="flex items-start space-x-4 cursor-pointer group hover:bg-gray-50 p-2 -m-2 rounded-xl transition-colors"
              >
                {/* Image Square */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-gray-200 overflow-hidden rounded-md border border-gray-200 shadow-sm">
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                
                {/* Text Content */}
                <div className="flex-grow pt-1">
                  <h3 className="text-[#1a5b82] text-[17px] sm:text-[19px] font-semibold leading-snug mb-1 group-hover:underline decoration-2 underline-offset-2">
                    {item.title}
                  </h3>
                  <div className="text-gray-500 text-[13px] capitalize font-medium flex items-center space-x-1.5 mt-2">
                    <span>
                      {new Date(item.created_at).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            No hay noticias publicadas en este momento.
          </div>
        )}
      </div>

      {/* Modal Reader */}
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
              className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0 bg-gray-50/80">
                <div className="flex items-center space-x-3 text-[#1a5b82] font-bold uppercase tracking-widest text-[10px]">
                  <Newspaper className="w-5 h-5" />
                  <span>Noticia Completa</span>
                </div>
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="p-3 bg-white hover:bg-gray-100 rounded-xl text-gray-500 transition-all border border-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="overflow-y-auto custom-scrollbar p-8 lg:p-12 space-y-8 bg-white">
                <div className="text-center max-w-4xl mx-auto">
                  <div className="inline-flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 bg-gray-100 px-4 py-1.5 rounded-full">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(selectedNews.created_at).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-[#1a5b82] leading-tight">
                    {selectedNews.title}
                  </h2>
                </div>

                <div className="bg-gray-50 rounded-[2rem] p-4 mx-auto max-w-4xl border border-gray-100">
                  <img 
                    src={selectedNews.image_url} 
                    className="w-full h-auto max-h-[500px] object-contain rounded-[1.5rem]" 
                    alt={selectedNews.title} 
                  />
                </div>

                <div className="max-w-4xl mx-auto text-lg text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedNews.content}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

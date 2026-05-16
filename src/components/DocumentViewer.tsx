import React, { useState, useEffect } from 'react';
import { X, Download, Maximize2, Minimize2, ExternalLink, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

import { supabase } from '../lib/supabase';

interface DocumentViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, title, onClose }) => {
  const [zoom, setZoom] = useState(false);
  const isPDF = url.toLowerCase().endsWith('.pdf');
  const { data } = supabase.storage.from('documents').getPublicUrl(url);
  const fullUrl = data.publicUrl;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-unidas-primary/20 rounded-xl flex items-center justify-center text-unidas-primary">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold">{title}</h3>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Visualizador de Documentos</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isPDF && (
            <button 
              onClick={() => setZoom(!zoom)}
              className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
              title={zoom ? "Reducir" : "Ampliar"}
            >
              {zoom ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          )}
          <a 
            href={fullUrl} 
            download 
            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
            title="Descargar"
          >
            <Download className="w-5 h-5" />
          </a>
          <a 
            href={fullUrl} 
            target="_blank" 
            rel="noreferrer"
            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
            title="Abrir en pestaña nueva"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <button 
            onClick={onClose}
            className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-xl transition-all ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {isPDF ? (
          <div className="w-full h-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl">
            <iframe 
              src={`${fullUrl}#toolbar=0`} 
              className="w-full h-full border-none"
              title="PDF Viewer"
            />
          </div>
        ) : (
          <div className={twMerge(
            "transition-all duration-300 flex items-center justify-center",
            zoom ? "w-max h-max cursor-zoom-out" : "w-full h-full cursor-zoom-in"
          )}
          onClick={() => !isPDF && setZoom(!zoom)}
          >
            <img 
              src={fullUrl} 
              alt={title}
              className={twMerge(
                "rounded-lg shadow-2xl transition-all",
                zoom ? "max-w-none" : "max-w-full max-h-full object-contain"
              )}
            />
          </div>
        )}
      </div>

      {/* Footer Hint */}
      <div className="p-4 text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">
        UNIDAS - Sistema de Validación de Documentos
      </div>
    </motion.div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Download, Maximize2, Minimize2, ExternalLink, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

interface DocumentViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, title, onClose }) => {
  const [zoom, setZoom] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isPDF = url.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    let active = true;
    
    const loadDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        // If url is already a full http/https URL, use it directly
        if (url.startsWith('http://') || url.startsWith('https://')) {
          if (active) {
            setObjectUrl(url);
            setLoading(false);
          }
          return;
        }

        // Retrieve auth token from Zustand store or local storage
        const token = useAuthStore.getState().token;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Acepta tanto un nombre de archivo como una ruta ya completa
        // (/api/documents/view/...) sin duplicar el prefijo.
        const isApiPath = url.startsWith('/api/');
        const filename = isApiPath ? url.split('/').pop() || url : url;
        const localUrl = isApiPath ? url : `/api/documents/view/${url}`;
        console.log('DocumentViewer: Loading local document:', localUrl);
        const res = await fetch(localUrl, { headers });

        if (res.ok) {
          const blob = await res.blob();
          const objUrl = URL.createObjectURL(blob);
          if (active) {
            setObjectUrl(objUrl);
            setLoading(false);
          }
        } else {
          // Fallback to Supabase public URL if the local server returns an error (404/etc)
          console.log('DocumentViewer: Local load failed, falling back to Supabase');
          const { data } = supabase.storage.from('documents').getPublicUrl(filename);
          if (data?.publicUrl) {
            if (active) {
              setObjectUrl(data.publicUrl);
              setLoading(false);
            }
          } else {
            throw new Error('No se pudo resolver la URL del documento');
          }
        }
      } catch (err: any) {
        console.error('DocumentViewer error:', err);
        if (active) {
          setError(err.message || 'Error al cargar el archivo');
          setLoading(false);
        }
      }
    };

    loadDocument();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      active = false;
      window.removeEventListener('keydown', handleKeyDown);
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url, onClose]);

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
          {!isPDF && !loading && !error && (
            <button 
              onClick={() => setZoom(!zoom)}
              className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
              title={zoom ? "Reducir" : "Ampliar"}
            >
              {zoom ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          )}
          <a 
            href={objectUrl || '#'} 
            download={title} 
            className={twMerge(
              "p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all flex items-center justify-center",
              (!objectUrl || loading || error) && "opacity-40 pointer-events-none"
            )}
            title="Descargar"
          >
            <Download className="w-5 h-5" />
          </a>
          <a 
            href={objectUrl || '#'} 
            target="_blank" 
            rel="noreferrer"
            className={twMerge(
              "p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all flex items-center justify-center",
              (!objectUrl || loading || error) && "opacity-40 pointer-events-none"
            )}
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
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-unidas-primary border-t-transparent rounded-full" />
            <p className="text-white/40 text-xs font-black uppercase tracking-widest">Cargando documento...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center space-y-4 text-center max-w-sm">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20">
              <X className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white font-bold">Error al cargar el documento</p>
              <p className="text-white/40 text-xs mt-1">{error}</p>
            </div>
          </div>
        ) : isPDF ? (
          <div className="w-full h-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl">
            <iframe 
              src={objectUrl ? `${objectUrl}#toolbar=0` : ''} 
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
              src={objectUrl || ''} 
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

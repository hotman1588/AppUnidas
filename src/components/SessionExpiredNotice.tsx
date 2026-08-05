import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { installSessionGuard, SESSION_EXPIRED_EVENT } from '../lib/sessionGuard';

/**
 * Aviso bloqueante cuando el token expiró: el recolector debe desconectarse y
 * volver a entrar. Los borradores de encuesta viven en localStorage y NO se
 * borran aquí, así que al reingresar el formulario sigue con sus respuestas.
 *
 * Solo aplica a sesiones reales: un visitante sin sesión (landing, encuesta
 * anónima pública) nunca ve este aviso, aunque alguna llamada responda 401/403.
 */
export default function SessionExpiredNotice() {
  const [visible, setVisible] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    installSessionGuard();
    const onExpired = () => {
      const { user, token } = useAuthStore.getState();
      const hasSession = !!user && !!token;
      if (hasSession) setVisible(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const handleReconnect = () => {
    logout();
    localStorage.removeItem('token');
    // Recarga completa para descartar cualquier estado colgado de la sesión vencida.
    window.location.assign('/login');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-unidas-dark/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl border border-red-500/40 bg-unidas-dark p-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>

            <h2 className="text-xl font-bold text-white">Sesión expirada</h2>

            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Tu sesión venció por seguridad y el servidor rechazó la última operación.
              Desconéctate y vuelve a iniciar sesión para continuar.
            </p>

            <p className="mt-3 text-xs leading-relaxed text-white/50">
              Tus respuestas quedaron guardadas en este dispositivo: al volver a entrar
              podrás retomar la encuesta donde ibas.
            </p>

            <button
              onClick={handleReconnect}
              className="mt-6 w-full rounded-xl bg-red-500 px-4 py-3 font-bold text-white transition hover:bg-red-600"
            >
              Desconectarse e intentar de nuevo
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

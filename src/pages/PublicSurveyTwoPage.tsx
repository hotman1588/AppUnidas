import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { SurveyTwoModal } from '../components/SurveyTwoModal';

/**
 * Endpoint público de la Encuesta Dos (/encuesta-anonima).
 *
 * Cualquier persona, sin sesión ni restricción, puede diligenciarla desde el
 * apartado "Encuesta Anónima" de la landing. Las respuestas se guardan en el
 * esquema aislado encuesta_dos.responses vía /api/public/encuesta-dos.
 */
export default function PublicSurveyTwoPage() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  // El modal llama onClose justo después de onSuccess; tras guardar no debemos
  // navegar al inicio sino dejar visible la pantalla de agradecimiento.
  const doneRef = useRef(false);

  if (done) {
    return (
      <div className="min-h-screen bg-unidas-dark flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-[1.75rem] bg-green-500/20 text-green-400 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">¡Gracias por participar!</h1>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Tu respuesta se registró de forma anónima y será usada únicamente con fines
            de análisis comunitario.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 rounded-2xl bg-unidas-primary text-white font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-unidas-dark">
      <SurveyTwoModal
        isOpen
        token={null}
        submitEndpoint="/api/public/encuesta-dos"
        onClose={() => { if (!doneRef.current) navigate('/'); }}
        onSuccess={() => { doneRef.current = true; setDone(true); }}
      />
    </div>
  );
}

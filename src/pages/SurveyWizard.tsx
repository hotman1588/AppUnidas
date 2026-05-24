import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Save, CheckCircle, AlertCircle,
  User, Wallet, HeartPulse, Shield, Star, FileText, Upload,
  Info, Clock, XCircle, Eye
} from 'lucide-react';
import { supabase, OperationType, handleSupabaseError } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';
import { DocumentViewer } from '../components/DocumentViewer';

const BARRIO_TO_UPL: Record<string, string> = {
  '7 de Agosto': 'Doce de Octubre',
  'Alcázares Norte': 'Los Alcázares',
  'Andes': 'Los Andes',
  'Andes Norte': 'Los Andes',
  'Baquero': 'Los Alcázares',
  'Benjamín Herrera': 'Doce de Octubre',
  'Colombia': 'Los Alcázares',
  'Doce de Octubre': 'Doce de Octubre',
  'El Labrador': 'Doce de Octubre',
  'El Rosario': 'Doce de Octubre',
  'Entre Ríos': 'Los Alcázares',
  'Escuela Militar': 'Los Alcázares',
  'Jorge Eliécer Gaitán': 'Doce de Octubre',
  'José Joaquín Vargas': 'Doce de Octubre',
  'Julio Flórez': 'Los Andes',
  'La Castellana': 'Los Andes',
  'La Esperanza': 'Doce de Octubre',
  'La Libertad': 'Doce de Octubre',
  'Los Alcázares': 'Los Alcázares',
  'Los Andes': 'Los Andes',
  'Metrópolis': 'Los Alcázares',
  'Modelo Norte': 'Los Alcázares',
  'Parque Salitre': 'Parque Salitre',
  'Polo Club': 'Los Alcázares',
  'Popular Modelo': 'Los Alcázares',
  'Quinta Mutis': 'Parque Salitre',
  'Rafael Uribe Uribe': 'Parque Salitre',
  'Rincón del Salitre': 'Parque Salitre',
  'Rionegro': 'Los Andes',
  'San Felipe': 'Los Alcázares',
  'San Fernando': 'Doce de Octubre',
  'San Fernando Occidental': 'Doce de Octubre',
  'San Miguel': 'Los Andes',
  'Simón Bolívar': 'Parque Salitre',
};

const ALL_BARRIOS = Object.keys(BARRIO_TO_UPL).sort();
const ALL_UPLS = Array.from(new Set(Object.values(BARRIO_TO_UPL))).sort();

const STEPS = [
  { id: 1, title: 'Perfil Sociodemográfico', icon: User },
  { id: 2, title: 'Economía y Autonomía', icon: Wallet },
  { id: 3, title: 'Carga de Cuidado', icon: HeartPulse },
  { id: 4, title: 'Bienestar y Seguridad', icon: Shield },
  { id: 5, title: 'Sueños y Proyecciones', icon: Star },
  { id: 6, title: 'Documentos y Consentimiento', icon: FileText },
];

export default function SurveyWizard() {
  const { user, token } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('survey_step');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [answers, setAnswers] = useState<any>(() => {
    const saved = localStorage.getItem('survey_answers');
    return saved ? JSON.parse(saved) : {};
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [surveyStatus, setSurveyStatus] = useState<string | null>(null);
  const [habeasAccepted, setHabeasAccepted] = useState(() => {
    const saved = localStorage.getItem('survey_habeas');
    return saved === 'true';
  });
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [habeasDataUrl, setHabeasDataUrl] = useState<string | null>(null);
  const [viewerConfig, setViewerConfig] = useState<{ url: string; title: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [birthDate, setBirthDate] = useState(() => {
    const saved = localStorage.getItem('survey_answers');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.socio?.fecha_nacimiento) {
        const [y, m, d] = parsed.socio.fecha_nacimiento.split('-');
        return { day: d || '', month: m || '', year: y || '' };
      }
    }
    return { day: '', month: '', year: '' };
  });

  // Sync to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem('survey_answers', JSON.stringify(answers));
      localStorage.setItem('survey_step', currentStep.toString());
      localStorage.setItem('survey_habeas', habeasAccepted.toString());
    }
  }, [answers, currentStep, habeasAccepted]);

  const calculateAge = (d: string, m: string, y: string) => {
    if (!d || !m || !y) return null;
    const birth = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const today = new Date();
    if (isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const userAge = calculateAge(birthDate.day, birthDate.month, birthDate.year);

  // Sync individual birth date parts to the full date string and compute age
  useEffect(() => {
    if (birthDate.day && birthDate.month && birthDate.year) {
      const formattedDate = `${birthDate.year}-${birthDate.month}-${birthDate.day}`;
      const computedAge = calculateAge(birthDate.day, birthDate.month, birthDate.year);
      setAnswers((prev: any) => {
        const socio = prev.socio || {};
        if (socio.fecha_nacimiento === formattedDate && socio.edad === computedAge) {
          return prev;
        }
        return {
          ...prev,
          socio: {
            ...socio,
            fecha_nacimiento: formattedDate,
            edad: computedAge ?? undefined
          }
        };
      });
    }
  }, [birthDate]);

  // Load initial data
  useEffect(() => {
    const fetchSurveyData = async () => {
      if (!user || !token) return;
      try {
        // 1. Fetch Survey
        const surveyRes = await fetch('/api/user/survey', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const surveyData = await surveyRes.json();

        if (surveyData) {
          setSurveyStatus(surveyData.status || 'pending_start');
          setSurveyId(String(surveyData.id || user.uid));

          // Smart merge: Si localStorage tiene más datos que la base de datos, preferir localStorage (previene pérdida por fallos de red)
          const localAnswers = localStorage.getItem('survey_answers');
          const parsedLocal = localAnswers ? JSON.parse(localAnswers) : {};
          const localKeys = Object.keys(parsedLocal).reduce((acc, mod) => acc + Object.keys(parsedLocal[mod] || {}).length, 0);
          const dbKeys = Object.keys(surveyData.answers || {}).reduce((acc, mod) => acc + Object.keys(surveyData.answers[mod] || {}).length, 0);

          if (localKeys > dbKeys) {
            setAnswers(parsedLocal);
            const savedStep = localStorage.getItem('survey_step');
            if (savedStep) setCurrentStep(parseInt(savedStep, 10));
            setHabeasAccepted(localStorage.getItem('survey_habeas') === 'true');

            if (parsedLocal.socio?.fecha_nacimiento) {
              const [y, m, d] = parsedLocal.socio.fecha_nacimiento.split('-');
              setBirthDate({ day: d || '', month: m || '', year: y || '' });
            }
          } else {
            setAnswers(surveyData.answers || {});
            setCurrentStep(surveyData.current_step || 1);
            setHabeasAccepted(surveyData.habeas_data_accepted === 1);

            if (surveyData.answers?.socio?.fecha_nacimiento) {
              const [y, m, d] = surveyData.answers.socio.fecha_nacimiento.split('-');
              setBirthDate({ day: d || '', month: m || '', year: y || '' });
            }
          }
        }

        // 2. Fetch Documents
        const docsRes = await fetch('/api/user/documents', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const docsData = await docsRes.json();
        if (Array.isArray(docsData)) {
          setUploadedDocs(docsData);
        }

        // 3. Fetch Habeas Data settings
        const settingsRes = await fetch('/api/settings/habeas_data');
        const settingsData = await settingsRes.json();
        setHabeasDataUrl(settingsData.value);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSurveyData();
  }, [user, token]);

  // Periodic Save to Backend
  const saveToBackend = async (targetStep = currentStep) => {
    if (!user || !token) return;
    setSaving(true);
    try {
      const response = await fetch('/api/user/survey/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers,
          step: targetStep,
          habeas_data_accepted: habeasAccepted
        })
      });

      if (!response.ok) {
        console.error('Failed to save to backend');
      }
    } catch (err) {
      console.error('Failed to save to backend', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (module: string, question: string, value: any) => {
    setAnswers((prev: any) => {
      const newAnswers = {
        ...prev,
        [module]: {
          ...(prev[module] || {}),
          [question]: value
        }
      };

      // Auto-select UPL if barrio is selected
      if (module === 'socio' && question === 'barrio') {
        const upl = BARRIO_TO_UPL[value];
        if (upl) {
          if (!newAnswers.socio) newAnswers.socio = {};
          newAnswers.socio.upz = upl;
        }
      }

      // Auto-select UPL for insecure barrio
      if (module === 'bienestar' && question === 'barrio_inseguro') {
        const upl = BARRIO_TO_UPL[value];
        if (upl) {
          if (!newAnswers.bienestar) newAnswers.bienestar = {};
          newAnswers.bienestar.upl_inseguro = upl;
        }
      }

      // Clear insecure barrio info if difficulty is changed away from Seguridad del sector
      if (module === 'bienestar' && question === 'dificultad' && value !== 'Seguridad del sector') {
        if (newAnswers.bienestar) {
          delete newAnswers.bienestar.barrio_inseguro;
          delete newAnswers.bienestar.upl_inseguro;
        }
      }

      // Clear conditional sickness list if no longer diagnosed with sickness
      if (module === 'bienestar' && question === 'enfermedad_diagnosticada' && value !== 'Sí') {
        if (newAnswers.bienestar) {
          delete newAnswers.bienestar.enfermedades_cuales;
        }
      }

      // Clear conditional support list if no longer desiring support
      if (module === 'proyecciones' && question === 'desea_mas_apoyo' && value !== 'Sí') {
        if (newAnswers.proyecciones) {
          delete newAnswers.proyecciones.apoyo_cuales;
        }
      }

      return newAnswers;
    });
  };

  const handleCheckboxChange = (module: string, question: string, value: string) => {
    setAnswers((prev: any) => {
      const current = prev[module]?.[question] || [];
      const updated = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];

      return {
        ...prev,
        [module]: {
          ...(prev[module] || {}),
          [question]: updated
        }
      };
    });
  };

  const getMissingFields = (step: number) => {
    const required: Record<number, string[]> = {
      1: ['socio.fecha_nacimiento', 'socio.genero', 'socio.barrio', 'socio.upz', 'socio.nivel_educativo', 'socio.pertenencia'],
      2: ['economia.ingresos', 'economia.fuente_ingresos', 'economia.situacion_laboral'],
      3: ['cuidado.es_cuidadora', ...(answers.cuidado?.es_cuidadora === 'Sí' ? ['cuidado.poblacion', 'cuidado.horas', 'cuidado.carga_emocional', 'cuidado.reconocimiento', 'cuidado.sentimiento', 'cuidado.cansancio_fisico', 'cuidado.responsabilidades_excesivas', 'cuidado.poco_tiempo_autocuidado', 'cuidado.estres_constante', 'cuidado.agotamiento_emocional'] : [])],
      4: [
        'bienestar.seguridad_hogar', 'bienestar.violencia', 'bienestar.factores_riesgo', 'bienestar.participar',
        'bienestar.tiempo_cuidado_mayor_parte', 'bienestar.poco_apoyo_familiar', 'bienestar.afectacion_sueño',
        'bienestar.enfermedad_diagnosticada', 'bienestar.afectacion_vida_social',
        ...(answers.bienestar?.participar === 'Sí' || answers.bienestar?.participar === 'Tal vez' ? ['bienestar.dificultad'] : []),
        ...(answers.bienestar?.dificultad === 'Seguridad del sector' ? ['bienestar.barrio_inseguro', 'bienestar.upl_inseguro'] : []),
        ...(answers.bienestar?.enfermedad_diagnosticada === 'Sí' ? ['bienestar.enfermedades_cuales'] : [])
      ],
      5: [
        'proyecciones.prioridad', 'proyecciones.interes_formacion', 'proyecciones.bienestar_deseado',
        'proyecciones.dificultades_actividades_cotidianas', 'proyecciones.desea_mas_apoyo',
        ...(answers.proyecciones?.desea_mas_apoyo === 'Sí' ? ['proyecciones.apoyo_cuales'] : [])
      ],
      6: ['habeas_data']
    };

    const fields = required[step] || [];
    const missing = fields.filter(path => {
      if (path === 'habeas_data') return !habeasAccepted;
      const [mod, key] = path.split('.');
      const val = answers[mod]?.[key];

      if (Array.isArray(val)) return val.length === 0;
      return !val || (typeof val === 'string' && val.trim() === '');
    });

    if (step === 6) {
      const requiredDocs = ['id_frontal', 'id_reverso', 'utility_bill'];
      requiredDocs.forEach(type => {
        const hasDoc = uploadedDocs.some(d => d.type === type && d.file_path);
        if (!hasDoc) {
          missing.push(`document.${type}`);
        }
      });
    }

    return missing;
  };

  const nextStep = () => {
    const missing = getMissingFields(currentStep);
    if (missing.length > 0) {
      setValidationErrors(missing);
      setShowErrorPopup(true);
      return;
    }

    setValidationErrors([]);
    if (currentStep < 6) {
      const next = currentStep + 1;
      setCurrentStep(next);
      saveToBackend(next);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      saveToBackend(prev);
      window.scrollTo(0, 0);
    }
  };

  const submitSurvey = async () => {
    if (!habeasAccepted || !user || !token) return;

    const missing = getMissingFields(6); // Check current step (6)
    if (missing.length > 0) {
      setValidationErrors(missing);
      setShowErrorPopup(true);
      return;
    }

    setSaving(true);
    try {
      // 1. Force save the current answers and step 6 to backend first
      await fetch('/api/user/survey/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers,
          step: 6,
          habeas_data_accepted: habeasAccepted
        })
      });

      // 2. Submit the survey
      const response = await fetch('/api/user/survey/submit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to submit');

      setIsSubmitted(true);
      localStorage.removeItem('survey_answers');
      localStorage.removeItem('survey_step');
      localStorage.removeItem('survey_habeas');

      setTimeout(() => {
        window.location.href = '/dashboard?submitted=true';
      }, 5000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (type: string, file: File) => {
    if (!user || !token) return;
    setUploading(type);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch('/api/user/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const insertedDoc = await response.json();
      setUploadedDocs(prev => [
        ...prev.filter(d => d.type !== type),
        insertedDoc
      ]);
      setValidationErrors(prev => prev.filter(err => err !== `document.${type}`));
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(null);
    }
  };

  const isLocked = surveyStatus === 'pending' || surveyStatus === 'approved' || surveyStatus === 'rejected_final';
  const docsLocked = isLocked;

  const calculateProgress = () => {
    // Todos los campos base de la encuesta para que el progreso sea muy evidente con cada clic
    const allFields = [
      'socio.fecha_nacimiento', 'socio.genero', 'socio.barrio', 'socio.upz', 'socio.nivel_educativo', 'socio.pertenencia',
      'economia.ingresos', 'economia.fuente_ingresos', 'economia.situacion_laboral',
      'cuidado.trabaja_cuidadora', 'cuidado.horas', 'cuidado.carga_emocional', 'cuidado.reconocimiento', 'cuidado.sentimiento',
      'bienestar.seguridad_hogar', 'bienestar.violencia', 'bienestar.factores_riesgo', 'bienestar.participar',
      'proyecciones.prioridad', 'proyecciones.interes_formacion', 'proyecciones.bienestar_deseado', 'proyecciones.proyectos_ideales',
      'habeas_data'
    ];
    let filled = 0;
    allFields.forEach(path => {
      if (path === 'habeas_data') {
        if (habeasAccepted) filled++;
      } else {
        const [mod, key] = path.split('.');
        const val = answers[mod]?.[key];
        if (Array.isArray(val)) {
          if (val.length > 0) filled++;
        } else if (val !== undefined && val !== null && val !== '') {
          filled++;
        }
      }
    });
    // Limitar al 100% en caso de que llenen condicionales extra
    return Math.min(100, Math.round((filled / allFields.length) * 100));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-unidas-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-unidas-dark pb-24 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-unidas-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[20%] -right-20 w-96 h-96 bg-unidas-secondary/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header & Progress */}
      <div className="relative z-50 pt-12 pb-8">
        <div className="max-w-4xl mx-auto px-6">
          {surveyStatus === 'pending' && (
            <div className="mb-8 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center space-x-3 text-amber-500">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-wider">Tu encuesta está en proceso de revisión. Por el momento no puedes realizar modificaciones.</p>
            </div>
          )}
          {surveyStatus === 'approved' && (
            <div className="mb-8 bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center space-x-3 text-green-500">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-wider">Tu encuesta ha sido aprobada. Ahora puedes acceder a cursos y eventos.</p>
            </div>
          )}
          {surveyStatus === 'rejected' && (
            <div className="mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center space-x-3 text-red-500">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-wider">Tu encuesta ha sido devuelta para ajustes. Por favor revisa las observaciones y actualiza la información.</p>
            </div>
          )}
          {surveyStatus === 'rejected_final' && (
            <div className="mb-8 bg-red-600/20 border border-red-600/30 p-4 rounded-2xl flex items-center space-x-3 text-red-600">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-wider">Tu encuesta ha sido rechazada definitivamente. Por favor contacta con soporte para más información.</p>
            </div>
          )}

          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-unidas-primary rounded-lg flex items-center justify-center text-white">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-unidas-primary uppercase tracking-[0.2em]">Encuesta Oficial</span>
              </div>
              <h1 className="text-4xl font-black text-white font-display">Perfil Cuidadora</h1>
            </div>
          </div>

          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-12">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress()}%` }}
              transition={{ duration: 1, ease: 'circOut' }}
              className="h-full bg-gradient-to-r from-unidas-primary to-unidas-secondary shadow-[0_0_15px_rgba(236,72,153,0.5)]"
            />
          </div>

          {/* Module Navigation Menu */}
          <div className="flex justify-between items-center gap-4 mb-12 overflow-x-auto pb-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const stepLabels = ['PERFIL', 'ECONOMÍA', 'CUIDADO', 'SEGURIDAD', 'PROTECCIÓN', 'DOCUMENTOS'];
              return (
                <motion.button
                  key={step.id}
                  onClick={() => {
                    if (step.id > currentStep) {
                      for (let s = currentStep; s < step.id; s++) {
                        const missing = getMissingFields(s);
                        if (missing.length > 0) {
                          setValidationErrors(missing);
                          setShowErrorPopup(true);
                          return;
                        }
                      }
                      setValidationErrors([]);
                    } else {
                      setValidationErrors([]);
                    }
                    setCurrentStep(step.id);
                    saveToBackend(step.id);
                    window.scrollTo(0, 0);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'flex flex-col items-center space-y-2 px-6 py-4 rounded-2xl transition-all flex-shrink-0',
                    currentStep === step.id
                      ? 'bg-unidas-primary/20 border border-unidas-primary text-unidas-primary shadow-lg shadow-unidas-primary/20'
                      : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{stepLabels[step.id - 1]}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

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
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-unidas-dark/95 backdrop-blur-2xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[3.5rem] text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-unidas-primary to-unidas-secondary" />
              <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/20">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">¡Enviado con Éxito!</h2>
              <p className="text-white/60 font-medium text-lg leading-relaxed">
                Su encuesta está en proceso de validación, espere un tiempo de 24 a 48 horas.
              </p>
              <div className="mt-10 flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2 text-[10px] font-black text-unidas-primary uppercase tracking-[0.2em]">
                  <div className="w-4 h-4 rounded-full border-2 border-unidas-primary border-t-transparent animate-spin" />
                  <span>Redirigiendo al panel principal...</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showErrorPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-unidas-dark/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full bg-white/5 border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden backdrop-blur-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-unidas-secondary to-red-500 animate-pulse" />
              <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-[1.75rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/20">
                <AlertCircle className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3 font-display">Diligencia la encuesta completa</h2>
              <p className="text-white/60 font-medium text-base leading-relaxed mb-8">
                Por favor complete todos los campos resaltados en rojo para continuar.
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowErrorPopup(false)}
                  className="px-10 py-4 bg-gradient-to-r from-red-500 to-unidas-secondary text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider"
                >
                  Aceptar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Module Hero Card */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-unidas-primary via-unidas-secondary to-unidas-accent" />
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gradient-to-br from-unidas-primary/20 to-unidas-secondary/20 rounded-3xl flex items-center justify-center text-unidas-primary border border-white/10 group-hover:scale-105 transition-transform">
                  {(() => {
                    const Icon = STEPS.find(s => s.id === currentStep)?.icon || User;
                    return <Icon className="w-10 h-10" />;
                  })()}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">{STEPS.find(s => s.id === currentStep)?.title}</h2>
                  <p className="text-white/50 font-medium">{
                    currentStep === 1 ? 'Queremos saber quién eres y dónde te encuentras para brindarte un mejor apoyo.' :
                      currentStep === 2 ? 'Conocer tu situación económica nos permite orientar recursos de manera eficiente.' :
                        currentStep === 3 ? 'Identificamos la intensidad de tu labor para ofrecerte espacios de relevo.' :
                          currentStep === 4 ? 'Tu bienestar emocional y seguridad son nuestra mayor prioridad institucional.' :
                            currentStep === 5 ? 'Proyectamos tus metas para acompañarte en el cumplimiento de tus sueños.' :
                              'Formalizamos tu proceso mediante la verificación documental necesaria.'
                  }</p>
                </div>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">


              {currentStep === 1 && (
                <>
                  <Question
                    label="FECHA DE NACIMIENTO"
                    subtitle="Seleccione su fecha de nacimiento para calcular su edad."
                    type="date-split"
                    value={birthDate}
                    onChange={(val: any) => {
                      setBirthDate(val);
                    }}
                    error={validationErrors.includes('socio.fecha_nacimiento')}
                    ageDisplay={userAge !== null ? `${userAge} Años` : null}
                    disabled={isLocked}
                  />
                  <Question
                    label="IDENTIDAD DE GÉNERO"
                    subtitle="Cómo se identifica actualmente."
                    type="pills"
                    options={['Femenino', 'Masculino', 'No binario', 'Transgénero', 'Otro']}
                    value={answers.socio?.genero}
                    onChange={(v: string) => handleInputChange('socio', 'genero', v)}
                    error={validationErrors.includes('socio.genero')}
                    disabled={isLocked}
                  />
                  <Question
                    label="BARRIO DE RESIDENCIA"
                    subtitle="Barrio donde vive actualmente en Barrios Unidos."
                    type="select"
                    options={ALL_BARRIOS}
                    value={answers.socio?.barrio}
                    onChange={(v: string) => handleInputChange('socio', 'barrio', v)}
                    error={validationErrors.includes('socio.barrio')}
                  />
                  <Question
                    label="ZONA (UPL)"
                    subtitle="Zona geográfica detectada."
                    type="select"
                    options={ALL_UPLS}
                    value={answers.socio?.upz}
                    onChange={(v) => handleInputChange('socio', 'upz', v)}
                    disabled={true}
                    error={validationErrors.includes('socio.upz')}
                    placeholder="Automático"
                  />

                  <Question
                    label="NIVEL EDUCATIVO"
                    subtitle="Escolaridad alcanzada."
                    options={['Primaria', 'Secundaria', 'Técnico', 'Tecnólogo', 'Universitario', 'Posgrado', 'Ninguno', 'Otro']}
                    type="pills"
                    value={answers.socio?.nivel_educativo}
                    onChange={(v) => handleInputChange('socio', 'nivel_educativo', v)}
                    showOther={answers.socio?.nivel_educativo === 'Otro'}
                    otherValue={answers.socio?.nivel_educativo_otro}
                    onOtherChange={(v) => handleInputChange('socio', 'nivel_educativo_otro', v)}
                    disabled={isLocked}
                    error={validationErrors.includes('socio.nivel_educativo')}
                  />

                  <Question
                    label="PERTENENCIA POBLACIONAL"
                    subtitle="Grupos de identificación."
                    type="checkbox-group"
                    options={['Mujer Indígena', 'Afrodescendiente', 'Migrante', 'Persona con discapacidad', 'Víctima del conflicto', 'Ninguna', 'Otro']}
                    value={answers.socio?.pertenencia || []}
                    onChange={(v) => handleCheckboxChange('socio', 'pertenencia', v)}
                    showOther={answers.socio?.pertenencia?.includes('Otro')}
                    otherValue={answers.socio?.pertenencia_otro}
                    onOtherChange={(v) => handleInputChange('socio', 'pertenencia_otro', v)}
                    disabled={isLocked}
                  />
                </>
              )}

              {currentStep === 2 && (
                <>
                  <Question
                    label="INGRESOS MENSUALES"
                    subtitle="Promedio de ingresos personales al mes."
                    type="range"
                    min={0}
                    max={5000000}
                    step={50000}
                    value={answers.economia?.ingresos}
                    onChange={(v: string) => handleInputChange('economia', 'ingresos', v)}
                    error={validationErrors.includes('economia.ingresos')}
                    disabled={isLocked}
                  />
                  <Question
                    label="FUENTE DE INGRESOS"
                    subtitle="Principal origen de sus recursos."
                    type="pills"
                    options={['Trabajo formal', 'Trabajo informal', 'Apoyo familiar', 'Subsidios', 'Pensión', 'Otro']}
                    value={answers.economia?.fuente_ingresos}
                    onChange={(v: string) => handleInputChange('economia', 'fuente_ingresos', v)}
                    error={validationErrors.includes('economia.fuente_ingresos')}
                    showOther={answers.economia?.fuente_ingresos === 'Otro'}
                    otherValue={answers.economia?.fuente_ingresos_otro}
                    onOtherChange={(v: string) => handleInputChange('economia', 'fuente_ingresos_otro', v)}
                    disabled={isLocked}
                  />
                  <Question
                    label="SITUACIÓN LABORAL"
                    subtitle="Estado ocupacional actual."
                    type="pills"
                    options={['Empleado', 'Independiente', 'Buscando empleo', 'Hogar', 'Estudiante', 'Jubilado', 'Otro']}
                    value={answers.economia?.situacion_laboral}
                    onChange={(v: string) => handleInputChange('economia', 'situacion_laboral', v)}
                    error={validationErrors.includes('economia.situacion_laboral')}
                    showOther={answers.economia?.situacion_laboral === 'Otro'}
                    otherValue={answers.economia?.situacion_laboral_otro}
                    onOtherChange={(v: string) => handleInputChange('economia', 'situacion_laboral_otro', v)}
                    disabled={isLocked}
                    className="md:col-span-2"
                  />
                  <Question
                    label="TIPO DE VIVIENDA"
                    subtitle="Condición de residencia."
                    options={['Propia', 'Arriendo', 'Compartida', 'Familiar', 'Otro']}
                    type="pills"
                    value={answers.economia?.tipo_vivienda}
                    onChange={(v: string) => handleInputChange('economia', 'tipo_vivienda', v)}
                    showOther={answers.economia?.tipo_vivienda === 'Otro'}
                    otherValue={answers.economia?.tipo_vivienda_otro}
                    onOtherChange={(v: string) => handleInputChange('economia', 'tipo_vivienda_otro', v)}
                    disabled={isLocked}
                  />
                </>
              )}

              {currentStep === 3 && (
                <>
                  {/* Category Header */}
                  <div className="md:col-span-2 bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center space-x-3 backdrop-blur-xl mb-1">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30 shrink-0">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">Carga de Cuidado</h3>
                      <p className="text-[10px] text-white/40 font-medium italic">Tiempo y esfuerzo dedicado al bienestar de otros.</p>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 backdrop-blur-xl mb-1">
                    <div className="flex-grow">
                      <h4 className="text-sm font-black text-white mb-0.5">¿Trabajas como cuidador o cuidadora?</h4>
                      <p className="text-[9px] text-white/30 font-medium italic leading-tight">Define el enfoque de las siguientes preguntas.</p>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleInputChange('cuidado', 'es_cuidadora', 'Sí')}
                        className={cn(
                          "px-6 py-2 rounded-md text-xs font-black transition-all",
                          answers.cuidado?.es_cuidadora === 'Sí'
                            ? "bg-unidas-primary text-white shadow-md shadow-unidas-primary/20"
                            : "text-white/20 hover:text-white/40"
                        )}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange('cuidado', 'es_cuidadora', 'No');
                          setAnswers((prev: any) => ({
                            ...prev,
                            cuidado: { es_cuidadora: 'No' }
                          }));
                        }}
                        className={cn(
                          "px-6 py-2 rounded-md text-xs font-black transition-all",
                          answers.cuidado?.es_cuidadora === 'No'
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                            : "text-white/20 hover:text-white/40"
                        )}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {answers.cuidado?.es_cuidadora === 'Sí' && (
                    <>
                      <Question
                        label="POBLACIÓN BAJO CUIDADO"
                        subtitle="A quién brinda cuidado."
                        options={[
                          'Hijos, hijas o menores de edad',
                          'Personas mayores',
                          'Persona con discapacidad',
                          'Familiar con enfermedad',
                          'Varias personas del hogar',
                          'Cuidado del hogar o la casa',
                          'Mascotas',
                          'Plantas o huertas',
                          'Otro'
                        ]}
                        type="pills"
                        value={answers.cuidado?.poblacion}
                        onChange={(v: string) => handleInputChange('cuidado', 'poblacion', v)}
                        error={validationErrors.includes('cuidado.poblacion')}
                        showOther={answers.cuidado?.poblacion === 'Otro'}
                        otherValue={answers.cuidado?.poblacion_otro}
                        onOtherChange={(v: string) => handleInputChange('cuidado', 'poblacion_otro', v)}
                        disabled={isLocked}
                      />

                      <Question
                        label="HORAS DIARIAS"
                        subtitle="Tiempo dedicado al día."
                        type="range"
                        min={0}
                        max={24}
                        step={1}
                        suffix="HORAS"
                        value={answers.cuidado?.horas}
                        onChange={(v: string) => handleInputChange('cuidado', 'horas', v)}
                        error={validationErrors.includes('cuidado.horas')}
                        disabled={isLocked}
                      />

                      <Question
                        label="CARGA EMOCIONAL"
                        subtitle="Agotamiento (1: Bajo, 5: Alto)."
                        type="rating"
                        value={answers.cuidado?.carga_emocional}
                        onChange={(v: string) => handleInputChange('cuidado', 'carga_emocional', v)}
                        error={validationErrors.includes('cuidado.carga_emocional')}
                        disabled={isLocked}
                      />

                      <Question
                        label="CONOCIMIENTO DE PROGRAMAS"
                        subtitle="¿Conoce programas o servicios para cuidadoras?"
                        type="pills"
                        options={['Sí', 'No']}
                        value={answers.cuidado?.conoce_programas}
                        onChange={(v: string) => handleInputChange('cuidado', 'conoce_programas', v)}
                        showOther={answers.cuidado?.conoce_programas === 'Sí'}
                        otherValue={answers.cuidado?.cuales_programas}
                        onOtherChange={(v: string) => handleInputChange('cuidado', 'cuales_programas', v)}
                        otherPlaceholder="¿Cuáles?"
                        disabled={isLocked}
                      />

                      <Question
                        label="RECONOCIMIENTO PERCIBIDO"
                        subtitle="¿Qué tanto reconocimiento percibe por las labores que realiza?"
                        type="pills"
                        options={['Nada reconocida', 'Poco reconocida', 'Medianamente reconocida', 'Muy reconocida']}
                        value={answers.cuidado?.reconocimiento}
                        onChange={(v: string) => handleInputChange('cuidado', 'reconocimiento', v)}
                        error={validationErrors.includes('cuidado.reconocimiento')}
                        disabled={isLocked}
                      />
                      <Question
                        label="SENTIMIENTO FRECUENTE"
                        subtitle="¿Qué sentimiento experimenta con más frecuencia?"
                        type="pills"
                        options={['Ira', 'Incertidumbre', 'Temor', 'Tranquilidad', 'Felicidad', 'Angustia', 'Tristeza', 'Otro']}
                        value={answers.cuidado?.sentimiento}
                        onChange={(v: string) => handleInputChange('cuidado', 'sentimiento', v)}
                        error={validationErrors.includes('cuidado.sentimiento')}
                        showOther={answers.cuidado?.sentimiento === 'Otro'}
                        otherValue={answers.cuidado?.sentimiento_otro}
                        onOtherChange={(v: string) => handleInputChange('cuidado', 'sentimiento_otro', v)}
                        disabled={isLocked}
                        className="md:col-span-2"
                      />
                      <Question
                        label="CANSANCIO FÍSICO"
                        subtitle="¿Siente cansancio físico por las labores de cuidado?"
                        type="pills"
                        options={['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre']}
                        value={answers.cuidado?.cansancio_fisico}
                        onChange={(v: string) => handleInputChange('cuidado', 'cansancio_fisico', v)}
                        error={validationErrors.includes('cuidado.cansancio_fisico')}
                        disabled={isLocked}
                      />
                      <Question
                        label="RESPONSABILIDADES EXCESIVAS"
                        subtitle="¿Siente que las responsabilidades del hogar y cuidado son excesivas para usted?"
                        type="pills"
                        options={['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre']}
                        value={answers.cuidado?.responsabilidades_excesivas}
                        onChange={(v: string) => handleInputChange('cuidado', 'responsabilidades_excesivas', v)}
                        error={validationErrors.includes('cuidado.responsabilidades_excesivas')}
                        disabled={isLocked}
                      />
                      <Question
                        label="POCO TIEMPO DE AUTOCUIDADO"
                        subtitle="¿Considera que tiene poco tiempo para cuidar de sí misma/o?"
                        type="pills"
                        options={['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre']}
                        value={answers.cuidado?.poco_tiempo_autocuidado}
                        onChange={(v: string) => handleInputChange('cuidado', 'poco_tiempo_autocuidado', v)}
                        error={validationErrors.includes('cuidado.poco_tiempo_autocuidado')}
                        disabled={isLocked}
                      />
                      <Question
                        label="ESTRÉS CONSTANTE"
                        subtitle="¿Siente estrés o preocupación constante relacionado con las tareas de cuidado?"
                        type="pills"
                        options={['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre']}
                        value={answers.cuidado?.estres_constante}
                        onChange={(v: string) => handleInputChange('cuidado', 'estres_constante', v)}
                        error={validationErrors.includes('cuidado.estres_constante')}
                        disabled={isLocked}
                      />
                      <Question
                        label="AGOTAMIENTO EMOCIONAL"
                        subtitle="¿Se siente emocionalmente agotada/o por las responsabilidades de cuidado?"
                        type="pills"
                        options={['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre']}
                        value={answers.cuidado?.agotamiento_emocional}
                        onChange={(v: string) => handleInputChange('cuidado', 'agotamiento_emocional', v)}
                        error={validationErrors.includes('cuidado.agotamiento_emocional')}
                        disabled={isLocked}
                        className="md:col-span-2"
                      />
                    </>
                  )}
                </>
              )}

              {currentStep === 4 && (
                <>
                  <Question
                    label="SEGURIDAD EN HOGAR"
                    subtitle="Percepción de tranquilidad y protección en su vivienda."
                    type="pills"
                    options={['Siempre', 'Casi siempre', 'A veces', 'Nunca']}
                    value={answers.bienestar?.seguridad_hogar}
                    onChange={(v) => handleInputChange('bienestar', 'seguridad_hogar', v)}
                    error={validationErrors.includes('bienestar.seguridad_hogar')}
                    disabled={isLocked}
                  />

                  <Question
                    label="TIPOS DE VIOLENCIA PERCIBIDA"
                    subtitle="Identifique situaciones de vulneración experimentadas."
                    type="checkbox-group"
                    options={['Física', 'Psicológica', 'Vicaria', 'Económica', 'Sexual', 'Patrimonial', 'Digital', 'Intrafamiliar', 'Institucional', 'Otro']}
                    value={answers.bienestar?.violencia || []}
                    onChange={(v) => handleCheckboxChange('bienestar', 'violencia', v)}
                    error={validationErrors.includes('bienestar.violencia')}
                    showOther={answers.bienestar?.violencia?.includes('Otro')}
                    otherValue={answers.bienestar?.violencia_otro}
                    onOtherChange={(v) => handleInputChange('bienestar', 'violencia_otro', v)}
                    disabled={isLocked}
                  />

                  <Question
                    label="FACTORES DE RIESGO"
                    subtitle="Situaciones del entorno que afectan su calidad de vida."
                    type="checkbox-group"
                    options={['Desempleo', 'Consumo de sustancias SPA', 'Hacinamiento', 'Falta de apoyo familiar', 'Discriminación', 'Otro']}
                    value={answers.bienestar?.factores_riesgo || []}
                    onChange={(v) => handleCheckboxChange('bienestar', 'factores_riesgo', v)}
                    error={validationErrors.includes('bienestar.factores_riesgo')}
                    showOther={answers.bienestar?.factores_riesgo?.includes('Otro')}
                    otherValue={answers.bienestar?.factores_riesgo_otro}
                    onOtherChange={(v) => handleInputChange('bienestar', 'factores_riesgo_otro', v)}
                    disabled={isLocked}
                  />

                  <Question
                    label="PARTICIPACIÓN EN ACTIVIDADES"
                    subtitle="¿Le gustaría participar en espacios para cuidadoras?"
                    type="pills"
                    options={['Sí', 'No', 'Tal vez']}
                    value={answers.bienestar?.participar}
                    onChange={(v) => handleInputChange('bienestar', 'participar', v)}
                    error={validationErrors.includes('bienestar.participar')}
                    showOther={answers.bienestar?.participar === 'No'}
                    otherValue={answers.bienestar?.participar_porque}
                    onOtherChange={(v) => handleInputChange('bienestar', 'participar_porque', v)}
                    otherPlaceholder="¿Por qué?"
                    disabled={isLocked}
                  />

                  {(answers.bienestar?.participar === 'Sí' || answers.bienestar?.participar === 'Tal vez') && (
                    <Question
                      label="PRINCIPAL DIFICULTAD"
                      subtitle="¿Cuál sería el mayor obstáculo para su asistencia?"
                      type="pills"
                      options={['Tiempo', 'Movilidad', 'Motivación', 'Seguridad del sector', 'Prevención social', 'Falta de empatía']}
                      value={answers.bienestar?.dificultad}
                      onChange={(v) => handleInputChange('bienestar', 'dificultad', v)}
                      disabled={isLocked}
                      className="md:col-span-2"
                    />
                  )}

                  {answers.bienestar?.dificultad === 'Seguridad del sector' && (
                    <>
                      <Question
                        label="BARRIO DE INSEGURIDAD"
                        subtitle="Seleccione el barrio que considera inseguro."
                        type="select"
                        options={ALL_BARRIOS}
                        value={answers.bienestar?.barrio_inseguro}
                        onChange={(v: string) => handleInputChange('bienestar', 'barrio_inseguro', v)}
                        error={validationErrors.includes('bienestar.barrio_inseguro')}
                        disabled={isLocked}
                      />
                      <Question
                        label="ZONA UPL (INSEGURIDAD)"
                        subtitle="UPL correspondiente al barrio de inseguridad."
                        type="select"
                        options={ALL_UPLS}
                        value={answers.bienestar?.upl_inseguro}
                        onChange={(v) => handleInputChange('bienestar', 'upl_inseguro', v)}
                        disabled={true}
                        error={validationErrors.includes('bienestar.upl_inseguro')}
                        placeholder="Automático"
                      />
                    </>
                  )}

                  <Question
                    label="TIEMPO DEDICADO AL CUIDADO"
                    subtitle="¿Considera que dedica la mayor parte de su tiempo al cuidado de otra persona?"
                    type="pills"
                    options={['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre']}
                    value={answers.bienestar?.tiempo_cuidado_mayor_parte}
                    onChange={(v) => handleInputChange('bienestar', 'tiempo_cuidado_mayor_parte', v)}
                    error={validationErrors.includes('bienestar.tiempo_cuidado_mayor_parte')}
                    disabled={isLocked}
                  />
                  <Question
                    label="APOYO PERCIBIDO"
                    subtitle="¿Considera que recibe poco apoyo de familiares o personas cercanas?"
                    type="pills"
                    options={['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre']}
                    value={answers.bienestar?.poco_apoyo_familiar}
                    onChange={(v) => handleInputChange('bienestar', 'poco_apoyo_familiar', v)}
                    error={validationErrors.includes('bienestar.poco_apoyo_familiar')}
                    disabled={isLocked}
                  />
                  <Question
                    label="AFECTACIÓN DEL DESCANSO"
                    subtitle="¿Las responsabilidades de cuidado afectan su descanso o calidad del sueño?"
                    type="pills"
                    options={['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre']}
                    value={answers.bienestar?.afectacion_sueño}
                    onChange={(v) => handleInputChange('bienestar', 'afectacion_sueño', v)}
                    error={validationErrors.includes('bienestar.afectacion_sueño')}
                    disabled={isLocked}
                  />
                  <Question
                    label="ENFERMEDAD POR LABORES DE CUIDADO"
                    subtitle="¿Le han dicho o diagnosticado alguna enfermedad a causa de sus labores de cuidado?"
                    type="pills"
                    options={['Sí', 'No', 'Tal vez']}
                    value={answers.bienestar?.enfermedad_diagnosticada}
                    onChange={(v) => handleInputChange('bienestar', 'enfermedad_diagnosticada', v)}
                    error={validationErrors.includes('bienestar.enfermedad_diagnosticada')}
                    showOther={answers.bienestar?.enfermedad_diagnosticada === 'Sí'}
                    otherValue={answers.bienestar?.enfermedades_cuales}
                    onOtherChange={(v) => handleInputChange('bienestar', 'enfermedades_cuales', v)}
                    otherPlaceholder="¿Cuáles enfermedades?"
                    disabled={isLocked}
                  />
                  <Question
                    label="AFECTACIÓN SOCIAL O FAMILIAR"
                    subtitle="¿Considera que las labores de cuidado afectan su vida social o familiar?"
                    type="pills"
                    options={['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre']}
                    value={answers.bienestar?.afectacion_vida_social}
                    onChange={(v) => handleInputChange('bienestar', 'afectacion_vida_social', v)}
                    error={validationErrors.includes('bienestar.afectacion_vida_social')}
                    disabled={isLocked}
                    className="md:col-span-2"
                  />
                </>
              )}

              {currentStep === 5 && (
                <>
                  <Question
                    label="PRIORIDAD URGENTE"
                    subtitle="Identifique su necesidad más inmediata para mejorar su bienestar."
                    type="pills"
                    options={['Salud', 'Empleo', 'Educación', 'Vivienda', 'Apoyo Psicosocial', 'Seguridad', 'Otro']}
                    value={answers.proyecciones?.prioridad}
                    onChange={(v) => handleInputChange('proyecciones', 'prioridad', v)}
                    error={validationErrors.includes('proyecciones.prioridad')}
                    showOther={answers.proyecciones?.prioridad === 'Otro'}
                    otherValue={answers.proyecciones?.prioridad_otro}
                    onOtherChange={(v) => handleInputChange('proyecciones', 'prioridad_otro', v)}
                    disabled={isLocked}
                  />

                  <Question
                    label="INTERÉS DE FORMACIÓN"
                    subtitle="¿En qué áreas le gustaría adquirir nuevos conocimientos?"
                    type="checkbox-group"
                    options={['Tecnología', 'Artes/Oficios', 'Emprendimiento', 'Gestión Financiera', 'Liderazgo', 'Otro']}
                    value={answers.proyecciones?.interes_formacion || []}
                    onChange={(v) => handleCheckboxChange('proyecciones', 'interes_formacion', v)}
                    error={validationErrors.includes('proyecciones.interes_formacion')}
                    showOther={answers.proyecciones?.interes_formacion?.includes('Otro')}
                    otherValue={answers.proyecciones?.interes_formacion_otro}
                    onOtherChange={(v) => handleInputChange('proyecciones', 'interes_formacion_otro', v)}
                    disabled={isLocked}
                  />

                  <Question
                    label="BIENESTAR DESEADO"
                    subtitle="Actividades que le gustaría realizar para su cuidado personal."
                    type="checkbox-group"
                    options={['Yoga/Meditación', 'Deporte', 'Lectura', 'Espacios de escucha', 'Manualidades', 'Otro']}
                    value={answers.proyecciones?.bienestar_deseado || []}
                    onChange={(v) => handleCheckboxChange('proyecciones', 'bienestar_deseado', v)}
                    error={validationErrors.includes('proyecciones.bienestar_deseado')}
                    showOther={answers.proyecciones?.bienestar_deseado?.includes('Otro')}
                    otherValue={answers.proyecciones?.bienestar_deseado_otro}
                    onOtherChange={(v) => handleInputChange('proyecciones', 'bienestar_deseado_otro', v)}
                    disabled={isLocked}
                    className="md:col-span-2"
                  />

                  <Question
                    label="PROYECTOS IDEALES"
                    subtitle="¿Qué tipo de actividades espera encontrar en nuestros proyectos?"
                    type="checkbox-group"
                    options={[
                      'Bienestar emocional',
                      'Autocuidado',
                      'Orientación psicológica/jurídica',
                      'Recreativas',
                      'Redes de apoyo',
                      'Derechos',
                      'Emprendimiento/Finanzas',
                      'Otro'
                    ]}
                    value={answers.proyecciones?.proyectos_ideales || []}
                    onChange={(v) => handleCheckboxChange('proyecciones', 'proyectos_ideales', v)}
                    showOther={answers.proyecciones?.proyectos_ideales?.includes('Otro')}
                    otherValue={answers.proyecciones?.proyectos_ideales_otro}
                    onOtherChange={(v) => handleInputChange('proyecciones', 'proyectos_ideales_otro', v)}
                    disabled={isLocked}
                    className="md:col-span-2"
                  />

                  <Question
                    label="DIFICULTAD EN ACTIVIDADES"
                    subtitle="¿Ha tenido dificultades para trabajar, estudiar o realizar actividades cotidianas debido a las labores de cuidado?"
                    type="pills"
                    options={['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre']}
                    value={answers.proyecciones?.dificultades_actividades_cotidianas}
                    onChange={(v: string) => handleInputChange('proyecciones', 'dificultades_actividades_cotidianas', v)}
                    error={validationErrors.includes('proyecciones.dificultades_actividades_cotidianas')}
                    disabled={isLocked}
                  />
                  <Question
                    label="APOYO O ACOMPAÑAMIENTO DESEADO"
                    subtitle="¿Le gustaría recibir más apoyo, orientación o acompañamiento para las labores de cuidado?"
                    type="pills"
                    options={['Sí', 'No', 'Tal vez']}
                    value={answers.proyecciones?.desea_mas_apoyo}
                    onChange={(v) => handleInputChange('proyecciones', 'desea_mas_apoyo', v)}
                    error={validationErrors.includes('proyecciones.desea_mas_apoyo')}
                    showOther={answers.proyecciones?.desea_mas_apoyo === 'Sí'}
                    otherValue={answers.proyecciones?.apoyo_cuales}
                    onOtherChange={(v) => handleInputChange('proyecciones', 'apoyo_cuales', v)}
                    otherPlaceholder="¿Cuáles apoyos o acompañamientos?"
                    disabled={isLocked}
                  />
                </>
              )}

              {currentStep === 6 && (
                <div className="md:col-span-2 space-y-6">
                  {validationErrors.some(e => e.startsWith('document.')) && (
                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center space-x-4 text-red-500 animate-pulse">
                      <AlertCircle className="w-6 h-6 shrink-0 animate-bounce" />
                      <div className="text-xs font-black uppercase tracking-wider">
                        Debes subir todos los documentos requeridos (Cédula Frontal, Reverso y Recibo Público) para poder finalizar la encuesta.
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentUpload
                      label="Cédula Frontal"
                      type="id_frontal"
                      onUpload={(file: File) => handleFileUpload('id_frontal', file)}
                      status={uploadedDocs.find(d => d.type === 'id_frontal')?.status}
                      filePath={uploadedDocs.find(d => d.type === 'id_frontal')?.file_path}
                      onView={(path: string) => setViewerConfig({ url: path, title: 'Cédula Frontal' })}
                      isUploading={uploading === 'id_frontal'}
                      disabled={docsLocked}
                      hasError={validationErrors.includes('document.id_frontal')}
                    />
                    <DocumentUpload
                      label="Cédula Reverso"
                      type="id_reverso"
                      onUpload={(file: File) => handleFileUpload('id_reverso', file)}
                      status={uploadedDocs.find(d => d.type === 'id_reverso')?.status}
                      filePath={uploadedDocs.find(d => d.type === 'id_reverso')?.file_path}
                      onView={(path: string) => setViewerConfig({ url: path, title: 'Cédula Reverso' })}
                      isUploading={uploading === 'id_reverso'}
                      disabled={docsLocked}
                      hasError={validationErrors.includes('document.id_reverso')}
                    />
                    <DocumentUpload
                      label="Recibo de Servicio Público"
                      type="utility_bill"
                      onUpload={(file: File) => handleFileUpload('utility_bill', file)}
                      status={uploadedDocs.find(d => d.type === 'utility_bill')?.status}
                      filePath={uploadedDocs.find(d => d.type === 'utility_bill')?.file_path}
                      onView={(path: string) => setViewerConfig({ url: path, title: 'Recibo Servicio Público' })}
                      isUploading={uploading === 'utility_bill'}
                      className="md:col-span-2"
                      disabled={docsLocked}
                      hasError={validationErrors.includes('document.utility_bill')}
                    />
                  </div>

                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                    <div className="flex items-center space-x-3 mb-6 text-unidas-primary">
                      <FileText className="w-8 h-8" />
                      <h3 className="text-2xl font-black text-white">Términos y Habeas Data</h3>
                    </div>
                    <div className="h-40 overflow-y-auto bg-white/5 p-6 rounded-2xl border border-white/5 mb-8 text-sm text-white/50 leading-relaxed font-medium">
                      <p className="font-bold mb-2 text-white/80 uppercase text-base tracking-widest">Utilización y tratamiento de datos personales:</p>
                      <p>
                        La recolección y tratamientos de los datos personales tiene como finalidad mantener una base de datos, que le permite a PROYECTOS Y CONSULTORIAS RC SAS generar estadísticas e informes de las actividades correspondientes a la ejecución del Contrato CPS 334-2025.
                        <br /><br />
                        Al aceptar estos términos y condiciones, las personas participantes indican que conocen y autorizan de manera libre, previa, expresa e informada el tratamiento de los datos personales suministrados durante el proceso de inscripción y participación en la actividad, los cuales serán utilizados única y exclusivamente para las finalidades indicadas anteriormente.
                      </p>
                      {habeasDataUrl && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => setViewerConfig({ url: habeasDataUrl, title: 'Política de Tratamiento de Datos' })}
                            className="inline-flex items-center space-x-2 text-unidas-primary font-black uppercase tracking-widest text-[10px] hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Ver Política de Tratamiento de Datos</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "bg-white/5 border p-8 rounded-[2.5rem] backdrop-blur-sm transition-all",
                      validationErrors.includes('habeas_data') ? "border-red-500/50 bg-red-500/5" : "border-white/5"
                    )}>
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          id="habeas"
                          checked={habeasAccepted}
                          disabled={isLocked}
                          onChange={(e) => setHabeasAccepted(e.target.checked)}
                          className="w-6 h-6 mt-1 rounded border-white/10 text-unidas-primary focus:ring-unidas-primary bg-white/5"
                        />
                        <label htmlFor="habeas" className="text-sm text-white/60 font-medium leading-relaxed cursor-pointer">
                          Acepto que mis datos personales sean tratados de acuerdo con la política de tratamiento de datos personales de la Secretaría de Integración Social.
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={cn(
                  "px-8 py-4 rounded-xl font-bold flex items-center space-x-2 transition-all",
                  currentStep === 1 ? "opacity-0 pointer-events-none" : "hover:bg-white/5 text-white/60 hover:text-white"
                )}
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center space-x-4">
                {saving && (
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <div className="animate-spin w-3 h-3 border-2 border-white/20 border-t-white rounded-full" />
                    <span>Sincronizando</span>
                  </div>
                )}

                {currentStep === 6 ? (
                  <button
                    onClick={submitSurvey}
                    disabled={!habeasAccepted || saving || isLocked}
                    className={cn(
                      "px-10 py-5 rounded-[1.25rem] font-black flex items-center space-x-3 text-white shadow-2xl transition-all active:scale-95 group",
                      (habeasAccepted && !isLocked) ? "bg-gradient-to-r from-unidas-primary to-unidas-secondary shadow-unidas-primary/40 hover:scale-[1.02]" : "bg-white/10 text-white/20 cursor-not-allowed"
                    )}
                  >
                    <span>{surveyStatus === 'pending' ? 'Bajo Revisión' : surveyStatus === 'approved' ? 'Encuesta Aprobada' : 'Finalizar Encuesta'}</span>
                    <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    className={cn(
                      "px-10 py-5 bg-gradient-to-r from-unidas-primary to-unidas-secondary text-white font-black rounded-[2.5rem] shadow-2xl shadow-unidas-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-3 group",
                      isLocked && "opacity-50"
                    )}
                  >
                    <span className="text-xl">Siguiente</span>
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Floating Info Box */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-unidas-primary/10 p-8 rounded-[2.5rem] border border-unidas-primary/20 flex items-start space-x-6 backdrop-blur-xl">
            <div className="bg-unidas-primary/20 text-unidas-primary p-3 rounded-2xl">
              <Info className="w-6 h-6" />
            </div>
            <p className="text-sm text-white/50 font-medium leading-relaxed">
              Tu progreso se guarda automáticamente cada vez que cambias de paso o realizas una edición. Puedes cerrar la plataforma y volver en cualquier momento para continuar donde lo dejaste sin perder tu información.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Question({
  label, subtitle, type, value, onChange, options,
  placeholder, className, disabled,
  showOther, otherValue, onOtherChange, otherPlaceholder, error, ageDisplay,
  min, max, step, suffix, labels
}: any) {
  return (
    <div className={cn(
      "bg-white/5 border p-3 rounded-2xl backdrop-blur-xl shadow-sm transition-all hover:bg-white/[0.08] group flex flex-col h-full min-h-[100px] notranslate",
      error ? "border-red-500/50 bg-red-500/5" : "border-white/10",
      className,
      disabled && "opacity-60"
    )} translate="no">
      <div className="mb-2 border-b border-white/5 pb-2">
        <label className="text-[11px] font-black text-white/70 uppercase tracking-[0.05em] block mb-0.5 group-hover:text-unidas-primary transition-colors">{label}</label>
        {subtitle && <p className="text-[9px] text-white/30 font-medium italic leading-tight">{subtitle}</p>}
      </div>

      <div className="flex-grow flex flex-col justify-center">

        {type === 'pills' ? (
          <div className="space-y-2">
            <div className={cn("grid gap-1", options.length > 4 ? "grid-cols-1" : "grid-cols-2")}>
              {options.map((opt: string) => (
                <button
                  key={opt}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(opt)}
                  className={cn(
                    "py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all border text-left flex items-center space-x-1.5",
                    value === opt
                      ? "bg-unidas-primary/20 border-unidas-primary text-unidas-primary"
                      : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10",
                    disabled && "cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full border shrink-0",
                    value === opt ? "border-unidas-primary bg-unidas-primary" : "border-white/10"
                  )} />
                  <span className="truncate">{opt}</span>
                </button>
              ))}
            </div>
            {showOther && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                <input
                  type="text"
                  placeholder={otherPlaceholder || "Especificar..."}
                  value={otherValue || ''}
                  onChange={(e) => onOtherChange(e.target.value)}
                  disabled={disabled}
                  className="w-full px-2 py-1 bg-white/5 border border-unidas-primary/30 focus:border-unidas-primary rounded-lg transition-all outline-none font-bold text-white placeholder:text-white/10 text-[10px]"
                />
              </motion.div>
            )}
          </div>
        ) : type === 'checkbox-group' ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {options.map((opt: string) => (
                <label
                  key={opt}
                  className={cn(
                    "flex items-center space-x-2 p-2 rounded-lg border transition-all cursor-pointer",
                    value.includes(opt)
                      ? "bg-unidas-primary/10 border-unidas-primary text-unidas-primary"
                      : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                  )}
                >
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={value.includes(opt)}
                    onChange={() => onChange(opt)}
                    className="w-3.5 h-3.5 rounded bg-white/5 border-white/10 text-unidas-primary focus:ring-unidas-primary"
                  />
                  <span className="font-bold text-[10px] truncate">{opt}</span>
                </label>
              ))}
            </div>
            {showOther && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                <input
                  type="text"
                  placeholder={otherPlaceholder || "Especificar..."}
                  value={otherValue || ''}
                  onChange={(e) => onOtherChange(e.target.value)}
                  disabled={disabled}
                  className="w-full px-2 py-1 bg-white/5 border border-unidas-primary/30 focus:border-unidas-primary rounded-lg transition-all outline-none font-bold text-white placeholder:text-white/10 text-[10px]"
                />
              </motion.div>
            )}
          </div>
        ) : type === 'date-split' ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-0.5">Día</label>
              <select
                disabled={disabled}
                value={value.day}
                onChange={e => onChange({ ...value, day: e.target.value })}
                className="w-full py-1 px-1 bg-white/5 border border-white/5 rounded-lg text-center text-white focus:border-unidas-primary outline-none transition-all font-bold disabled:cursor-not-allowed appearance-none text-[10px]"
              >
                <option value="" className="bg-unidas-dark">--</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={String(day).padStart(2, '0')} className="bg-unidas-dark">
                    {String(day).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-0.5">Mes</label>
              <select
                disabled={disabled}
                value={value.month}
                onChange={e => onChange({ ...value, month: e.target.value })}
                className="w-full py-1 px-1 bg-white/5 border border-white/5 rounded-lg text-center text-white focus:border-unidas-primary outline-none transition-all font-bold disabled:cursor-not-allowed appearance-none text-[10px]"
              >
                <option value="" className="bg-unidas-dark">--</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={String(month).padStart(2, '0')} className="bg-unidas-dark">
                    {String(month).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-0.5">Año</label>
              <select
                disabled={disabled}
                value={value.year}
                onChange={e => onChange({ ...value, year: e.target.value })}
                className="w-full py-1 px-1 bg-white/5 border border-white/5 rounded-lg text-center text-white focus:border-unidas-primary outline-none transition-all font-bold disabled:cursor-not-allowed appearance-none text-[10px]"
              >
                <option value="" className="bg-unidas-dark">--</option>
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={String(year)} className="bg-unidas-dark">
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : type === 'select' ? (
          <div className="relative">
            <select
              value={value || ''}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-2 py-1 bg-white/5 border border-white/5 focus:border-unidas-primary rounded-lg transition-all outline-none font-bold text-white appearance-none cursor-pointer disabled:cursor-not-allowed text-[10px]"
            >
              <option value="" className="bg-unidas-dark">Seleccionar...</option>
              {options.map((opt: string) => (
                <option key={opt} value={opt} className="bg-unidas-dark">{opt}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
              <Info className="w-3 h-3" />
            </div>
          </div>
        ) : type === 'range' ? (
          <div className="space-y-2 py-1">
            <div className="relative pt-2 pb-0.5">
              <input
                type="range"
                min={min || 0}
                max={max || 4000000}
                step={step || 50000}
                value={value || 0}
                disabled={disabled}
                onInput={(e: any) => onChange(e.target.value)}
                onChange={(e: any) => onChange(e.target.value)}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[7px] font-bold text-white/20 uppercase">{labels?.min || 'Min'}</span>
                <span className="text-[7px] font-bold text-white/20 uppercase">{labels?.max || 'Max'}</span>
              </div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-1.5 flex items-center justify-center">
              <div className="text-center">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider leading-none">
                  {suffix
                    ? `${Number(value) || 0} ${suffix}`
                    : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value) || 0)}
                </span>
              </div>
            </div>
          </div>
        ) : type === 'rating' ? (
          <div className="space-y-2">
            <div className="flex justify-between gap-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(String(num))}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-sm font-black transition-all border",
                    value === String(num)
                      ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                      : "bg-white/5 border-white/5 text-white/20 hover:bg-white/10"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between px-1">
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">{labels?.min}</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">{labels?.max}</span>
            </div>
          </div>
        ) : (
          <input
            type={type}
            disabled={disabled}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 bg-white/5 border border-white/5 focus:border-unidas-primary rounded-lg transition-all outline-none font-bold text-white placeholder:text-white/10 disabled:cursor-not-allowed text-[10px]"
            placeholder={placeholder}
          />
        )}
      </div>
      {ageDisplay && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="inline-flex items-center px-2 py-0.5 bg-unidas-primary/20 rounded-full border border-unidas-primary/30">
            <span className="text-[8px] font-black text-unidas-primary uppercase tracking-widest">{ageDisplay}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentUpload({ label, type, onUpload, status, filePath, onView, isUploading, className, disabled, hasError }: any) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const isActuallyDisabled = disabled || status === 'approved';

  return (
    <div className={cn(
      "space-y-4 bg-white/5 p-8 rounded-[2.5rem] border backdrop-blur-sm flex flex-col items-center text-center relative overflow-hidden transition-all duration-300",
      hasError ? "border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/5 animate-pulse" : "border-white/5",
      className,
      isActuallyDisabled && "opacity-60"
    )}>
      <label className="text-sm font-black text-white/50 uppercase tracking-[0.15em] block mb-4">{label}</label>

      <div className="relative group">
        {!isActuallyDisabled && (
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            id={`upload-${type}`}
          />
        )}
        <div className={cn(
          "w-20 h-20 bg-white/5 border border-dashed border-white/20 rounded-full flex items-center justify-center transition-all",
          status === 'approved' ? "text-green-500 border-green-500/50 bg-green-500/10" :
            status === 'pending' ? "text-yellow-500 border-yellow-500/50 bg-yellow-500/10" :
              "text-white/40 group-hover:text-unidas-primary group-hover:border-unidas-primary/50",
          isActuallyDisabled && "group-hover:scale-100 cursor-not-allowed"
        )}>
          {isUploading ? (
            <div className="animate-spin w-8 h-8 border-4 border-unidas-primary border-t-transparent rounded-full" />
          ) : status === 'approved' ? (
            <CheckCircle className="w-8 h-8" />
          ) : (
            <Upload className={cn("w-8 h-8", !isActuallyDisabled && "group-hover:scale-110 transition-transform")} />
          )}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <p className="font-bold text-white/60">
          {isUploading ? 'Subiendo...' : status === 'approved' ? 'Documento Verificado' : status === 'pending' ? 'Pendiente de Revisión' : 'Subir archivo o foto'}
        </p>
        <div className="flex items-center space-x-4 mt-2">
          {filePath && (
            <button
              onClick={() => onView(filePath)}
              className="flex items-center space-x-2 text-[10px] font-black text-unidas-primary uppercase tracking-widest hover:underline"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Archivo</span>
            </button>
          )}
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest leading-none">PNG, JPG, PDF</p>
        </div>
      </div>

      {status && (
        <div className="mt-2">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
            status === 'approved' ? "bg-green-500/10 text-green-500 border-green-500/20" :
              "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          )}>
            {status === 'approved' ? 'APROBADO' : 'PENDIENTE'}
          </span>
        </div>
      )}
    </div>
  );
}

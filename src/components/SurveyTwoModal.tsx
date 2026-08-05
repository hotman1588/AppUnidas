import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2,
  Trash2, User, Users, Shield, HeartPulse, Star, FileText, Info, ShieldCheck,
  UserCheck, Baby, Dices
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  MODULES, BARRIO_TO_UPL, ALL_BARRIOS, ALL_UPLS,
  ENTRY_BUTTONS, CONSENT, ASSENT_MENOR, CLOSURE_MESSAGE, generateRegistroCodigo,
  isVisibleForRoute, opensOther, type Question as QDef, type ModuleDef, type Perfil
} from '../lib/surveyTwoSchema';

const ICONS: Record<string, any> = { User, Users, Shield, HeartPulse, Star, FileText, UserCheck, Baby };

interface SurveyTwoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  submitEndpoint?: string;
}

// v2: cambió el set de opciones de las preguntas 2, 4, 5 y 6; los borradores
// guardados con el esquema anterior ya no son válidos y se descartan.
const PERSISTENCE_KEY = 'encuesta_dos_draft_v2';
const TIMER_KEY = 'encuesta_dos_started_at';

// Fases del flujo:
//   'entry'   -> pantalla de ingreso (2 botones de registro aleatorio)
//   'consent' -> política de datos diferenciada (compuerta de aceptación)
//   'assent'  -> SOLO menor: asentimiento del propio menor (Paso 2) tras el consentimiento del adulto
//   'closed'  -> el usuario NO aceptó: encuesta cerrada
//   'modules' -> cuerpo de la encuesta (paso a paso por módulo + consentimiento habeas final)
type Phase = 'entry' | 'consent' | 'assent' | 'closed' | 'modules';

export function SurveyTwoModal({ isOpen, onClose, onSuccess, token, submitEndpoint = '/api/analyst/encuesta-dos' }: SurveyTwoModalProps) {
  const [phase, setPhase] = useState<Phase>('entry');
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [registroCodigo, setRegistroCodigo] = useState<string>('');

  const [currentStep, setCurrentStep] = useState(0); // índice de módulo visible
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
  const [answers, setAnswers] = useState<any>({});
  const [habeasAccepted, setHabeasAccepted] = useState(false);
  const [hasViewedHabeas, setHasViewedHabeas] = useState(false);
  const [habeasDataUrl, setHabeasDataUrl] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/settings/habeas_data_dos?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setHabeasDataUrl(d?.value || null))
      .catch(() => {});
  }, []);

  // ---- Persistencia local ----
  useEffect(() => {
    if (!isOpen) return;
    if (!localStorage.getItem(TIMER_KEY)) localStorage.setItem(TIMER_KEY, String(Date.now()));
    try {
      const cached = localStorage.getItem(PERSISTENCE_KEY);
      if (cached) {
        const d = JSON.parse(cached);
        setPhase(d.phase || 'entry');
        setPerfil(d.perfil || null);
        setRegistroCodigo(d.registroCodigo || '');
        setBirthDate(d.birthDate || { day: '', month: '', year: '' });
        setAnswers(d.answers || {});
        setHabeasAccepted(!!d.habeasAccepted);
        setCurrentStep(d.currentStep || 0);
      }
    } catch {}
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify({ phase, perfil, registroCodigo, birthDate, answers, habeasAccepted, currentStep }));
  }, [phase, perfil, registroCodigo, birthDate, answers, habeasAccepted, currentStep, isOpen]);

  // ---- Edad (solo informativa a partir de la fecha de nacimiento) ----
  const calculateAge = (d: string, m: string, y: string) => {
    if (!d || !m || !y) return null;
    const birth = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const md = today.getMonth() - birth.getMonth();
    if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };
  const userAge = calculateAge(birthDate.day, birthDate.month, birthDate.year);

  useEffect(() => {
    if (birthDate.day && birthDate.month && birthDate.year) {
      const formatted = `${birthDate.year}-${birthDate.month}-${birthDate.day}`;
      setAnswers((prev: any) => (prev.fecha_nacimiento === formatted ? prev : { ...prev, fecha_nacimiento: formatted }));
    }
  }, [birthDate]);

  const isMinor = perfil === 'menor';

  // ---- Módulos visibles según perfil ----
  const visibleModules: ModuleDef[] = perfil
    ? MODULES.filter(m => m.questions.some(q => isVisibleForRoute(q.route, perfil)))
    : [];
  // El paso de Habeas Data final SOLO aplica al perfil Adulto. El Menor ya cuenta
  // con la autorización del adulto responsable dada en la Fase 1 (consentimiento).
  const hasHabeasStep = perfil === 'adulto';
  const totalSteps = visibleModules.length + (hasHabeasStep ? 1 : 0);
  const isConsentStep = phase === 'modules' && hasHabeasStep && currentStep === totalSteps - 1;
  const isLastStep = phase === 'modules' && currentStep === totalSteps - 1;
  const currentModule = phase === 'modules' && currentStep < visibleModules.length ? visibleModules[currentStep] : null;

  const visibleQuestions = (m: ModuleDef): QDef[] =>
    perfil ? m.questions.filter(q => isVisibleForRoute(q.route, perfil)) : [];

  // ---- FASE 0: seleccionar perfil aleatorio ----
  const choosePerfil = (p: Perfil) => {
    setPerfil(p);
    setRegistroCodigo(generateRegistroCodigo(p));
    setPhase('consent');
    localStorage.setItem(TIMER_KEY, String(Date.now()));
  };

  // ---- FASE 1: compuerta de consentimiento ----
  // Adulto: acepta -> módulos. Menor: acepta (adulto responsable) -> asentimiento del menor (Paso 2).
  const acceptConsent = () => {
    if (perfil === 'menor') { setPhase('assent'); return; }
    setPhase('modules'); setCurrentStep(0);
  };
  const rejectConsent = () => {
    setPhase('closed');
    localStorage.removeItem(PERSISTENCE_KEY);
    localStorage.removeItem(TIMER_KEY);
  };

  // ---- FASE 1 (Paso 2, solo menor): asentimiento del menor ----
  const acceptAssent = () => { setPhase('modules'); setCurrentStep(0); };
  const rejectAssent = () => {
    setPhase('closed');
    localStorage.removeItem(PERSISTENCE_KEY);
    localStorage.removeItem(TIMER_KEY);
  };

  // ---- Handlers de respuestas ----
  const setAnswer = (id: string, value: any) => {
    setAnswers((prev: any) => {
      const next = { ...prev, [id]: value };
      if (id === 'barrio') next.zona = BARRIO_TO_UPL[value] || '';
      MODULES.forEach(m => m.questions.forEach(q => {
        if (q.conditional && q.id === id && value !== q.conditional.on) delete next[q.conditional.targetId];
        if (q.showOther && q.id === id && !opensOther(q, value)) delete next[`${q.id}_otro`];
      }));
      return next;
    });
    setValidationErrors(e => e.filter(x => x !== id));
  };

  const toggleCheckbox = (q: QDef, opt: string) => {
    setAnswers((prev: any) => {
      const cur: string[] = prev[q.id] || [];
      const exclusives = q.exclusiveOptions || [];
      let updated: string[];
      if (cur.includes(opt)) updated = cur.filter(v => v !== opt);
      else if (exclusives.includes(opt)) {
        // Opción excluyente (ej. "Prefiero no responder"): descarta el resto.
        updated = [opt];
      } else {
        // Cualquier otra opción desmarca las excluyentes.
        const base = cur.filter(v => !exclusives.includes(v));
        if (q.maxSelect && base.length >= q.maxSelect) return prev;
        updated = [...base, opt];
      }
      return { ...prev, [q.id]: updated };
    });
    setValidationErrors(e => e.filter(x => x !== q.id));
  };

  // ---- Validación de un paso ----
  const getMissing = (step: number): string[] => {
    const missing: string[] = [];
    if (isConsentStep) {
      if (!habeasAccepted) missing.push('habeas_data');
      return missing;
    }
    const mod = visibleModules[step];
    if (!mod) return missing;
    visibleQuestions(mod).forEach(q => {
      const val = answers[q.id];
      const empty = q.multi ? (!Array.isArray(val) || val.length === 0) : (!val || (typeof val === 'string' && !val.trim()));
      if (q.required !== false && empty) missing.push(q.id);
      if (q.showOther) {
        const sel = opensOther(q, val);
        const other = answers[`${q.id}_otro`];
        if (sel && (!other || !other.trim()) && !missing.includes(q.id)) missing.push(q.id);
      }
      if (q.conditional && val === q.conditional.on) {
        const t = answers[q.conditional.targetId];
        if ((!t || !t.trim()) && !missing.includes(q.id)) missing.push(q.id);
      }
    });
    return missing;
  };

  const goNext = () => {
    const missing = getMissing(currentStep);
    if (missing.length > 0) { setValidationErrors(missing); setShowErrorPopup(true); return; }
    setValidationErrors([]);
    setCurrentStep(s => Math.min(totalSteps - 1, s + 1));
  };
  const goPrev = () => { setValidationErrors([]); setCurrentStep(s => Math.max(0, s - 1)); };

  const clearData = () => {
    setPhase('entry');
    setPerfil(null);
    setRegistroCodigo('');
    setBirthDate({ day: '', month: '', year: '' });
    setAnswers({});
    setHabeasAccepted(false);
    setHasViewedHabeas(false);
    setCurrentStep(0);
    setValidationErrors([]);
    localStorage.removeItem(PERSISTENCE_KEY);
    localStorage.removeItem(TIMER_KEY);
  };

  const handleSubmit = async () => {
    const missing = getMissing(currentStep);
    if (missing.length > 0) { setValidationErrors(missing); setShowErrorPopup(true); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(submitEndpoint, {
        method: 'POST',
        // Sin token (diligenciamiento público) no se envía cabecera de autorización.
        headers: token
          ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          : { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registro: {
            registro_codigo: registroCodigo,
            perfil,
            is_minor: isMinor,
            birth_date: answers.fecha_nacimiento || null,
            edad: userAge ?? null,
          },
          answers,
          // Menor: la autorización del adulto responsable (Fase 1) es el consentimiento válido.
          habeas_data_accepted: hasHabeasStep ? habeasAccepted : true,
          tiempo_ejecucion_segundos: (() => {
            const startedAt = Number(localStorage.getItem(TIMER_KEY));
            return startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : null;
          })(),
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Error al guardar'); }
      setShowSuccess(true);
      localStorage.removeItem(PERSISTENCE_KEY);
      localStorage.removeItem(TIMER_KEY);
      setTimeout(() => { setShowSuccess(false); clearData(); onSuccess(); onClose(); }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const StepIcon = currentModule ? (ICONS[currentModule.icon] || User) : (isConsentStep ? FileText : ShieldCheck);
  const headerSubtitle = phase === 'entry' ? 'Ingreso · Registro anónimo'
    : phase === 'consent' ? 'Consentimiento · Política de datos'
    : phase === 'assent' ? 'Asentimiento del menor'
    : phase === 'closed' ? 'Encuesta finalizada'
    : isConsentStep ? 'Tratamiento de Datos (Habeas Data)'
    : `Módulo ${currentModule?.id} · ${currentModule?.title}`;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-unidas-dark/90 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-unidas-dark border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-unidas-primary/20 border border-unidas-primary/30 flex items-center justify-center text-unidas-primary">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Encuesta Dos</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {headerSubtitle}
                {perfil && phase === 'modules' && <span className={cn('ml-2', isMinor ? 'text-orange-400' : 'text-emerald-400')}>· Perfil {isMinor ? 'Menor' : 'Adulto'}</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6 text-white/40" /></button>
        </div>

        {/* Progress (solo en módulos) */}
        {phase === 'modules' && (
          <div className="h-1 bg-white/5 shrink-0">
            <div className="h-full bg-gradient-to-r from-unidas-primary to-unidas-secondary transition-all" style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }} />
          </div>
        )}

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" /><span>{error}</span>
            </div>
          )}

          {/* FASE 0: Pantalla de ingreso */}
          {phase === 'entry' && (
            <div className="py-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-3xl bg-unidas-primary/15 border border-unidas-primary/30 flex items-center justify-center text-unidas-primary mx-auto mb-4"><Dices className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-white mb-2">Registro anónimo</h3>
                <p className="text-white/50 text-sm max-w-lg mx-auto leading-relaxed">Seleccione el tipo de participante. El sistema generará automáticamente un registro único y anónimo, sin capturar datos personales.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {ENTRY_BUTTONS.map(b => {
                  const Icon = ICONS[b.icon] || User;
                  const isMenor = b.id === 'menor';
                  return (
                    <button key={b.id} type="button" onClick={() => choosePerfil(b.id)}
                      className={cn('group text-left p-6 rounded-3xl border transition-all hover:scale-[1.02] active:scale-95',
                        isMenor ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20')}>
                      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', isMenor ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400')}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <h4 className="text-lg font-black text-white mb-1">{b.label}</h4>
                      <p className="text-white/50 text-xs leading-relaxed">{b.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* FASE 1: Consentimiento diferenciado (compuerta) */}
          {phase === 'consent' && perfil && (
            <div className="py-2 max-w-2xl mx-auto">
              <div className="p-6 rounded-3xl border border-white/10 bg-white/5">
                <div className="flex items-center space-x-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-unidas-primary" />
                  <h3 className="text-lg font-black text-white">{CONSENT[perfil].title}</h3>
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-4">{CONSENT[perfil].intro}</p>
                <p className="text-white font-bold text-sm mb-5">{CONSENT[perfil].question}</p>
                {registroCodigo && <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Registro: {registroCodigo}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={acceptConsent}
                    className="px-6 py-4 rounded-2xl bg-green-500 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-green-500/20">
                    <CheckCircle2 className="w-5 h-5" /><span>{CONSENT[perfil].acceptLabel}</span>
                  </button>
                  <button type="button" onClick={rejectConsent}
                    className="px-6 py-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 hover:bg-red-500/30 active:scale-95 transition-all">
                    <X className="w-5 h-5" /><span>{CONSENT[perfil].rejectLabel}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FASE 1 · Paso 2 (solo menor): asentimiento del menor */}
          {phase === 'assent' && perfil === 'menor' && (
            <div className="py-2 max-w-2xl mx-auto">
              <div className="p-6 rounded-3xl border border-white/10 bg-white/5">
                <div className="flex items-center space-x-2 mb-4">
                  <Baby className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-black text-white">{ASSENT_MENOR.title}</h3>
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-4">{ASSENT_MENOR.intro}</p>
                <p className="text-white font-bold text-sm mb-5">{ASSENT_MENOR.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={acceptAssent}
                    className="px-6 py-4 rounded-2xl bg-green-500 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-green-500/20">
                    <CheckCircle2 className="w-5 h-5" /><span>{ASSENT_MENOR.acceptLabel}</span>
                  </button>
                  <button type="button" onClick={rejectAssent}
                    className="px-6 py-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 hover:bg-red-500/30 active:scale-95 transition-all">
                    <X className="w-5 h-5" /><span>{ASSENT_MENOR.rejectLabel}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cierre: no aceptó */}
          {phase === 'closed' && (
            <div className="py-12 text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-white/5 border border-white/10 text-white/40 rounded-3xl flex items-center justify-center mx-auto mb-6"><X className="w-10 h-10" /></div>
              <h3 className="text-2xl font-black text-white mb-3">{CLOSURE_MESSAGE.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8">{CLOSURE_MESSAGE.body}</p>
              <div className="flex items-center justify-center gap-3">
                <button type="button" onClick={clearData} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Volver al inicio</button>
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl bg-unidas-primary text-white font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all">Salir</button>
              </div>
            </div>
          )}

          {/* FASE 2: Módulos */}
          {currentModule && (
            <>
              <ModuleBanner icon={ICONS[currentModule.icon] || User} index={currentModule.id} title={currentModule.title} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleQuestions(currentModule).map(q => (
                  q.id === 'fecha_nacimiento' ? (
                    <Card key={q.id} label="FECHA DE NACIMIENTO" subtitle="Día, mes y año." error={validationErrors.includes('fecha_nacimiento')} ageDisplay={userAge !== null ? `${userAge} Años` : null} className="md:col-span-2">
                      <DateSplit value={birthDate} onChange={(v) => { setBirthDate(v); setValidationErrors(e => e.filter(x => x !== 'fecha_nacimiento')); }} />
                    </Card>
                  ) : (
                    <QuestionField
                      key={q.id} q={q} answers={answers} error={validationErrors.includes(q.id)}
                      onValue={setAnswer} onToggle={toggleCheckbox}
                    />
                  )
                ))}
              </div>
            </>
          )}

          {/* Paso consentimiento Habeas final (SOLO Adulto) con control de lectura obligatoria */}
          {isConsentStep && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl border border-white/10 bg-white/5">
                <h3 className="text-lg font-black text-white mb-2 flex items-center space-x-2"><FileText className="w-5 h-5 text-unidas-primary" /><span>Tratamiento de Datos (Habeas Data)</span></h3>
                <p className="text-white/50 text-sm mb-4 leading-relaxed">Consulta el documento completo de la Política de Tratamiento de Datos Personales antes de aceptar. Es obligatorio abrir y leer el documento.</p>
                {habeasDataUrl ? (
                  <a href={habeasDataUrl} target="_blank" rel="noreferrer" onClick={() => setHasViewedHabeas(true)}
                    className={cn('inline-flex items-center space-x-2 px-5 py-3 mb-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all border',
                      hasViewedHabeas ? 'text-green-400 border-green-500/30 bg-green-500/5 hover:bg-green-500/10' : 'text-unidas-primary border-unidas-primary/40 bg-unidas-primary/5 animate-pulse hover:bg-unidas-primary/10')}>
                    <FileText className="w-4 h-4" />
                    <span>{hasViewedHabeas ? '✓ Política Leída – Abrir de nuevo' : '⚠ Abrir Política de Tratamiento de Datos (obligatorio)'}</span>
                  </a>
                ) : (
                  <p className="text-amber-400 text-xs font-bold mb-4">El documento de política aún no está disponible. Contacta al administrador.</p>
                )}

                {/* Aviso de bloqueo cuando el documento no ha sido abierto */}
                {!hasViewedHabeas && habeasDataUrl && (
                  <div className="mb-4 flex items-center space-x-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">Debe abrir y leer el documento de Política de Tratamiento de Datos antes de poder aceptar.</p>
                  </div>
                )}

                <div className={cn('p-4 rounded-2xl border transition-all',
                  validationErrors.includes('habeas_data') ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 bg-white/5',
                  (!hasViewedHabeas && habeasDataUrl) && 'opacity-50')}>
                  <label className={cn('flex items-start space-x-3', (!hasViewedHabeas && habeasDataUrl) ? 'cursor-not-allowed' : 'cursor-pointer')}>
                    <input type="checkbox" checked={habeasAccepted} disabled={!hasViewedHabeas && !!habeasDataUrl}
                      onChange={(e) => { setHabeasAccepted(e.target.checked); setValidationErrors(v => v.filter(x => x !== 'habeas_data')); }}
                      className={cn('mt-1 w-5 h-5 rounded accent-unidas-primary', (!hasViewedHabeas && habeasDataUrl) ? 'cursor-not-allowed' : 'cursor-pointer')} />
                    <span className={cn('text-sm font-medium leading-relaxed select-none', (!hasViewedHabeas && habeasDataUrl) ? 'text-white/30' : 'text-white/70')}>Acepto que los datos sean tratados de acuerdo con la política de tratamiento de datos personales de la Secretaría de Integración Social.</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (solo en módulos) */}
        {phase === 'modules' && (
          <div className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <button onClick={goPrev} disabled={currentStep === 0 || loading} className="flex items-center space-x-2 text-white/40 hover:text-white transition-colors disabled:opacity-0">
                <ChevronLeft className="w-5 h-5" /><span className="font-bold uppercase tracking-widest text-[10px]">Atrás</span>
              </button>
              <button onClick={clearData} className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                <Trash2 className="w-4 h-4" /><span>Limpiar</span>
              </button>
            </div>
            {!isLastStep ? (
              <button onClick={goNext} className="bg-unidas-primary text-white px-8 py-3 rounded-2xl font-black flex items-center space-x-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-unidas-primary/20 uppercase tracking-widest text-xs">
                <span>Siguiente</span><ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="bg-green-500 text-white px-10 py-4 rounded-2xl font-black flex items-center space-x-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-green-500/20 disabled:opacity-50 uppercase tracking-widest text-xs">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
                <span>Guardar Encuesta</span>
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Popup de error */}
      <AnimatePresence>
        {showErrorPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-unidas-dark/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="max-w-md w-full bg-white/5 border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden backdrop-blur-2xl">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-unidas-secondary to-red-500 animate-pulse" />
              <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-[1.75rem] flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-10 h-10 animate-bounce" /></div>
              <h2 className="text-2xl font-black text-white mb-3">Diligencia la encuesta completa</h2>
              <p className="text-white/60 font-medium text-base mb-8">Por favor complete todos los campos resaltados en rojo para continuar.</p>
              <button type="button" onClick={() => setShowErrorPopup(false)} className="px-10 py-4 bg-gradient-to-r from-red-500 to-unidas-secondary text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider">Aceptar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Éxito */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-unidas-dark/95 backdrop-blur-2xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[3.5rem] text-center shadow-2xl">
              <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8"><CheckCircle2 className="w-12 h-12" /></div>
              <h2 className="text-3xl font-black text-white mb-4">¡Encuesta Guardada!</h2>
              <p className="text-white/60 font-medium text-lg">La Encuesta Dos se registró correctamente.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================ Subcomponentes ============================

function ModuleBanner({ icon: Icon, index, title }: { icon: any; index: number | string; title: string }) {
  return (
    <div className="mb-5 bg-gradient-to-r from-unidas-primary/15 to-unidas-secondary/10 border border-unidas-primary/20 rounded-3xl p-5 flex items-center space-x-4 backdrop-blur-xl">
      <div className="w-14 h-14 rounded-2xl bg-unidas-primary/20 border border-unidas-primary/30 flex items-center justify-center text-unidas-primary shrink-0">
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-[10px] font-black text-unidas-primary uppercase tracking-[0.2em]">
          {typeof index === 'number' ? `Módulo ${index}` : index}
        </p>
        <h3 className="text-2xl font-black text-white leading-tight">{title}</h3>
      </div>
    </div>
  );
}

function Card({ label, subtitle, children, error, className, ageDisplay }: any) {
  return (
    <div className={cn('bg-white/5 border p-3 rounded-2xl backdrop-blur-xl flex flex-col', error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10', className)}>
      <div className="mb-2 border-b border-white/5 pb-2">
        <label className="text-[11px] font-black text-white uppercase tracking-[0.05em] block mb-0.5">{label}</label>
        {subtitle && <p className="text-[9px] text-white font-medium italic leading-tight">{subtitle}</p>}
      </div>
      <div className="flex-grow flex flex-col justify-center">{children}</div>
      {ageDisplay && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <span className="inline-block px-2 py-0.5 bg-unidas-primary/20 rounded-full border border-unidas-primary/30 text-[8px] font-black text-unidas-primary uppercase tracking-widest">{ageDisplay}</span>
        </div>
      )}
    </div>
  );
}

function DateSplit({ value, onChange }: any) {
  const sel = 'w-full py-2 px-1 bg-white/5 border border-white/5 rounded-lg text-center text-white focus:border-unidas-primary outline-none font-bold appearance-none text-xs';
  return (
    <div className="grid grid-cols-3 gap-2">
      <select value={value.day} onChange={e => onChange({ ...value, day: e.target.value })} className={sel}>
        <option value="" className="bg-unidas-dark">Día</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d).padStart(2, '0')} className="bg-unidas-dark">{String(d).padStart(2, '0')}</option>)}
      </select>
      <select value={value.month} onChange={e => onChange({ ...value, month: e.target.value })} className={sel}>
        <option value="" className="bg-unidas-dark">Mes</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={String(m).padStart(2, '0')} className="bg-unidas-dark">{String(m).padStart(2, '0')}</option>)}
      </select>
      <select value={value.year} onChange={e => onChange({ ...value, year: e.target.value })} className={sel}>
        <option value="" className="bg-unidas-dark">Año</option>
        {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={String(y)} className="bg-unidas-dark">{y}</option>)}
      </select>
    </div>
  );
}

function QuestionField({ q, answers, error, onValue, onToggle }: any) {
  const val = answers[q.id];
  const selectedOther = opensOther(q, val);
  const showConditional = q.conditional && val === q.conditional.on;

  return (
    <Card label={q.label} subtitle={q.subtitle} error={error} className={cn(q.full && 'md:col-span-2')}>
      {/* Pills: una sola columna cuando hay muchas opciones o etiquetas largas,
          para que el texto no quede truncado. */}
      {q.type === 'pills' && (
        <div className={cn('grid gap-1',
          (q.options?.length || 0) > 4 || q.options?.some((o: string) => o.length > 24) ? 'grid-cols-1' : 'grid-cols-2')}>
          {q.options!.map((opt: string) => (
            <button key={opt} type="button" onClick={() => onValue(q.id, opt)}
              className={cn('py-1.5 px-2 rounded-lg text-[11px] font-bold border text-left flex items-center space-x-1.5 transition-all', val === opt ? 'bg-unidas-primary/20 border-unidas-primary text-unidas-primary' : 'bg-white/5 border-white/5 text-white hover:bg-white/10')}>
              <span className={cn('w-2.5 h-2.5 rounded-full border shrink-0', val === opt ? 'border-unidas-primary bg-unidas-primary' : 'border-white/10')} />
              <span className="leading-snug">{opt}</span>
            </button>
          ))}
        </div>
      )}

      {q.type === 'checkbox-group' && (
        <div className={cn('grid gap-1.5',
          q.options?.some((o: string) => o.length > 40) ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
          {q.options!.map((opt: string) => {
            const checked = Array.isArray(val) && val.includes(opt);
            const blocked = !checked && q.maxSelect && Array.isArray(val) && val.length >= q.maxSelect;
            return (
              <label key={opt} className={cn('flex items-center space-x-2 p-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer', checked ? 'bg-unidas-primary/10 border-unidas-primary text-unidas-primary' : blocked ? 'bg-white/5 border-white/5 text-white opacity-50 cursor-not-allowed' : 'bg-white/5 border-white/5 text-white hover:bg-white/10')}>
                <input type="checkbox" checked={checked} disabled={!!blocked} onChange={() => onToggle(q, opt)} className="w-3.5 h-3.5 rounded accent-unidas-primary shrink-0" />
                <span className="leading-snug">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {q.type === 'select' && (
        <div className="relative">
          <select value={val || ''} disabled={q.id === 'zona'} onChange={(e) => onValue(q.id, e.target.value)}
            className="w-full px-2 py-2 bg-white/5 border border-white/5 focus:border-unidas-primary rounded-lg outline-none font-bold text-white appearance-none text-xs disabled:opacity-60">
            <option value="" className="bg-unidas-dark">{q.id === 'zona' ? 'Automático' : 'Seleccionar...'}</option>
            {(q.id === 'zona' ? ALL_UPLS : q.id === 'barrio' ? ALL_BARRIOS : q.options || []).map((opt: string) => <option key={opt} value={opt} className="bg-unidas-dark">{opt}</option>)}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/20"><Info className="w-3 h-3" /></div>
        </div>
      )}

      {q.type === 'textarea' && (
        <textarea value={val || ''} onChange={(e) => onValue(q.id, e.target.value)} rows={4} placeholder="Escriba aquí..."
          className="w-full px-3 py-2 bg-white/5 border border-white/10 focus:border-unidas-primary rounded-lg outline-none font-medium text-white placeholder:text-white/10 text-sm resize-y" />
      )}

      {q.type === 'text' && (
        <input value={val || ''} onChange={(e) => onValue(q.id, e.target.value)} className="w-full px-2 py-2 bg-white/5 border border-white/5 focus:border-unidas-primary rounded-lg outline-none font-bold text-white text-xs" />
      )}

      {/* Caja de texto abierta, sin límite de caracteres. */}
      {q.showOther && selectedOther && (
        <motion.textarea initial={{ opacity: 0 }} animate={{ opacity: 1 }} rows={2} placeholder="Especifique..."
          value={answers[`${q.id}_otro`] || ''} onChange={(e) => onValue(`${q.id}_otro`, e.target.value)}
          className="mt-2 w-full px-2 py-1.5 bg-white/5 border border-unidas-primary/30 focus:border-unidas-primary rounded-lg outline-none font-bold text-white text-[11px] resize-y" />
      )}

      {showConditional && (
        <motion.textarea initial={{ opacity: 0 }} animate={{ opacity: 1 }} rows={3} placeholder={q.conditional!.placeholder}
          value={answers[q.conditional!.targetId] || ''} onChange={(e) => onValue(q.conditional!.targetId, e.target.value)}
          className="mt-2 w-full px-3 py-2 bg-white/5 border border-unidas-primary/30 focus:border-unidas-primary rounded-lg outline-none font-medium text-white placeholder:text-white/20 text-sm resize-y" />
      )}
    </Card>
  );
}

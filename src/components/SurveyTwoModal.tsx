import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2,
  Trash2, User, Wallet, Users, Shield, HeartPulse, Star, FileText, Info, UserPlus
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  MODULES, BARRIO_TO_UPL, ALL_BARRIOS, ALL_UPLS, DOCUMENT_TYPES,
  isVisibleForDoc, type Question as QDef, type ModuleDef
} from '../lib/surveyTwoSchema';

const ICONS: Record<string, any> = { User, Wallet, Users, Shield, HeartPulse, Star, FileText };

interface SurveyTwoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  submitEndpoint?: string; // por defecto el endpoint del analista
}

const PERSISTENCE_KEY = 'encuesta_dos_draft';

export function SurveyTwoModal({ isOpen, onClose, onSuccess, token, submitEndpoint = '/api/analyst/encuesta-dos' }: SurveyTwoModalProps) {
  const [currentStep, setCurrentStep] = useState(0); // 0 = identificación
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [userData, setUserData] = useState({ full_name: '', document_number: '', phone: '', email: '', password: '' });
  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
  const [answers, setAnswers] = useState<any>({});
  const [habeasAccepted, setHabeasAccepted] = useState(false);
  const [habeasDataUrl, setHabeasDataUrl] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Link único al documento completo de Política de Tratamiento de Datos.
  useEffect(() => {
    fetch('/api/settings/habeas_data')
      .then(r => r.json())
      .then(d => setHabeasDataUrl(d?.value || null))
      .catch(() => {});
  }, []);

  const docType = answers.tipo_documento || '';
  const isMinor = docType === 'TI';

  // ---- Persistencia local ----
  useEffect(() => {
    if (!isOpen) return;
    try {
      const cached = localStorage.getItem(PERSISTENCE_KEY);
      if (cached) {
        const d = JSON.parse(cached);
        setUserData(d.userData || { full_name: '', document_number: '' });
        setBirthDate(d.birthDate || { day: '', month: '', year: '' });
        setAnswers(d.answers || {});
        setHabeasAccepted(!!d.habeasAccepted);
        setCurrentStep(d.currentStep || 0);
      }
    } catch {}
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify({ userData, birthDate, answers, habeasAccepted, currentStep }));
  }, [userData, birthDate, answers, habeasAccepted, currentStep, isOpen]);

  // ---- Edad ----
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

  // ---- Módulos visibles según tipo de documento ----
  // 'tipo_documento' se captura en el Registro de Identidad (paso 0). La fecha de
  // nacimiento SÍ pertenece al Módulo 1 (Perfil Sociodemográfico) y se renderiza ahí.
  const visibleModules: ModuleDef[] = MODULES.filter(m =>
    m.questions.some(q => q.id !== 'tipo_documento' && isVisibleForDoc(q.audience, isMinor))
  );
  const totalSteps = visibleModules.length + 2; // identificación + módulos + consentimiento
  const isConsentStep = currentStep === totalSteps - 1;
  const currentModule = currentStep >= 1 && currentStep <= visibleModules.length ? visibleModules[currentStep - 1] : null;

  const visibleQuestions = (m: ModuleDef): QDef[] =>
    m.questions.filter(q => q.id !== 'tipo_documento' && isVisibleForDoc(q.audience, isMinor));

  // ---- Handlers ----
  const setAnswer = (id: string, value: any) => {
    setAnswers((prev: any) => {
      const next = { ...prev, [id]: value };
      // auto UPL al elegir barrio
      if (id === 'barrio') next.zona = BARRIO_TO_UPL[value] || '';
      // limpiar caja condicional si el valor del padre deja de coincidir
      MODULES.forEach(m => m.questions.forEach(q => {
        if (q.conditional && q.id === id && value !== q.conditional.on) delete next[q.conditional.targetId];
        if (q.showOther && q.id === id && !q.multi && value !== 'Otro' && value !== 'Otra') delete next[`${q.id}_otro`];
        // Multi: limpia la caja "Otro" si ya no está marcada en el arreglo.
        if (q.showOther && q.id === id && q.multi && Array.isArray(value) && !value.includes('Otro') && !value.includes('Otra')) delete next[`${q.id}_otro`];
      }));
      return next;
    });
    setValidationErrors(e => e.filter(x => x !== id));
  };

  const toggleCheckbox = (q: QDef, opt: string) => {
    setAnswers((prev: any) => {
      const cur: string[] = prev[q.id] || [];
      let updated: string[];
      if (cur.includes(opt)) updated = cur.filter(v => v !== opt);
      else {
        if (q.maxSelect && cur.length >= q.maxSelect) return prev; // bloquea más de N
        updated = [...cur, opt];
      }
      return { ...prev, [q.id]: updated };
    });
    setValidationErrors(e => e.filter(x => x !== q.id));
  };

  // ---- Validación de un paso ----
  const getMissing = (step: number): string[] => {
    const missing: string[] = [];
    if (step === 0) {
      if (!userData.full_name.trim()) missing.push('full_name');
      if (!docType) missing.push('tipo_documento');
      if (!userData.document_number.trim()) missing.push('document_number');
      if (!userData.password.trim()) missing.push('password');
      return missing;
    }
    if (isConsentStep) {
      if (!habeasAccepted) missing.push('habeas_data');
      return missing;
    }
    const mod = visibleModules[step - 1];
    if (!mod) return missing;
    visibleQuestions(mod).forEach(q => {
      const disabled = q.enabledIf && answers[q.enabledIf.id] !== q.enabledIf.equals;
      if (disabled) return;
      const val = answers[q.id];
      const empty = q.multi ? (!Array.isArray(val) || val.length === 0) : (!val || (typeof val === 'string' && !val.trim()));
      if (q.required !== false && empty) missing.push(q.id);
      // caja "Otro"
      if (q.showOther) {
        const sel = q.multi ? Array.isArray(val) && (val.includes('Otro') || val.includes('Otra')) : (val === 'Otro' || val === 'Otra');
        const other = answers[`${q.id}_otro`];
        if (sel && (!other || !other.trim()) && !missing.includes(q.id)) missing.push(q.id);
      }
      // caja condicional ilimitada
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
    setUserData({ full_name: '', document_number: '', phone: '', email: '', password: '' });
    setBirthDate({ day: '', month: '', year: '' });
    setAnswers({});
    setHabeasAccepted(false);
    setCurrentStep(0);
    setValidationErrors([]);
    localStorage.removeItem(PERSISTENCE_KEY);
  };

  const handleSubmit = async () => {
    const missing = getMissing(currentStep);
    if (missing.length > 0) { setValidationErrors(missing); setShowErrorPopup(true); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          user: {
            full_name: userData.full_name,
            document_number: userData.document_number,
            document_type: docType,
            phone: userData.phone,
            email: userData.email,
            password: userData.password,
            birth_date: answers.fecha_nacimiento || null,
            edad: userAge ?? null,
          },
          answers,
          habeas_data_accepted: habeasAccepted,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Error al guardar'); }
      setShowSuccess(true);
      localStorage.removeItem(PERSISTENCE_KEY);
      setTimeout(() => { setShowSuccess(false); clearData(); onSuccess(); onClose(); }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const StepIcon = currentModule ? (ICONS[currentModule.icon] || User) : (currentStep === 0 ? User : FileText);

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
                {currentStep === 0 ? 'Identificación' : isConsentStep ? 'Consentimiento' : `Módulo ${currentModule?.id} · ${currentModule?.title}`}
                {isMinor && currentStep > 0 && <span className="ml-2 text-orange-400">· Modo Menor (TI)</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6 text-white/40" /></button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-white/5 shrink-0">
          <div className="h-full bg-gradient-to-r from-unidas-primary to-unidas-secondary transition-all" style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }} />
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" /><span>{error}</span>
            </div>
          )}

          {/* Paso 0: Registro de Identidad (mismo módulo que la Encuesta Uno) */}
          {currentStep === 0 && (
            <>
            <ModuleBanner icon={UserPlus} index="Registro de Identidad" title="Datos de la persona encuestada" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldText label="NOMBRE COMPLETO" value={userData.full_name} onChange={(v) => { setUserData(d => ({ ...d, full_name: v })); setValidationErrors(e => e.filter(x => x !== 'full_name')); }} error={validationErrors.includes('full_name')} className="md:col-span-2" />

              {/* Tipo + N° Documento en una fila */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">TIPO</label>
                  <select
                    value={docType}
                    onChange={(e) => setAnswer('tipo_documento', e.target.value)}
                    className={cn('w-full bg-white/5 border p-4 rounded-2xl text-white outline-none focus:border-unidas-primary transition-all font-bold appearance-none', validationErrors.includes('tipo_documento') ? 'border-red-500' : 'border-white/10')}
                  >
                    <option value="" className="bg-unidas-dark">--</option>
                    {DOCUMENT_TYPES.map(dt => <option key={dt} value={dt} className="bg-unidas-dark">{dt}</option>)}
                  </select>
                </div>
                <FieldText label="N° DOCUMENTO" value={userData.document_number} onChange={(v) => { setUserData(d => ({ ...d, document_number: v })); setValidationErrors(e => e.filter(x => x !== 'document_number')); }} error={validationErrors.includes('document_number')} className="col-span-2" />
              </div>
              {isMinor && <p className="md:col-span-2 -mt-1 text-[10px] font-bold text-orange-400 uppercase tracking-widest">TI seleccionado · modo menor de edad activo</p>}

              <FieldText label="CELULAR" value={userData.phone} onChange={(v) => setUserData(d => ({ ...d, phone: v }))} />
              <FieldText label="CORREO ELECTRÓNICO" value={userData.email} onChange={(v) => setUserData(d => ({ ...d, email: v }))} />

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">DEFINIR CONTRASEÑA (PIN)</label>
                <input type="password" value={userData.password} onChange={(e) => { setUserData(d => ({ ...d, password: e.target.value })); setValidationErrors(er => er.filter(x => x !== 'password')); }}
                  className={cn('w-full bg-white/5 border p-4 rounded-2xl text-white outline-none focus:border-unidas-primary transition-all font-bold', validationErrors.includes('password') ? 'border-red-500' : 'border-white/10')} />
              </div>
            </div>
            </>
          )}

          {/* Pasos de módulos */}
          {currentModule && (
            <>
              {/* Encabezado con el nombre del módulo para diferenciarlos */}
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

          {/* Paso consentimiento */}
          {isConsentStep && (
            <div className="space-y-4">
              <div className={cn('p-6 rounded-3xl border', validationErrors.includes('habeas_data') ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5')}>
                <h3 className="text-lg font-black text-white mb-2 flex items-center space-x-2"><FileText className="w-5 h-5 text-unidas-primary" /><span>Tratamiento de Datos (Habeas Data)</span></h3>
                <p className="text-white/50 text-sm mb-4 leading-relaxed">Consulta el documento completo y acepta para poder guardar la encuesta.</p>
                {habeasDataUrl && (
                  <a
                    href={habeasDataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2.5 mb-4 rounded-2xl border border-unidas-primary/40 bg-unidas-primary/5 text-unidas-primary font-black uppercase tracking-widest text-[10px] hover:bg-unidas-primary/10 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Abrir Política de Tratamiento de Datos</span>
                  </a>
                )}
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" checked={habeasAccepted} onChange={(e) => { setHabeasAccepted(e.target.checked); setValidationErrors(v => v.filter(x => x !== 'habeas_data')); }} className="mt-1 w-5 h-5 rounded accent-unidas-primary" />
                  <span className="text-sm font-medium text-white/70 leading-relaxed">Acepto que los datos personales sean tratados de acuerdo con la política de tratamiento de datos personales de la Secretaría de Integración Social.</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={goPrev} disabled={currentStep === 0 || loading} className="flex items-center space-x-2 text-white/40 hover:text-white transition-colors disabled:opacity-0">
              <ChevronLeft className="w-5 h-5" /><span className="font-bold uppercase tracking-widest text-[10px]">Atrás</span>
            </button>
            <button onClick={clearData} className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
              <Trash2 className="w-4 h-4" /><span>Limpiar</span>
            </button>
          </div>
          {!isConsentStep ? (
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
        <label className="text-[11px] font-black text-white/70 uppercase tracking-[0.05em] block mb-0.5">{label}</label>
        {subtitle && <p className="text-[9px] text-white/30 font-medium italic leading-tight">{subtitle}</p>}
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

function FieldText({ label, value, onChange, error, className }: any) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={cn('w-full bg-white/5 border p-4 rounded-2xl text-white outline-none focus:border-unidas-primary transition-all font-bold', error ? 'border-red-500' : 'border-white/10')} />
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
  const disabled = q.enabledIf ? answers[q.enabledIf.id] !== q.enabledIf.equals : false;
  const selectedOther = q.multi ? (Array.isArray(val) && (val.includes('Otro') || val.includes('Otra'))) : (val === 'Otro' || val === 'Otra');
  const showConditional = q.conditional && val === q.conditional.on;

  return (
    <Card label={q.label} subtitle={q.subtitle} error={error} className={cn(q.full && 'md:col-span-2', disabled && 'opacity-40 pointer-events-none')}>
      {q.type === 'pills' && (
        <div className={cn('grid gap-1', (q.options?.length || 0) > 4 ? 'grid-cols-1' : 'grid-cols-2')}>
          {q.options!.map(opt => (
            <button key={opt} type="button" onClick={() => onValue(q.id, opt)}
              className={cn('py-1.5 px-2 rounded-lg text-[11px] font-bold border text-left flex items-center space-x-1.5 transition-all', val === opt ? 'bg-unidas-primary/20 border-unidas-primary text-unidas-primary' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10')}>
              <span className={cn('w-2.5 h-2.5 rounded-full border shrink-0', val === opt ? 'border-unidas-primary bg-unidas-primary' : 'border-white/10')} />
              <span className="truncate">{opt}</span>
            </button>
          ))}
        </div>
      )}

      {q.type === 'checkbox-group' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {q.options!.map(opt => {
            const checked = Array.isArray(val) && val.includes(opt);
            const blocked = !checked && q.maxSelect && Array.isArray(val) && val.length >= q.maxSelect;
            return (
              <label key={opt} className={cn('flex items-center space-x-2 p-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer', checked ? 'bg-unidas-primary/10 border-unidas-primary text-unidas-primary' : blocked ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10')}>
                <input type="checkbox" checked={checked} disabled={!!blocked} onChange={() => onToggle(q, opt)} className="w-3.5 h-3.5 rounded accent-unidas-primary" />
                <span className="truncate">{opt}</span>
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
            {(q.id === 'zona' ? ALL_UPLS : q.id === 'barrio' ? ALL_BARRIOS : q.options || []).map(opt => <option key={opt} value={opt} className="bg-unidas-dark">{opt}</option>)}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/20"><Info className="w-3 h-3" /></div>
        </div>
      )}

      {q.type === 'range' && (
        <div className="space-y-2 py-1">
          <input type="range" min={q.min || 0} max={q.max || 5000000} step={q.step || 50000} value={val || 0} onChange={(e) => onValue(q.id, e.target.value)} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500" />
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-1.5 text-center">
            <span className="text-[11px] font-black text-orange-500 uppercase">
              {q.suffix ? `${Number(val) || 0} ${q.suffix}` : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(val) || 0)}
            </span>
          </div>
        </div>
      )}

      {q.type === 'textarea' && (
        <textarea value={val || ''} onChange={(e) => onValue(q.id, e.target.value)} rows={4} placeholder="Escriba aquí..."
          className="w-full px-3 py-2 bg-white/5 border border-white/10 focus:border-unidas-primary rounded-lg outline-none font-medium text-white placeholder:text-white/10 text-sm resize-y" />
      )}

      {q.type === 'text' && (
        <input value={val || ''} onChange={(e) => onValue(q.id, e.target.value)} className="w-full px-2 py-2 bg-white/5 border border-white/5 focus:border-unidas-primary rounded-lg outline-none font-bold text-white text-xs" />
      )}

      {/* Caja "Otro" */}
      {q.showOther && selectedOther && (
        <motion.input initial={{ opacity: 0 }} animate={{ opacity: 1 }} type="text" placeholder="Especifique..."
          value={answers[`${q.id}_otro`] || ''} onChange={(e) => onValue(`${q.id}_otro`, e.target.value)}
          className="mt-2 w-full px-2 py-1.5 bg-white/5 border border-unidas-primary/30 focus:border-unidas-primary rounded-lg outline-none font-bold text-white text-[11px]" />
      )}

      {/* Caja de texto condicional ilimitada */}
      {showConditional && (
        <motion.textarea initial={{ opacity: 0 }} animate={{ opacity: 1 }} rows={3} placeholder={q.conditional!.placeholder}
          value={answers[q.conditional!.targetId] || ''} onChange={(e) => onValue(q.conditional!.targetId, e.target.value)}
          className="mt-2 w-full px-3 py-2 bg-white/5 border border-unidas-primary/30 focus:border-unidas-primary rounded-lg outline-none font-medium text-white placeholder:text-white/20 text-sm resize-y" />
      )}
    </Card>
  );
}

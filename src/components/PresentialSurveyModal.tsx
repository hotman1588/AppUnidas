import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, UserPlus, ClipboardList, CheckCircle2, 
  ChevronRight, ChevronLeft, Save, AlertCircle,
  Clock, HeartPulse, Shield, Star, Info, FileText,
  Upload, Eye, Wallet, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { DocumentViewer } from './DocumentViewer';

interface PresentialSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
}

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

export function PresentialSurveyModal({ isOpen, onClose, onSuccess, token }: PresentialSurveyModalProps) {
  const [currentStep, setCurrentStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [viewerConfig, setViewerConfig] = useState<{ url: string; title: string } | null>(null);
  const [habeasDataUrl, setHabeasDataUrl] = useState<string | null>(null);
  
  const [userData, setUserData] = useState({
    full_name: '',
    document_type: 'CC',
    document_number: '',
    phone: '',
    email: '',
    password: ''
  });

  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
  const [habeasAccepted, setHabeasAccepted] = useState(false);

  const [answers, setAnswers] = useState<any>({
    socio: {},
    economia: {},
    cuidado: {},
    bienestar: {},
    proyecciones: {},
    documentos: {}
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Auto-mapping UPL
  useEffect(() => {
    if (answers.socio?.barrio) {
      const upl = BARRIO_TO_UPL[answers.socio.barrio];
      if (upl) handleInputChange('socio', 'upz', upl);
    }
  }, [answers.socio?.barrio]);

  // Calculate Age
  const calculateAge = (d: string, m: string, y: string) => {
    if (!d || !m || !y) return null;
    const birth = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const today = new Date();
    if (isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  useEffect(() => {
    if (birthDate.day && birthDate.month && birthDate.year) {
      const formattedDate = `${birthDate.year}-${birthDate.month}-${birthDate.day}`;
      const age = calculateAge(birthDate.day, birthDate.month, birthDate.year);
      setAnswers((prev: any) => {
        const socio = prev.socio || {};
        if (socio.fecha_nacimiento === formattedDate && socio.edad === age) {
          return prev;
        }
        return {
          ...prev,
          socio: {
            ...socio,
            fecha_nacimiento: formattedDate,
            edad: age ?? undefined
          }
        };
      });
    }
  }, [birthDate]);

  // --- PERSISTENCE LOGIC ---
  const PERSISTENCE_KEY = 'presential_survey_cache';

  // Load from localStorage on mount (when modal opens)
  useEffect(() => {
    if (isOpen) {
      const fetchHabeas = async () => {
        try {
          const res = await fetch('/api/settings/habeas_data');
          const data = await res.json();
          setHabeasDataUrl(data.value);
        } catch (e) {
          console.error("Error fetching habeas path", e);
        }
      };
      fetchHabeas();

      const cached = localStorage.getItem(PERSISTENCE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data.userData) setUserData(data.userData);
          if (data.answers) setAnswers(data.answers);
          if (data.birthDate) setBirthDate(data.birthDate);
          if (data.currentStep !== undefined) setCurrentStep(data.currentStep);
          if (data.habeasAccepted !== undefined) setHabeasAccepted(data.habeasAccepted);
        } catch (e) {
          console.error("Error loading cache", e);
        }
      }
    }
  }, [isOpen]);

  // Save to localStorage on any change
  useEffect(() => {
    if (isOpen) {
      const data = { userData, answers, birthDate, currentStep, habeasAccepted };
      localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(data));
    }
  }, [userData, answers, birthDate, currentStep, habeasAccepted, isOpen]);

  const clearData = () => {
    if (window.confirm("¿Deseas borrar todos los datos actuales y empezar de cero?")) {
      localStorage.removeItem(PERSISTENCE_KEY);
      setUserData({
        full_name: '',
        document_type: 'CC',
        document_number: '',
        phone: '',
        email: '',
        password: ''
      });
      setAnswers({
        socio: {},
        economia: {},
        cuidado: {},
        bienestar: {},
        proyecciones: {},
        documentos: {}
      });
      setBirthDate({ day: '', month: '', year: '' });
      setCurrentStep(0);
      setHabeasAccepted(false);
      setValidationErrors([]);
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
    setValidationErrors(prev => prev.filter(f => f !== e.target.name));
  };

  const handleInputChange = (module: string, key: string, value: any) => {
    setAnswers((prev: any) => ({
      ...prev,
      [module]: { ...prev[module], [key]: value }
    }));
    setValidationErrors(prev => prev.filter(f => f !== `${module}.${key}`));
  };

  const handleCheckboxChange = (module: string, key: string, value: string) => {
    const current = answers[module]?.[key] || [];
    const updated = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    
    handleInputChange(module, key, updated);
  };

  const handleFileUpload = async (type: string, file: File) => {
    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${type}.${fileExt}`;
      const filePath = `presential/${userData.document_number || 'unknown'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      handleInputChange('documentos', type, publicUrl);
    } catch (err: any) {
      alert('Error al subir: ' + err.message);
    } finally {
      setUploading(null);
    }
  };

  const validateStep = () => {
    const missing: string[] = [];
    if (currentStep === 0) {
      if (!userData.full_name) missing.push('full_name');
      if (!userData.document_number) missing.push('document_number');
      if (!userData.password) missing.push('password');
    } else if (currentStep === 1) {
      if (!answers.socio.fecha_nacimiento) missing.push('socio.fecha_nacimiento');
      if (!answers.socio.genero) missing.push('socio.genero');
      if (!answers.socio.barrio) missing.push('socio.barrio');
      if (!answers.socio.upz) missing.push('socio.upz');
      if (!answers.socio.nivel_educativo) missing.push('socio.nivel_educativo');
      if (!answers.socio.pertenencia || answers.socio.pertenencia.length === 0) missing.push('socio.pertenencia');
    } else if (currentStep === 2) {
      if (!answers.economia.ingresos) missing.push('economia.ingresos');
      if (!answers.economia.fuente_ingresos) missing.push('economia.fuente_ingresos');
      if (!answers.economia.situacion_laboral) missing.push('economia.situacion_laboral');
    } else if (currentStep === 3) {
      if (!answers.cuidado.es_cuidadora) missing.push('cuidado.es_cuidadora');
      if (answers.cuidado.es_cuidadora === 'Sí') {
        if (!answers.cuidado.poblacion) missing.push('cuidado.poblacion');
        if (!answers.cuidado.horas) missing.push('cuidado.horas');
        if (!answers.cuidado.carga_emocional) missing.push('cuidado.carga_emocional');
        if (!answers.cuidado.reconocimiento) missing.push('cuidado.reconocimiento');
        if (!answers.cuidado.sentimiento) missing.push('cuidado.sentimiento');
      }
    } else if (currentStep === 4) {
      if (!answers.bienestar.seguridad_hogar) missing.push('bienestar.seguridad_hogar');
      if (!answers.bienestar.violencia || answers.bienestar.violencia.length === 0) missing.push('bienestar.violencia');
      if (!answers.bienestar.factores_riesgo || answers.bienestar.factores_riesgo.length === 0) missing.push('bienestar.factores_riesgo');
      if (!answers.bienestar.participar) missing.push('bienestar.participar');
    } else if (currentStep === 5) {
      if (!answers.proyecciones.prioridad) missing.push('proyecciones.prioridad');
      if (!answers.proyecciones.interes_formacion || answers.proyecciones.interes_formacion.length === 0) missing.push('proyecciones.interes_formacion');
      if (!answers.proyecciones.bienestar_deseado || answers.proyecciones.bienestar_deseado.length === 0) missing.push('proyecciones.bienestar_deseado');
    } else if (currentStep === 6) {
      if (!habeasAccepted) missing.push('habeas');
      if (!answers.documentos.id_frontal) missing.push('document.id_frontal');
      if (!answers.documentos.id_reverso) missing.push('document.id_reverso');
      if (!answers.documentos.utility_bill) missing.push('document.utility_bill');
    }
    
    setValidationErrors(missing);
    return missing.length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowErrorPopup(true);
    }
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!validateStep()) {
      setShowErrorPopup(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${window.location.origin}/api/analyst/register-complete-characterization`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user: userData, answers })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      
      localStorage.removeItem(PERSISTENCE_KEY); // Clear cache on success
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-unidas-dark/95 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 border border-white/10 w-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-unidas-primary/10 to-transparent shrink-0">
          <div className="flex items-center space-x-4">
            <div className="bg-unidas-primary/20 p-2 rounded-xl">
              <ClipboardList className="w-6 h-6 text-unidas-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Encuesta Presencial</h2>
              <p className="text-xs text-white/40 font-medium italic">Estructura oficial del cuestionario</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={clearData}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpiar Encuesta</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-6 h-6 text-white/40" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1 bg-white/5 w-full shrink-0">
          <motion.div 
            className="h-full bg-unidas-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow p-8 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-500 text-sm font-bold">{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <StepHeader icon={UserPlus} title="Registro de Identidad" color="blue" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <QuestionInput label="Nombre Completo" name="full_name" value={userData.full_name} onChange={handleUserChange} error={validationErrors.includes('full_name')} />
                  <div className="grid grid-cols-3 gap-2">
                    <QuestionSelect label="Tipo" name="document_type" value={userData.document_type} options={['CC', 'CE', 'PEP', 'PPT']} onChange={handleUserChange} />
                    <QuestionInput label="N° Documento" name="document_number" value={userData.document_number} onChange={handleUserChange} error={validationErrors.includes('document_number')} className="col-span-2" />
                  </div>
                  <QuestionInput label="Celular" name="phone" value={userData.phone} onChange={handleUserChange} />
                  <QuestionInput label="Correo Electrónico" type="email" name="email" value={userData.email} onChange={handleUserChange} />
                  <QuestionInput label="Definir Contraseña (PIN)" type="password" name="password" value={userData.password} onChange={handleUserChange} error={validationErrors.includes('password')} className="md:col-span-2" />
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <StepHeader icon={HeartPulse} title="Perfil Sociodemográfico" color="blue" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Question 
                    label="FECHA DE NACIMIENTO" 
                    subtitle="Seleccione su fecha de nacimiento para calcular su edad."
                    type="date-split" 
                    value={birthDate} 
                    onChange={(v: any) => {
                      setBirthDate(v);
                    }} 
                    error={validationErrors.includes('socio.fecha_nacimiento')}
                    ageDisplay={answers.socio?.edad ? `${answers.socio.edad} Años` : null}
                  />
                  <Question 
                    label="IDENTIDAD DE GÉNERO" 
                    subtitle="Cómo se identifica actualmente."
                    type="pills"
                    options={['Femenino', 'Masculino', 'No binario', 'Transgénero', 'Otro']} 
                    value={answers.socio.genero} 
                    onChange={(v: string) => handleInputChange('socio', 'genero', v)} 
                    error={validationErrors.includes('socio.genero')} 
                  />
                  <Question 
                    label="BARRIO DE RESIDENCIA" 
                    subtitle="Barrio donde vive actualmente en Barrios Unidos."
                    type="select" 
                    options={ALL_BARRIOS} 
                    value={answers.socio.barrio} 
                    onChange={(v: string) => handleInputChange('socio', 'barrio', v)} 
                    error={validationErrors.includes('socio.barrio')} 
                  />
                  <Question 
                    label="ZONA (UPL)" 
                    subtitle="Zona geográfica detectada automáticamente."
                    type="select" 
                    options={ALL_UPLS} 
                    value={answers.socio.upz} 
                    disabled={true} 
                    onChange={(v: string) => handleInputChange('socio', 'upz', v)} 
                  />
                  <Question 
                    label="NIVEL EDUCATIVO" 
                    subtitle="Escolaridad alcanzada."
                    options={['Primaria', 'Secundaria', 'Técnico', 'Tecnólogo', 'Universitario', 'Posgrado', 'Ninguno', 'Otro']} 
                    type="pills"
                    value={answers.socio.nivel_educativo} 
                    onChange={(v: string) => handleInputChange('socio', 'nivel_educativo', v)} 
                    showOther={answers.socio.nivel_educativo === 'Otro'} 
                    otherValue={answers.socio.nivel_educativo_otro} 
                    onOtherChange={(v: string) => handleInputChange('socio', 'nivel_educativo_otro', v)}
                    error={validationErrors.includes('socio.nivel_educativo')} 
                  />
                  <Question 
                    label="PERTENENCIA POBLACIONAL" 
                    subtitle="Grupos de identificación poblacional."
                    type="checkbox-group" 
                    options={['Mujer Indígena', 'Afrodescendiente', 'Migrante', 'Persona con discapacidad', 'Víctima del conflicto', 'Ninguna', 'Otro']} 
                    value={answers.socio.pertenencia || []} 
                    onChange={(v: string) => handleCheckboxChange('socio', 'pertenencia', v)} 
                    showOther={answers.socio.pertenencia?.includes('Otro')} 
                    otherValue={answers.socio.pertenencia_otro} 
                    onOtherChange={(v: string) => handleInputChange('socio', 'pertenencia_otro', v)}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <StepHeader icon={Wallet} title="Economía y Autonomía" color="green" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Question 
                    label="INGRESOS MENSUALES" 
                    subtitle="Promedio de ingresos personales al mes."
                    type="range" 
                    min={0} 
                    max={5000000} 
                    step={50000} 
                    value={answers.economia.ingresos} 
                    onChange={(v: string) => handleInputChange('economia', 'ingresos', v)} 
                    error={validationErrors.includes('economia.ingresos')} 
                  />
                  <Question 
                    label="FUENTE DE INGRESOS" 
                    subtitle="Principal origen de sus recursos."
                    type="pills"
                    options={['Trabajo formal', 'Trabajo informal', 'Apoyo familiar', 'Subsidios', 'Pensión', 'Otro']} 
                    value={answers.economia.fuente_ingresos} 
                    onChange={(v: string) => handleInputChange('economia', 'fuente_ingresos', v)} 
                    showOther={answers.economia.fuente_ingresos === 'Otro'} 
                    otherValue={answers.economia.fuente_ingresos_otro} 
                    onOtherChange={(v: string) => handleInputChange('economia', 'fuente_ingresos_otro', v)}
                    error={validationErrors.includes('economia.fuente_ingresos')} 
                  />
                  <Question 
                    label="SITUACIÓN LABORAL" 
                    subtitle="Estado ocupacional actual."
                    type="pills"
                    options={['Empleado', 'Independiente', 'Buscando empleo', 'Hogar', 'Estudiante', 'Jubilado', 'Otro']} 
                    value={answers.economia.situacion_laboral} 
                    onChange={(v: string) => handleInputChange('economia', 'situacion_laboral', v)} 
                    showOther={answers.economia.situacion_laboral === 'Otro'} 
                    otherValue={answers.economia.situacion_laboral_otro} 
                    onOtherChange={(v: string) => handleInputChange('economia', 'situacion_laboral_otro', v)}
                    error={validationErrors.includes('economia.situacion_laboral')} 
                    className="md:col-span-2"
                  />
                  <Question 
                    label="TIPO DE VIVIENDA" 
                    subtitle="Condición de residencia."
                    type="pills"
                    options={['Propia', 'Arriendo', 'Compartida', 'Familiar', 'Otro']} 
                    value={answers.economia.tipo_vivienda} 
                    onChange={(v: string) => handleInputChange('economia', 'tipo_vivienda', v)} 
                    showOther={answers.economia.tipo_vivienda === 'Otro'} 
                    otherValue={answers.economia.tipo_vivienda_otro} 
                    onOtherChange={(v: string) => handleInputChange('economia', 'tipo_vivienda_otro', v)}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <StepHeader icon={Clock} title="Carga de Cuidado" color="orange" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 bg-white/5 border border-white/10 p-4 rounded-3xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white">¿Trabaja como cuidadora?</h4>
                      <p className="text-[10px] text-white/40 italic">Define el acceso a las preguntas de carga.</p>
                    </div>
                    <div className="flex space-x-2">
                      {['Sí', 'No'].map(opt => (
                        <button 
                          key={opt} onClick={() => handleInputChange('cuidado', 'es_cuidadora', opt)}
                          className={cn("px-6 py-2 rounded-xl font-bold transition-all", answers.cuidado.es_cuidadora === opt ? "bg-unidas-primary text-white" : "bg-white/5 text-white/20")}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {answers.cuidado.es_cuidadora === 'Sí' && (
                    <>
                      <Question 
                        label="POBLACIÓN BAJO CUIDADO" 
                        subtitle="A quién brinda cuidado habitualmente."
                        type="pills" 
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
                        value={answers.cuidado.poblacion} 
                        onChange={(v: string) => handleInputChange('cuidado', 'poblacion', v)} 
                        showOther={answers.cuidado.poblacion === 'Otro'} 
                        otherValue={answers.cuidado.poblacion_otro} 
                        onOtherChange={(v: string) => handleInputChange('cuidado', 'poblacion_otro', v)}
                        error={validationErrors.includes('cuidado.poblacion')} 
                      />
                      <Question 
                        label="HORAS DIARIAS" 
                        subtitle="Tiempo estimado al día dedicado a tareas de cuidado."
                        type="range" 
                        min={0} 
                        max={24} 
                        step={1} 
                        suffix="HORAS"
                        value={answers.cuidado.horas} 
                        onChange={(v: string) => handleInputChange('cuidado', 'horas', v)} 
                        error={validationErrors.includes('cuidado.horas')} 
                      />
                      <Question 
                        label="CARGA EMOCIONAL" 
                        subtitle="Agotamiento (1: Bajo, 5: Alto)."
                        type="rating" 
                        value={answers.cuidado.carga_emocional} 
                        onChange={(v: string) => handleInputChange('cuidado', 'carga_emocional', v)} 
                        error={validationErrors.includes('cuidado.carga_emocional')} 
                      />
                      <Question 
                        label="CONOCIMIENTO DE PROGRAMAS" 
                        subtitle="¿Conoce programas o servicios públicos para cuidadoras?"
                        type="pills"
                        options={['Sí', 'No']} 
                        value={answers.cuidado.conoce_programas} 
                        onChange={(v: string) => handleInputChange('cuidado', 'conoce_programas', v)} 
                        showOther={answers.cuidado.conoce_programas === 'Sí'} 
                        otherValue={answers.cuidado.cuales_programas} 
                        onOtherChange={(v: string) => handleInputChange('cuidado', 'cuales_programas', v)}
                        otherPlaceholder="¿Cuáles?"
                      />
                      <Question 
                        label="RECONOCIMIENTO PERCIBIDO" 
                        subtitle="¿Qué tanto reconocimiento percibe por las labores que realiza?"
                        type="pills"
                        options={['Nada reconocida', 'Poco reconocida', 'Medianamente reconocida', 'Muy reconocida']} 
                        value={answers.cuidado.reconocimiento} 
                        onChange={(v: string) => handleInputChange('cuidado', 'reconocimiento', v)} 
                        error={validationErrors.includes('cuidado.reconocimiento')} 
                      />
                      <Question 
                        label="SENTIMIENTO FRECUENTE" 
                        subtitle="¿Qué sentimiento experimenta con más frecuencia al cuidar?"
                        type="pills"
                        options={['Ira', 'Incertidumbre', 'Temor', 'Tranquilidad', 'Felicidad', 'Angustia', 'Tristeza', 'Otro']} 
                        value={answers.cuidado.sentimiento} 
                        onChange={(v: string) => handleInputChange('cuidado', 'sentimiento', v)} 
                        showOther={answers.cuidado.sentimiento === 'Otro'} 
                        otherValue={answers.cuidado.sentimiento_otro} 
                        onOtherChange={(v: string) => handleInputChange('cuidado', 'sentimiento_otro', v)}
                        error={validationErrors.includes('cuidado.sentimiento')} 
                        className="md:col-span-2" 
                      />
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <StepHeader icon={Shield} title="Bienestar y Seguridad" color="red" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Question 
                    label="SEGURIDAD EN HOGAR" 
                    subtitle="Percepción de tranquilidad y protección en su vivienda."
                    type="pills"
                    options={['Siempre', 'Casi siempre', 'A veces', 'Nunca']} 
                    value={answers.bienestar.seguridad_hogar} 
                    onChange={(v: string) => handleInputChange('bienestar', 'seguridad_hogar', v)} 
                    error={validationErrors.includes('bienestar.seguridad_hogar')} 
                  />
                  <Question 
                    label="TIPOS DE VIOLENCIA PERCIBIDA" 
                    subtitle="Identifique situaciones de vulneración experimentadas."
                    type="checkbox-group" 
                    options={['Física', 'Psicológica', 'Económica', 'Sexual', 'Patrimonial', 'Digital', 'Intrafamiliar', 'Institucional', 'Otro']} 
                    value={answers.bienestar.violencia || []} 
                    onChange={(v: string) => handleCheckboxChange('bienestar', 'violencia', v)} 
                    showOther={answers.bienestar.violencia?.includes('Otro')} 
                    otherValue={answers.bienestar.violencia_otro} 
                    onOtherChange={(v) => handleInputChange('bienestar', 'violencia_otro', v)}
                    error={validationErrors.includes('bienestar.violencia')} 
                  />
                  <Question 
                    label="FACTORES DE RIESGO" 
                    subtitle="Situaciones del entorno que afectan su calidad de vida."
                    type="checkbox-group" 
                    options={['Desempleo', 'Consumo de sustancias SPA', 'Hacinamiento', 'Falta de apoyo familiar', 'Discriminación', 'Otro']} 
                    value={answers.bienestar.factores_riesgo || []} 
                    onChange={(v: string) => handleCheckboxChange('bienestar', 'factores_riesgo', v)} 
                    showOther={answers.bienestar.factores_riesgo?.includes('Otro')} 
                    otherValue={answers.bienestar.factores_riesgo_otro} 
                    onOtherChange={(v) => handleInputChange('bienestar', 'factores_riesgo_otro', v)}
                  />
                  <Question 
                    label="PARTICIPACIÓN EN ACTIVIDADES" 
                    subtitle="¿Le gustaría participar en espacios para cuidadoras?"
                    type="pills"
                    options={['Sí', 'No', 'Tal vez']} 
                    value={answers.bienestar.participar} 
                    onChange={(v: string) => handleInputChange('bienestar', 'participar', v)} 
                    showOther={answers.bienestar.participar === 'No'} 
                    otherValue={answers.bienestar.participar_porque} 
                    onOtherChange={(v) => handleInputChange('bienestar', 'participar_porque', v)}
                    otherPlaceholder="¿Por qué?"
                    error={validationErrors.includes('bienestar.participar')} 
                  />
                  {(answers.bienestar.participar === 'Sí' || answers.bienestar.participar === 'Tal vez') && (
                    <Question 
                      label="PRINCIPAL DIFICULTAD" 
                      subtitle="¿Cuál sería el mayor obstáculo para su asistencia?"
                      type="pills"
                      options={['Tiempo', 'Movilidad', 'Motivación', 'Seguridad del sector', 'Prevención social', 'Falta de empatía']} 
                      value={answers.bienestar.dificultad} 
                      onChange={(v: string) => handleInputChange('bienestar', 'dificultad', v)} 
                      className="md:col-span-2"
                    />
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <StepHeader icon={Star} title="Sueños y Proyecciones" color="purple" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Question 
                    label="PRIORIDAD URGENTE" 
                    subtitle="Identifique su necesidad más inmediata para mejorar su bienestar."
                    type="pills"
                    options={['Salud', 'Empleo', 'Educación', 'Vivienda', 'Apoyo Psicosocial', 'Seguridad', 'Otro']} 
                    value={answers.proyecciones.prioridad} 
                    onChange={(v: string) => handleInputChange('proyecciones', 'prioridad', v)} 
                    showOther={answers.proyecciones.prioridad === 'Otro'} 
                    otherValue={answers.proyecciones.prioridad_otro} 
                    onOtherChange={(v) => handleInputChange('proyecciones', 'prioridad_otro', v)}
                    error={validationErrors.includes('proyecciones.prioridad')} 
                  />
                  <Question 
                    label="INTERÉS DE FORMACIÓN" 
                    subtitle="¿En qué áreas le gustaría adquirir nuevos conocimientos?"
                    type="checkbox-group" 
                    options={['Tecnología', 'Artes/Oficios', 'Emprendimiento', 'Gestión Financiera', 'Liderazgo', 'Otro']} 
                    value={answers.proyecciones.interes_formacion || []} 
                    onChange={(v) => handleCheckboxChange('proyecciones', 'interes_formacion', v)} 
                    showOther={answers.proyecciones.interes_formacion?.includes('Otro')} 
                    otherValue={answers.proyecciones.interes_formacion_otro} 
                    onOtherChange={(v) => handleInputChange('proyecciones', 'interes_formacion_otro', v)}
                  />
                  <Question 
                    label="BIENESTAR DESEADO" 
                    subtitle="Actividades que le gustaría realizar para su cuidado personal."
                    type="checkbox-group" 
                    options={['Yoga/Meditación', 'Deporte', 'Lectura', 'Espacios de escucha', 'Manualidades', 'Otro']} 
                    value={answers.proyecciones.bienestar_deseado || []} 
                    onChange={(v) => handleCheckboxChange('proyecciones', 'bienestar_deseado', v)} 
                    showOther={answers.proyecciones.bienestar_deseado?.includes('Otro')} 
                    otherValue={answers.proyecciones.bienestar_deseado_otro} 
                    onOtherChange={(v) => handleInputChange('proyecciones', 'bienestar_deseado_otro', v)}
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
                    value={answers.proyecciones.proyectos_ideales || []} 
                    onChange={(v) => handleCheckboxChange('proyecciones', 'proyectos_ideales', v)} 
                    showOther={answers.proyecciones.proyectos_ideales?.includes('Otro')} 
                    otherValue={answers.proyecciones.proyectos_ideales_otro} 
                    onOtherChange={(v) => handleInputChange('proyecciones', 'proyectos_ideales_otro', v)}
                    className="md:col-span-2"
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <StepHeader icon={FileText} title="Documentos y Consentimiento" color="slate" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocUploadItem label="Cédula Frontal" type="id_frontal" onUpload={handleFileUpload} url={answers.documentos.id_frontal} uploading={uploading === 'id_frontal'} hasError={validationErrors.includes('document.id_frontal')} />
                  <DocUploadItem label="Cédula Reverso" type="id_reverso" onUpload={handleFileUpload} url={answers.documentos.id_reverso} uploading={uploading === 'id_reverso'} hasError={validationErrors.includes('document.id_reverso')} />
                  <DocUploadItem label="Recibo Público" type="utility_bill" onUpload={handleFileUpload} url={answers.documentos.utility_bill} uploading={uploading === 'utility_bill'} className="md:col-span-2" hasError={validationErrors.includes('document.utility_bill')} />
                  
                  <div className={cn("md:col-span-2 p-8 rounded-[2rem] border transition-all", habeasAccepted ? "bg-unidas-primary/10 border-unidas-primary/20" : "bg-white/5 border-white/10", validationErrors.includes('habeas') && "border-red-500")}>
                    <div className="flex items-start space-x-4">
                      <input 
                        type="checkbox" checked={habeasAccepted} onChange={(e) => setHabeasAccepted(e.target.checked)}
                        className="mt-1 w-6 h-6 rounded-lg border-white/20 bg-white/5 text-unidas-primary focus:ring-unidas-primary transition-all"
                      />
                      <div>
                        <p className="text-white font-black text-lg">Acepto la Política de Habeas Data</p>
                        <p className="text-white/40 text-xs mt-2 leading-relaxed font-medium italic">Autorizo el tratamiento de mis datos personales para fines institucionales según la Ley 1581 de 2012.</p>
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
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
          <button 
            onClick={prevStep} disabled={currentStep === 0 || loading}
            className="flex items-center space-x-2 text-white/40 hover:text-white transition-colors disabled:opacity-0"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-bold uppercase tracking-widest text-[10px]">Atrás</span>
          </button>
          
          <div className="flex space-x-3">
            {currentStep < 6 ? (
              <button 
                onClick={nextStep}
                className="bg-unidas-primary text-white px-8 py-3 rounded-2xl font-black flex items-center space-x-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-unidas-primary/20 uppercase tracking-widest text-xs"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit} disabled={loading}
                className="bg-green-500 text-white px-10 py-4 rounded-2xl font-black flex items-center space-x-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-green-500/20 disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
                <span>Finalizar y Aprobar</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Validation Error Popup */}
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

      {/* Document Viewer Overlay */}
      {viewerConfig && (
        <DocumentViewer
          url={viewerConfig.url}
          title={viewerConfig.title}
          onClose={() => setViewerConfig(null)}
        />
      )}
    </div>
  );
}

function StepHeader({ icon: Icon, title, color }: any) {
  const colors: any = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    slate: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  };
  return (
    <div className="flex items-center space-x-4 mb-8">
      <div className={cn("p-4 rounded-2xl border", colors[color])}><Icon className="w-7 h-7" /></div>
      <h3 className="text-xl font-black uppercase tracking-widest text-white">{title}</h3>
    </div>
  );
}

function QuestionInput({ label, name, value, onChange, error, className, type = 'text' }: any) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type={type} name={name} value={value} onChange={onChange}
        className={cn("w-full bg-white/5 border p-4 rounded-2xl text-white outline-none focus:border-unidas-primary transition-all font-bold", error ? "border-red-500" : "border-white/10")}
      />
    </div>
  );
}

function QuestionSelect({ label, name, value, options, onChange, className }: any) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{label}</label>
      <select 
        name={name} value={value} onChange={onChange}
        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-unidas-primary transition-all font-bold appearance-none"
      >
        {options.map((opt: string) => <option key={opt} value={opt} className="bg-unidas-dark">{opt}</option>)}
      </select>
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
                    value?.includes(opt)
                      ? "bg-unidas-primary/10 border-unidas-primary text-unidas-primary"
                      : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                  )}
                >
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={value?.includes(opt)}
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
                value={value?.day || ''}
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
                value={value?.month || ''}
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
                value={value?.year || ''}
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

function DocUploadItem({ label, type, onUpload, url, uploading, className, hasError }: any) {
  return (
    <div className={cn(
      "p-8 rounded-[2rem] bg-white/5 border flex flex-col items-center justify-center space-y-5 group transition-all hover:border-unidas-primary/40",
      hasError ? "border-red-500/50 bg-red-500/5" : "border-white/10",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-unidas-primary/10 flex items-center justify-center text-unidas-primary group-hover:scale-110 transition-transform border border-unidas-primary/20">
        {uploading ? <div className="w-6 h-6 border-2 border-unidas-primary border-t-transparent rounded-full animate-spin" /> : url ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
      </div>
      <div className="text-center">
        <p className="text-xs font-black text-white uppercase tracking-widest">{label}</p>
        <p className="text-[10px] text-white/30 font-medium italic mt-2">{url ? 'Documento verificado' : 'Soporte físico requerido'}</p>
      </div>
      <div className="flex space-x-3">
        <label className="bg-unidas-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all shadow-lg shadow-unidas-primary/20">
          {url ? 'Reemplazar' : 'Subir Archivo'}
          <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(type, e.target.files[0])} accept="image/*,application/pdf" />
        </label>
        {url && (
          <button onClick={() => window.open(url, '_blank')} className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all">
            <Eye className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

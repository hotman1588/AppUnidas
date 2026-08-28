import { useState, useEffect } from 'react';
import { Search, CheckCircle2, AlertTriangle, Loader2, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export type ValidationResult = {
  survey: 'uno' | 'dos';
  applicable: boolean;
  exists: boolean;
  document_number: string;
  message: string;
  record?: {
    survey_id: number;
    user_id: number;
    full_name: string;
    status: string;
    status_label: string;
    analyst_name: string | null;
    created_at: string;
    updated_at: string;
  };
};

interface DocumentValidatorProps {
  /** Encuesta contra la cual se valida. Solo la Encuesta Uno almacena cédulas. */
  surveyId: 'uno' | 'dos';
  token: string | null;
  /** Cédula controlada desde el formulario padre (modo recolector). */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Se notifica al padre para que bloquee o habilite el envío. */
  onResult?: (result: ValidationResult | null) => void;
  /** 'dark' para el modal del recolector, 'light' para el panel de administración. */
  theme?: 'dark' | 'light';
  label?: string;
  className?: string;
}

/**
 * Buscador y validador de cédula por encuesta. Consulta si el documento ya fue
 * registrado en la encuesta indicada y reporta el resultado al componente padre.
 *
 * Es una ayuda de usabilidad: el bloqueo definitivo lo aplica el servidor en
 * /api/analyst/register-complete-characterization (HTTP 409).
 */
export function DocumentValidator({
  surveyId,
  token,
  value,
  onValueChange,
  onResult,
  theme = 'dark',
  label = 'Validación de Cédula',
  className
}: DocumentValidatorProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState('');
  const documentNumber = isControlled ? value! : internalValue;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Si la cédula cambia después de validar, el resultado anterior deja de ser
  // válido: se descarta para que el padre vuelva a bloquear el envío.
  useEffect(() => {
    if (result && result.document_number !== documentNumber.replace(/\D/g, '').replace(/^0+(?=\d)/, '')) {
      setResult(null);
      onResult?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentNumber]);

  const handleChange = (next: string) => {
    setError(null);
    if (isControlled) onValueChange?.(next);
    else setInternalValue(next);
  };

  const handleValidate = async () => {
    const normalized = documentNumber.replace(/\D/g, '');
    if (!normalized) {
      setError('Ingrese un número de cédula para validar.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/surveys/${surveyId}/validate-document?document_number=${encodeURIComponent(normalized)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'No se pudo validar la cédula.');
        setResult(null);
        onResult?.(null);
        return;
      }

      setResult(data);
      onResult?.(data);
    } catch (err) {
      console.error('Error validando cédula:', err);
      setError('Error de conexión. Intente nuevamente.');
      setResult(null);
      onResult?.(null);
    } finally {
      setLoading(false);
    }
  };

  const dark = theme === 'dark';

  return (
    <div className={cn('space-y-3', className)}>
      <label
        className={cn(
          'block text-[10px] font-black uppercase tracking-widest',
          dark ? 'text-white/50' : 'text-slate-400'
        )}
      >
        {label}
      </label>

      <div className="flex items-stretch gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={documentNumber}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleValidate();
            }
          }}
          placeholder="Número de cédula"
          className={cn(
            'flex-grow px-4 py-3 rounded-xl font-bold text-sm outline-none transition-all',
            dark
              ? 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-unidas-primary'
              : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-unidas-primary'
          )}
        />
        <button
          type="button"
          onClick={handleValidate}
          disabled={loading || !documentNumber.trim()}
          className="flex items-center space-x-2 bg-unidas-primary text-white px-5 py-3 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-unidas-primary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>{loading ? 'Validando...' : 'Validar Cédula'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-red-500 text-xs font-bold">{error}</p>
        </div>
      )}

      {/* La Encuesta Dos es anónima: no se puede afirmar disponibilidad. */}
      {result && !result.applicable && (
        <div className="flex items-start space-x-2 bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-xl">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-500 text-xs font-bold leading-relaxed">{result.message}</p>
        </div>
      )}

      {result?.applicable && result.exists && (
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl space-y-1">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-red-500 text-sm font-black">{result.message}</p>
          </div>
          {result.record && (
            <p className={cn('text-xs font-medium pl-6', dark ? 'text-white/50' : 'text-slate-500')}>
              {result.record.full_name} · {result.record.status_label}
              {result.record.analyst_name ? ` · Recolector: ${result.record.analyst_name}` : ''}
              {result.record.updated_at
                ? ` · ${new Date(result.record.updated_at).toLocaleDateString('es-CO')}`
                : ''}
            </p>
          )}
        </div>
      )}

      {result?.applicable && !result.exists && (
        <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-emerald-500 text-sm font-black">{result.message}</p>
        </div>
      )}
    </div>
  );
}

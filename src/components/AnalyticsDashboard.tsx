import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Legend
} from "recharts";
import { BARRIO_TO_UPL } from "../lib/surveyTwoSchema";

// ─────────────── PALETTE ────────────────────────────────────────────────────
const P = {
  primary: "#6B21A8", secondary: "#9333EA", accent: "#F59E0B",
  teal: "#0D9488", rose: "#E11D48", slate: "#1E293B",
  surface: "#F8F5FF", muted: "#E9D5FF",
};
const PIE = ["#6B21A8","#9333EA","#A855F7","#C084FC","#E9D5FF","#F59E0B","#0D9488","#E11D48","#7C3AED","#4C1D95"];
const BAR = ["#6B21A8","#9333EA","#A855F7","#C084FC","#7C3AED","#4C1D95","#DDD6FE","#0D9488","#F59E0B","#E11D48"];

const FREQ_MAP: Record<string, number> = {
  "Nunca": 1,
  "Casi nunca": 2,
  "Algunas veces": 3,
  "Casi siempre": 4,
  "Siempre": 5
};

const FREQ_SCALE = ["Nunca", "Casi nunca", "Algunas veces", "Casi siempre", "Siempre"];

const REMOVED_ANALYTICS_TERMS = [
  'ENF. DIAGNOSTICADA',
  'SIN RECONOCIMIENTO',
  'AGOTADAS',
  'AGOTAMIENTO EMOCIONAL',
  'CANSANCIO',
  'NIVEL DE RECONOCIMIENTO',
  'TIENE ENFERMEDAD',
  'TIPO DE ENFERMEDAD',
  'TIEMPO CUIDADO',
  'SEGURIDAD EN EL HOGAR',
  'DESEAN M',
  'BIENESTAR DESEADAS',
  'APOYO INSTITUCIONAL',
  'COMPARTEN HABILIDADES',
  'COMPARTE HABILIDADES'
];

const isRemovedAnalyticsBlock = (text?: string) => {
  const normalized = String(text || '').toUpperCase();
  if (normalized.includes('PARTICIPACI')) return normalized.includes('SOCIAL');
  return REMOVED_ANALYTICS_TERMS.some(term => normalized.includes(term));
};

// ─────────────── COMPONENTS ─────────────────────────────────────────────────
const KPICard = ({icon,label,value,sub,color=P.primary}: any) => {
  if (isRemovedAnalyticsBlock(label)) return null;
  return (
  <div style={{background:"white",borderRadius:16,padding:"18px 22px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 16px rgba(107,33,168,0.10)",borderLeft:`4px solid ${color}`}}>
    <div style={{width:50,height:50,borderRadius:13,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{icon}</div>
    <div>
      <div style={{fontSize:26,fontWeight:800,color,lineHeight:1.1}}>{value}</div>
      <div style={{fontSize:12.5,fontWeight:700,color:P.slate,marginTop:2}}>{label}</div>
      {sub && <div style={{fontSize:11,color:"#64748B",marginTop:2}}>{sub}</div>}
    </div>
  </div>
  );
};

const SecTitle = ({icon,title,subtitle,module}: any) => (
  <div style={{borderBottom:`2px solid ${P.muted}`,paddingBottom:14,marginBottom:22,marginTop:4,display:"flex",alignItems:"flex-start",gap:12}}>
    <div style={{width:42,height:42,borderRadius:11,background:`linear-gradient(135deg,${P.primary},${P.secondary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>{icon}</div>
    <div>
      <div style={{fontSize:10.5,fontWeight:700,color:P.secondary,letterSpacing:2,textTransform:"uppercase"}}>{module}</div>
      <div style={{fontSize:19,fontWeight:800,color:P.slate,lineHeight:1.2}}>{title}</div>
      <div style={{fontSize:12.5,color:"#64748B",marginTop:3}}>{subtitle}</div>
    </div>
  </div>
);

const Card = ({title,children,span}: any) => (
  <div style={{background:"white",borderRadius:16,padding:"18px 18px 14px",boxShadow:"0 2px 14px rgba(107,33,168,0.08)",gridColumn:span?`span ${span}`:undefined}}>
    <div style={{fontSize:12,fontWeight:700,color:P.secondary,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>{title}</div>
    {children}
  </div>
);

const Insight = ({emoji,text,highlight,color=P.primary}: any) => (
  <div style={{background:`linear-gradient(120deg,${color}10,${P.secondary}06)`,border:`1.5px solid ${P.muted}`,borderRadius:12,padding:"11px 14px",display:"flex",gap:9,alignItems:"flex-start"}}>
    <span style={{fontSize:17,flexShrink:0}}>{emoji}</span>
    <div style={{fontSize:12,color:P.slate,lineHeight:1.5}}>
      {highlight && <strong style={{color}}>{highlight} </strong>}
      {text}
    </div>
  </div>
);

const HBar = ({data,title,note,total}: any) => {
  if (isRemovedAnalyticsBlock(title)) return null;
  return (
  <Card title={title}>
    {note && <div style={{fontSize:11,color:"#94A3B8",marginBottom:8,fontStyle:"italic"}}>{note}</div>}
    <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height={Math.max((data?.length || 0)*34+20, 100)}>
      <BarChart data={data} layout="vertical" margin={{left:4,right:24,top:2,bottom:2}}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9"/>
        <XAxis type="number" tick={{fontSize:10.5}} tickLine={false} axisLine={false}/>
        <YAxis dataKey="name" type="category" width={145} tick={{fontSize:10.5,fill:P.slate}} tickLine={false} axisLine={false}/>
        <Tooltip formatter={(v: number)=>[total > 0 ? `${v} (${Math.round(v/total*100)}%)` : v, "Cuidadoras"]}/>
        <Bar dataKey="value" radius={[0,6,6,0]} maxBarSize={20}>
          {data?.map((_: any,i: number)=><Cell key={i} fill={PIE[i%PIE.length]}/>)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </Card>
  );
};

const SmallPie = ({data,title,total}: any) => {
  if (isRemovedAnalyticsBlock(title)) return null;
  return (
  <Card title={title}>
    <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={78} dataKey="value" paddingAngle={3}>
          {data?.map((_: any,i: number)=><Cell key={i} fill={PIE[i%PIE.length]}/>)}
        </Pie>
        <Tooltip formatter={(v: number)=>[total > 0 ? `${v} (${Math.round(v/total*100)}%)` : v]}/>
        <Legend iconType="circle" iconSize={8} formatter={(v: string)=><span style={{fontSize:10.5,color:P.slate}}>{v}</span>}/>
      </PieChart>
    </ResponsiveContainer>
  </Card>
  );
};

const FreqBar = ({data,title,color=P.primary}: any) => {
  if (isRemovedAnalyticsBlock(title)) return null;
  return (
  <Card title={title}>
    <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height={155}>
      <BarChart data={data} margin={{left:0,right:6,top:2,bottom:2}}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9"/>
        <XAxis dataKey="freq" tick={{fontSize:9.5,fill:P.slate}} tickLine={false} axisLine={false}/>
        <YAxis tick={{fontSize:9.5}} tickLine={false} axisLine={false} width={18}/>
        <Tooltip/>
        <Bar dataKey="value" fill={color} radius={[6,6,0,0]} maxBarSize={30}/>
      </BarChart>
    </ResponsiveContainer>
  </Card>
  );
};

// ─── MAPA SVG BARRIOS UNIDOS ─────────────────────────────────────────────────
const MapaBarriosUnidos = ({ uplData = [] }: { uplData?: any[] }) => {
  const upzColors: Record<string, string> = {"Los Alcázares":"#9333EA","Doce de Octubre":"#0D9488","Los Andes":"#F59E0B"};
  const fallbackPalette = [P.primary, P.teal, P.accent, P.rose, "#7C3AED", "#2563EB", "#DB2777"];
  const [hov,setHov] = useState<string | null>(null);

  // Burbujas por UPL construidas con los datos REALES (no con barrios fijos),
  // así el mapa refleja todos los registros con UPL.
  const bubbles = (uplData || [])
    .filter(u => u.name && u.value > 0)
    .map((u, i) => ({ name: u.name as string, count: u.value as number, color: upzColors[u.name] || fallbackPalette[i % fallbackPalette.length] }));
  const maxCount = Math.max(1, ...bubbles.map(b => b.count));
  const cols = Math.min(3, Math.max(1, bubbles.length));
  const cellW = 420 / cols;
  const positioned = bubbles.map((b, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const r = 22 + Math.round((b.count / maxCount) * 30);
    return { ...b, r, x: cellW * col + cellW / 2, y: 70 + row * 120 };
  });

  if (bubbles.length === 0) {
    return (
      <Card title="Distribución Territorial — UPL · Barrios Unidos">
        <div style={{padding: "20px", color: "#64748B", textAlign: "center", fontSize: 12}}>No hay datos territoriales suficientes para mostrar el mapa.</div>
      </Card>
    );
  }

  const rows = Math.ceil(bubbles.length / cols);
  const vbH = Math.max(220, 40 + rows * 120);

  return (
    <Card title="Distribución Territorial — UPL · Barrios Unidos">
      <div style={{display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
        <svg viewBox={`0 0 420 ${vbH}`} style={{width:"100%",maxWidth:380,height:"auto",background:"#F8F5FF",borderRadius:12,border:`1.5px solid ${P.muted}`}}>
          {positioned.map(b=>(
            <g key={b.name} onMouseEnter={()=>setHov(b.name)} onMouseLeave={()=>setHov(null)} style={{cursor:"pointer"}}>
              <circle cx={b.x} cy={b.y} r={b.r} fill={b.color} fillOpacity={hov===b.name?0.95:0.7} stroke="white" strokeWidth="2"/>
              <text x={b.x} y={b.y} textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="800" fill="white">{b.count}</text>
              <text x={b.x} y={b.y + b.r + 14} textAnchor="middle" fontSize="10" fontWeight="700" fill={P.slate}>{b.name}</text>
            </g>
          ))}
          {/* North indicator */}
          <text x="402" y="20" fontSize="14" fill={P.primary} fontWeight="900">N</text>
        </svg>
        <div style={{flex:1,minWidth:120}}>
          <div style={{fontSize:11.5,fontWeight:800,color:P.slate,marginBottom:10}}>Leyenda UPL</div>
          {/* La leyenda usa los totales reales por UPL (todos los registrados). */}
          {uplData.map((u, i) => {
            const col = upzColors[u.name] || fallbackPalette[i % fallbackPalette.length];
            return (
              <div key={u.name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:14,height:14,borderRadius:3,background:col,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:11.5,fontWeight:700,color:P.slate}}>{u.name}</div>
                  <div style={{fontSize:10.5,color:"#64748B"}}>{u.value} cuidadora{u.value!==1?"s":""}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

// ─── TABLA INSEGURIDAD ───────────────────────────────────────────────────────
const TablaInseguridad = ({ data, total }: { data: any[], total: number }) => {
  if (data.length === 0) {
    return (
      <Card title="🚨 Análisis Territorial de Inseguridad — Barrio · UPL · UPZ">
        <div style={{padding: "10px", color: "#64748B", fontSize: 12}}>No hay reportes de inseguridad cruzada para visualizar.</div>
      </Card>
    );
  }

  const grandTotal = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card title="🚨 Análisis Territorial de Inseguridad — Barrio · UPL · UPZ">
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:12}}>
          <thead>
            <tr style={{background:`linear-gradient(135deg,${P.primary},${P.secondary})`}}>
              {["Barrio Inseguro","UPL Asignada","UPZ","# Reportes","% del total"].map(h=>(
                <th key={h} style={{padding:"10px 14px",color:"white",fontWeight:700,textAlign:"left",fontSize:11}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r,i)=>(
              <tr key={i} style={{background: i % 2 === 0 ? "#FEF2F2" : "white"}}>
                <td style={{padding:"10px 14px",fontWeight:700,color:P.rose}}>{r.barrio}</td>
                <td style={{padding:"10px 14px",fontWeight:600,color:P.teal}}>{r.upl}</td>
                <td style={{padding:"10px 14px",color:P.slate}}>{r.upz}</td>
                <td style={{padding:"10px 14px"}}>
                  <span style={{background:P.rose+"20",color:P.rose,borderRadius:6,padding:"2px 10px",fontWeight:700}}>{r.count}</span>
                </td>
                <td style={{padding:"10px 14px",fontWeight:700,color:P.slate}}>{grandTotal > 0 ? Math.round((r.count/grandTotal)*100) : 0}%</td>
              </tr>
            ))}
            <tr style={{background:P.surface}}>
              <td colSpan={3} style={{padding:"9px 14px",fontWeight:700,color:P.slate}}>TOTAL</td>
              <td style={{padding:"9px 14px"}}>
                <span style={{background:P.primary+"20",color:P.primary,borderRadius:6,padding:"2px 10px",fontWeight:700}}>{grandTotal}</span>
              </td>
              <td style={{padding:"9px 14px",fontWeight:700}}>100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
};

// ─────────────── TABS ────────────────────────────────────────────────────────
const TABS = [
  {id:"resumen",label:"Resumen",icon:"📊"},
  {id:"socio",label:"Módulo 1 · Perfil",icon:"👩"},
  {id:"economia",label:"Módulo 2 · Economía",icon:"💰"},
  {id:"cuidado",label:"Módulo 3 · Cuidado",icon:"💜"},
  {id:"bienestar",label:"Módulo 4 · Bienestar",icon:"🛡️"},
  {id:"suenos",label:"Módulo 5 · Sueños",icon:"🌟"},
  {id:"familiar",label:"Módulo 6 · Bienestar Familiar",icon:"🏠"},
];

export default function AnalyticsDashboard({ surveys }: { surveys: any[] }) {
  const [tab, setTab] = useState("resumen");
  // Filtro principal del dashboard por estado (default 'Aprobada'): todas las
  // visualizaciones y KPIs se recalculan según el estado seleccionado.
  const [estadoFiltro, setEstadoFiltro] = useState<'Aprobada' | 'Pendiente' | 'Todas'>('Aprobada');

  const data = useMemo(() => {
    // 1. Considerar todas las encuestas REGISTRADAS (con respuestas), no solo las
    // aprobadas, para que el tablero refleje lo mismo que el archivo consolidado.
    const registered = surveys.filter(s =>
      s.answers && typeof s.answers === 'object' && Object.keys(s.answers).length > 0
    );
    // Conteos globales por estado (siempre sobre el total registrado).
    const aprobadasCount = registered.filter((s: any) => s.status === 'approved').length;
    const pendientesCount = registered.length - aprobadasCount;
    const registeredCount = registered.length;
    // Conjunto de trabajo según el filtro principal (recalcula KPIs y gráficas).
    const approved = registered.filter((s: any) => {
      if (estadoFiltro === 'Todas') return true;
      if (estadoFiltro === 'Aprobada') return s.status === 'approved';
      return s.status !== 'approved'; // 'Pendiente' (pendiente/borrador)
    });
    const TOTAL = approved.length || 1; // evitar division por cero
    const realTotal = approved.length;

    // Helper to count frequencies
    const countFreq = (extractor: (a: any) => string | string[]) => {
      const counts: Record<string, number> = {};
      approved.forEach(s => {
        if (!s.answers) return;
        const val = extractor(s.answers);
        if (!val) return;
        if (Array.isArray(val)) {
          val.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        } else {
          counts[val] = (counts[val] || 0) + 1;
        }
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    };

    const countFreqWithOrder = (extractor: (a: any) => string, order: string[]) => {
       const counts: Record<string, number> = {};
       approved.forEach(s => {
          if (!s.answers) return;
          const val = extractor(s.answers);
          if (!val) return;
          counts[val] = (counts[val] || 0) + 1;
       });
       return order.map(freq => ({ freq, value: counts[freq] || 0 }));
    };

    // MÓDULO 1
    const barrios = countFreq(a => a.socio?.barrio);
    // UPL robusta: usa la zona registrada (socio.upz) y, si falta, la deriva del
    // barrio con el catálogo oficial, para que el panel siempre conecte la UPL.
    const uplData = countFreq(a => a.socio?.upz || (a.socio?.barrio ? BARRIO_TO_UPL[a.socio.barrio] : ''));
    const generoData = countFreq(a => a.socio?.genero);
    const educData = countFreq(a => a.socio?.nivel_educativo);
    const pertData = countFreq(a => a.socio?.pertenencia);
    
    // Edades
    const edadGruposMap = { "18–30": 0, "31–45": 0, "46–60": 0, "61+": 0, "Sin dato": 0 };
    approved.forEach(s => {
      const edad = s.answers?.socio?.edad;
      if (typeof edad === 'number') {
        if (edad <= 30) edadGruposMap["18–30"]++;
        else if (edad <= 45) edadGruposMap["31–45"]++;
        else if (edad <= 60) edadGruposMap["46–60"]++;
        else edadGruposMap["61+"]++;
      } else {
        edadGruposMap["Sin dato"]++;
      }
    });
    const edadGrupos = Object.entries(edadGruposMap).map(([name, value]) => ({ name, value }));

    // MÓDULO 2
    const fuenteData = countFreq(a => a.economia?.fuente_ingresos);
    const laboralData = countFreq(a => a.economia?.situacion_laboral);
    const viviendaData = countFreq(a => a.economia?.tipo_vivienda);

    const ingresosMap = { "<$100K": 0, "$100–500K": 0, "$500K–$1M": 0, "$1M–$2M": 0, ">$2M": 0 };
    let ingresosTotal = 0;
    let ingresosCount = 0;
    approved.forEach(s => {
      const v = Number(s.answers?.economia?.ingresos);
      if (!isNaN(v)) {
        ingresosTotal += v;
        ingresosCount++;
        if (v < 100000) ingresosMap["<$100K"]++;
        else if (v <= 500000) ingresosMap["$100–500K"]++;
        else if (v <= 1000000) ingresosMap["$500K–$1M"]++;
        else if (v <= 2000000) ingresosMap["$1M–$2M"]++;
        else ingresosMap[">$2M"]++;
      }
    });
    const avgIngresos = ingresosCount > 0 ? ingresosTotal / ingresosCount : 0;
    const ingresosData = Object.entries(ingresosMap).map(([name, value]) => ({ name, value }));

    // MÓDULO 3
    const horasMap = { "1–5h": 0, "6–10h": 0, "11–16h": 0, "17–24h": 0 };
    let totalHoras = 0;
    let cuantasHoras = 0;
    approved.forEach(s => {
      const h = Number(s.answers?.cuidado?.horas);
      if (!isNaN(h) && h > 0) {
        totalHoras += h;
        cuantasHoras++;
        if (h <= 5) horasMap["1–5h"]++;
        else if (h <= 10) horasMap["6–10h"]++;
        else if (h <= 16) horasMap["11–16h"]++;
        else horasMap["17–24h"]++;
      }
    });
    const avgH = cuantasHoras > 0 ? totalHoras / cuantasHoras : 0;
    const horasData = Object.entries(horasMap).map(([name, value]) => ({ name, value }));

    const poblCuidadaData = countFreq(a => a.cuidado?.poblacion);
    const reconocData = countFreq(a => a.cuidado?.reconocimiento);
    const sentimData = countFreq(a => a.cuidado?.sentimiento);
    
    const agotFreq = countFreqWithOrder(a => a.cuidado?.agotamiento_emocional, FREQ_SCALE);
    const cansFreq = countFreqWithOrder(a => a.cuidado?.cansancio_fisico, FREQ_SCALE);
    const estresFreq = countFreqWithOrder(a => a.cuidado?.estres_constante, FREQ_SCALE);
    const autocuidFreq = countFreqWithOrder(a => a.cuidado?.poco_tiempo_autocuidado, FREQ_SCALE);
    const respExcFreq = countFreqWithOrder(a => a.cuidado?.responsabilidades_excesivas, FREQ_SCALE);
    const conoceProg = countFreq(a => a.cuidado?.conoce_programas);

    // Radar score calculation
    const calcScore = (extractor: (a: any) => string) => {
       let sum = 0; let count = 0;
       approved.forEach(s => {
         const val = extractor(s.answers);
         if (val && FREQ_MAP[val]) { sum += FREQ_MAP[val]; count++; }
       });
       return count > 0 ? sum / count : 0;
    };
    
    const calcCargaEmocional = () => {
       let sum = 0; let count = 0;
       approved.forEach(s => {
         const val = Number(s.answers?.cuidado?.carga_emocional);
         if (!isNaN(val) && val > 0) { sum += val; count++; }
       });
       return count > 0 ? sum / count : 0;
    };

    const radarCarga = [
      {item:"Cansancio Físico", score: calcScore(a => a.cuidado?.cansancio_fisico)},
      {item:"Estrés Constante", score: calcScore(a => a.cuidado?.estres_constante)},
      {item:"Poco Autocuidado", score: calcScore(a => a.cuidado?.poco_tiempo_autocuidado)},
      {item:"Resp. Excesivas", score: calcScore(a => a.cuidado?.responsabilidades_excesivas)},
      {item:"Carga Emocional", score: calcCargaEmocional()},
    ];
    const radarCargaVisible = radarCarga.filter(item => !item.item.startsWith("Cansancio"));

    // MÓDULO 4
    const violenciaData = countFreq(a => a.bienestar?.violencia);
    const factoresRiesgoData = countFreq(a => a.bienestar?.factores_riesgo);
    const enfermedadData = countFreq(a => a.bienestar?.enfermedad_diagnosticada);
    const enfermedadesCuales = countFreq(a => a.bienestar?.enfermedades_cuales);
    const dificultadData = countFreq(a => a.bienestar?.dificultad);
    const participarData = countFreq(a => a.bienestar?.participar);
    const apoioFamFreq = countFreqWithOrder(a => a.bienestar?.poco_apoyo_familiar, FREQ_SCALE);
    const suenoFreq = countFreqWithOrder(a => a.bienestar?.afectacion_sueño, FREQ_SCALE);
    const vidaSocialFreq = countFreqWithOrder(a => a.bienestar?.afectacion_vida_social, FREQ_SCALE);
    const segHogarData = countFreq(a => a.bienestar?.seguridad_hogar);
    const tiempoCuidData = countFreqWithOrder(a => a.bienestar?.tiempo_cuidado_mayor_parte, FREQ_SCALE);

    const barrioInseg = countFreq(a => a.bienestar?.barrio_inseguro);
    const uplInseg = countFreq(a => a.bienestar?.upl_inseguro);

    const inseguridadCruzadaMap: Record<string, {barrio: string, upl: string, upz: string, count: number}> = {};
    approved.forEach(s => {
       const b = s.answers?.bienestar?.barrio_inseguro;
       const u = s.answers?.bienestar?.upl_inseguro || s.answers?.socio?.upz;
       const upz = s.answers?.socio?.upz;
       if (b) {
         const key = `${b}-${u}-${upz}`;
         if (!inseguridadCruzadaMap[key]) {
           inseguridadCruzadaMap[key] = { barrio: b, upl: String(u), upz: String(upz), count: 0 };
         }
         inseguridadCruzadaMap[key].count++;
       }
    });
    const inseguridadCruzada = Object.values(inseguridadCruzadaMap).sort((a,b) => b.count - a.count);

    // MÓDULO 5
    const prioridadesData = countFreq(a => a.proyecciones?.prioridad);
    const formacionData = countFreq(a => a.proyecciones?.interes_formacion);
    const proyectosData = countFreq(a => a.proyecciones?.proyectos_ideales);
    const bienestarDeseadoData = countFreq(a => a.proyecciones?.bienestar_deseado);
    const apoyoData = countFreq(a => a.proyecciones?.desea_mas_apoyo);

    // MÓDULO 6 · Bienestar Familiar (dinámica familiar)
    const estructuraData = countFreq(a => a.dinamica_familiar?.estructura);
    const personasHogarData = countFreq(a => {
      const v = a.dinamica_familiar?.personas_hogar;
      return v === undefined || v === null || v === '' ? '' : String(parseInt(String(v), 10));
    });
    const relacionesData = countFreq(a => a.dinamica_familiar?.relaciones);
    const compartirHabilidadesData = countFreq(a => a.dinamica_familiar?.compartir_habilidades);
    const apoyoEmergenciaData = countFreq(a => a.dinamica_familiar?.apoyo_emergencia);
    const participacionSocialData = countFreq(a => a.dinamica_familiar?.participacion_social);
    const sinApoyoEmergencia = approved.filter(s => {
      const v = s.answers?.dinamica_familiar?.apoyo_emergencia;
      return Array.isArray(v) ? v.includes('Nadie') : v === 'Nadie';
    }).length;

    // Custom calculations for the KPI cards
    const estresFrecuente = approved.filter(s => {
       const a = s.answers?.cuidado?.estres_constante;
       return a === 'Casi siempre' || a === 'Siempre';
    }).length;

    const enfDiagnostico = approved.filter(s => s.answers?.bienestar?.enfermedad_diagnosticada === 'Sí').length;
    const sinRecon = approved.filter(s => s.answers?.cuidado?.reconocimiento === 'Nada reconocida').length;

    return {
       TOTAL: realTotal,
       aprobadasCount,
       pendientesCount,
       registeredCount,
       avgH,
       avgIngresos,
       barrios, uplData, generoData, educData, pertData, edadGrupos,
       fuenteData, laboralData, viviendaData, ingresosData,
       horasData, poblCuidadaData, reconocData, sentimData,
       agotFreq, cansFreq, estresFreq, autocuidFreq, respExcFreq, conoceProg, radarCarga: radarCargaVisible,
       violenciaData, factoresRiesgoData, enfermedadData, enfermedadesCuales, dificultadData, participarData,
       apoioFamFreq, suenoFreq, vidaSocialFreq, segHogarData, tiempoCuidData,
       barrioInseg, uplInseg, inseguridadCruzada,
       prioridadesData, formacionData, proyectosData, bienestarDeseadoData, apoyoData,
       estructuraData, personasHogarData, relacionesData, compartirHabilidadesData, apoyoEmergenciaData, participacionSocialData, sinApoyoEmergencia,
       kpis: {
          estresPct: realTotal > 0 ? Math.round((estresFrecuente / realTotal) * 100) : 0,
          enfPct: realTotal > 0 ? Math.round((enfDiagnostico / realTotal) * 100) : 0,
          sinReconPct: realTotal > 0 ? Math.round((sinRecon / realTotal) * 100) : 0,
       }
    };
  }, [surveys, estadoFiltro]);

  const { TOTAL, avgH, avgIngresos, kpis, aprobadasCount, pendientesCount, registeredCount } = data;

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:P.surface,minHeight:"100vh",color:P.slate}}>
      {/* HEADER */}
      <div style={{background:`linear-gradient(135deg,${P.primary} 0%,#4C1D95 50%,#1E1B4B 100%)`,padding:"26px 30px 22px",position:"relative",overflow:"hidden", borderRadius: '0 0 1.5rem 1.5rem'}}>
        <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}>
            <div style={{background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"5px 13px",fontSize:11.5,fontWeight:700,color:"#E9D5FF",letterSpacing:1}}>
              ALCALDÍA LOCAL DE BARRIOS UNIDOS · 2025–2026
            </div>
          </div>
          <h1 style={{margin:0,fontSize:24,fontWeight:900,color:"white",lineHeight:1.2}}>Diagnóstico de Necesidades</h1>
          <h2 style={{margin:"3px 0 0",fontSize:15,fontWeight:400,color:"#C4B5FD"}}>Mujeres Cuidadoras — Localidad Barrios Unidos · Bogotá D.C.</h2>
          <div style={{display:"flex",gap:20,marginTop:14,flexWrap:"wrap",alignItems:"center"}}>
            {[["👩‍👧", registeredCount.toString(), "Registradas"],["✅",aprobadasCount.toString(),"Aprobadas"],["⏳",pendientesCount.toString(),"Pendientes / borrador"],["📋","6","Módulos diagnósticos"]].map(([icon,val,label])=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{fontSize:15}}>{icon}</span>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"white"}}>{val}</div>
                  <div style={{fontSize:10.5,color:"#C4B5FD"}}>{label}</div>
                </div>
              </div>
            ))}
            {/* Filtro principal por estado: recalcula todo el panel. */}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:10.5,color:"#C4B5FD",fontWeight:700}}>Filtro estado</span>
              <div style={{display:"flex",background:"rgba(255,255,255,0.12)",borderRadius:10,padding:3}}>
                {(['Aprobada','Pendiente','Todas'] as const).map(op=>(
                  <button key={op} onClick={()=>setEstadoFiltro(op)} style={{border:"none",cursor:"pointer",fontSize:11,fontWeight:800,padding:"6px 12px",borderRadius:8,background:estadoFiltro===op?"white":"transparent",color:estadoFiltro===op?P.primary:"#E9D5FF",transition:"all .2s"}}>{op}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAV */}
      <div style={{background:"white",borderBottom:`2px solid ${P.muted}`,padding:"0 22px",display:"flex",gap:0,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"13px 16px",border:"none",background:"none",cursor:"pointer",fontSize:12.5,fontWeight:tab===t.id?700:500,color:tab===t.id?P.primary:"#64748B",borderBottom:tab===t.id?`3px solid ${P.primary}`:"3px solid transparent",whiteSpace:"nowrap",transition:"all .2s",display:"flex",alignItems:"center",gap:5}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{padding:"26px 26px 40px",maxWidth:1300,margin:"0 auto"}}>

        {/* RESUMEN */}
        {tab==="resumen" && (
          <div>
            <SecTitle icon="📊" module="Vista General" title="Panel de Indicadores Clave" subtitle={`Síntesis del diagnóstico — n=${TOTAL} · filtro: ${estadoFiltro} (registradas: ${registeredCount} · ${aprobadasCount} aprobadas · ${pendientesCount} pendientes)`}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:26}}>
              <KPICard icon="👩‍👧" label="Cuidadoras (filtro)" value={TOTAL} sub={`Estado: ${estadoFiltro}`} color={P.primary}/>
              <KPICard icon="⏱️" label="Prom. Horas/Día" value={avgH.toFixed(1)+"h"} sub="Máx: 24h diarias" color={P.secondary}/>
              <KPICard icon="💸" label="Ingreso Promedio" value={"$" + (avgIngresos/1000).toFixed(0) + "K"} sub="Estimación mensual" color={P.accent}/>
              <KPICard icon="😔" label="Estrés Frecuente" value={`${kpis.estresPct}%`} sub="Casi siempre o siempre" color={P.rose}/>
              <KPICard icon="🏥" label="Enf. Diagnosticada" value={`${kpis.enfPct}%`} sub="Condición confirmada" color={P.teal}/>
              <KPICard icon="🔕" label="Sin Reconocimiento" value={`${kpis.sinReconPct}%`} sub="Nada reconocidas" color="#7C3AED"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <SmallPie data={data.uplData} title="Distribución por UPL" total={TOTAL}/>
              <Card title="Radar de Carga de Cuidado (escala 1–5)">
                <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height={210}>
                  <RadarChart data={data.radarCarga}>
                    <PolarGrid stroke={P.muted}/>
                    <PolarAngleAxis dataKey="item" tick={{fontSize:10,fill:P.slate}}/>
                    <PolarRadiusAxis angle={30} domain={[0,5]} tick={{fontSize:9}} tickCount={4}/>
                    <Radar name="Prom." dataKey="score" stroke={P.primary} fill={P.primary} fillOpacity={0.3} strokeWidth={2}/>
                    <Legend/>
                    <Tooltip formatter={(v: number)=>[v.toFixed(2)+" / 5"]}/>
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:6}}>
              <Insight emoji="⚠️" highlight="Estrés constante" text="es un patrón frecuente derivado de la labor continua de cuidado."/>
              <Insight emoji="💼" highlight="Ingresos vulnerables." text="Gran parte del grupo no cuenta con ingresos que superen un salario mínimo."/>
              <Insight emoji="🚨" highlight="Percepción de inseguridad" text="territorial afecta a cuidadoras que deben transitar zonas de riesgo." color={P.rose}/>
              <Insight emoji="📍" highlight="Las distribuciones por UPZ" text="revelan la necesidad de focalización de servicios en sectores clave."/>
              <Insight emoji="⚡" highlight="Violencias reportadas." text="La vulneración económica y psicológica son recurrentes."/>
              <Insight emoji="🌟" highlight="Altos deseos de superación." text="Existe voluntad participativa e interés formativo evidente."/>
            </div>
          </div>
        )}

        {/* MÓDULO 1 */}
        {tab==="socio" && (
          <div>
            <SecTitle icon="👩" module="Módulo 1" title="Perfil Sociodemográfico" subtitle="Características poblacionales, territoriales e identitarias de las mujeres cuidadoras"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:13,marginBottom:22}}>
              <KPICard icon="📍" label="Barrios Representados" value={data.barrios.length} sub="En la localidad" color={P.primary}/>
              <KPICard icon="🎂" label="Rango predominante" value={data.edadGrupos.reduce((a,b)=>a.value>b.value?a:b, {name:'', value:-1}).name} sub="Edad reportada" color={P.secondary}/>
              <KPICard icon="♀️" label="Diversidad" value={data.generoData.length} sub="Identidades de género" color={P.rose}/>
              <KPICard icon="📚" label="Grupos Étnicos" value={data.pertData.length} sub="Condiciones poblacionales" color={P.teal}/>
            </div>

            {/* MAPA */}
            <div style={{marginBottom:18}}><MapaBarriosUnidos uplData={data.uplData} /></div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <HBar data={data.barrios} title="Distribución por Barrio" total={TOTAL}/>
              <SmallPie data={data.uplData} title="Distribución por UPL" total={TOTAL}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:18,marginBottom:18}}>
              <SmallPie data={data.generoData} title="Género" total={TOTAL}/>
              <SmallPie data={data.educData} title="Nivel Educativo" total={TOTAL}/>
              <HBar data={data.pertData} title="Grupo Étnico / Pertenencia" note="Multi-selección" total={TOTAL}/>
            </div>
            <Card title="Grupos Etarios">
              <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height={130}>
                <BarChart data={data.edadGrupos} margin={{left:0,right:8,top:2,bottom:2}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9"/>
                  <XAxis dataKey="name" tick={{fontSize:10.5}} tickLine={false} axisLine={false}/>
                  <YAxis tick={{fontSize:10}} tickLine={false} axisLine={false} width={18}/>
                  <Tooltip formatter={(v: number)=>[`${v} cuidadoras`]}/>
                  <Bar dataKey="value" radius={[6,6,0,0]} maxBarSize={38}>
                    {data.edadGrupos.map((_,i)=><Cell key={i} fill={BAR[i]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* MÓDULO 2 */}
        {tab==="economia" && (
          <div>
            <SecTitle icon="💰" module="Módulo 2" title="Economía y Autonomía" subtitle="Situación laboral, fuentes de ingreso, ingresos mensuales y condiciones de vivienda"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:13,marginBottom:22}}>
              <KPICard icon="💵" label="Ingreso Promedio" value={"$" + (avgIngresos/1000).toFixed(0) + "K"} sub="COP mensual" color={P.primary}/>
              <KPICard icon="📉" label="Casos < $100K" value={data.ingresosData.find(d => d.name === "<$100K")?.value || 0} sub="Extrema vulnerabilidad" color={P.rose}/>
              <KPICard icon="🏠" label="Tipos Vivienda" value={data.viviendaData.length} sub="Diversidad habitacional" color={P.secondary}/>
              <KPICard icon="🔍" label="Situaciones Lab." value={data.laboralData.length} sub="Modalidades ocupacionales" color={P.accent}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <HBar data={data.fuenteData} title="Fuente de Ingresos" total={TOTAL}/>
              <HBar data={data.laboralData} title="Situación Laboral" total={TOTAL}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <Card title="Rangos de Ingresos Mensuales (COP)">
                <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height={170}>
                  <BarChart data={data.ingresosData} margin={{left:0,right:8,top:2,bottom:2}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9"/>
                    <XAxis dataKey="name" tick={{fontSize:10.5}} tickLine={false} axisLine={false}/>
                    <YAxis tick={{fontSize:10}} tickLine={false} axisLine={false} width={18}/>
                    <Tooltip formatter={(v: number)=>[`${v} cuidadoras`]}/>
                    <Bar dataKey="value" radius={[6,6,0,0]} maxBarSize={36}>
                      {data.ingresosData.map((_,i)=><Cell key={i} fill={[P.rose,"#F97316",P.accent,P.teal,P.primary][i]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <SmallPie data={data.viviendaData} title="Tipo de Vivienda" total={TOTAL}/>
            </div>
          </div>
        )}

        {/* MÓDULO 3 */}
        {tab==="cuidado" && (
          <div>
            <SecTitle icon="💜" module="Módulo 3" title="Carga de Cuidado" subtitle="Horas, bienestar emocional y acceso a programas"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:13,marginBottom:22}}>
              <KPICard icon="⏱️" label="Prom. Horas/Día" value={avgH.toFixed(1)+"h"} sub="Carga de trabajo no remunerado" color={P.primary}/>
              <KPICard icon="😰" label="Agotadas emocionalmente" value={`${kpis.estresPct}%`} sub="Casi siempre o siempre" color={P.rose}/>
              <KPICard icon="🔕" label="Sin reconocimiento" value={`${kpis.sinReconPct}%`} sub="Nada reconocidas" color={P.secondary}/>
              <KPICard icon="📋" label="Conoce programas" value={data.conoceProg.find(d => d.name === "Sí")?.value || 0} sub="Cuidadoras informadas" color={P.teal}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <Card title="Radar de Indicadores de Carga (escala 1–5)">
                <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height={240}>
                  <RadarChart data={data.radarCarga}>
                    <PolarGrid stroke={P.muted}/>
                    <PolarAngleAxis dataKey="item" tick={{fontSize:10.5,fill:P.slate}}/>
                    <PolarRadiusAxis angle={30} domain={[0,5]} tick={{fontSize:9}} tickCount={4}/>
                    <Radar name="Prom. grupo" dataKey="score" stroke={P.primary} fill={P.primary} fillOpacity={0.35} strokeWidth={2}/>
                    <Legend/>
                    <Tooltip formatter={(v: number)=>[v.toFixed(2)+" / 5"]}/>
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
              <div style={{display:"grid",gridTemplateRows:"1fr 1fr",gap:16}}>
                <HBar data={data.horasData} title="Horas Diarias Dedicadas al Cuidado" total={TOTAL}/>
                <SmallPie data={data.conoceProg} title="¿Conoce Programas de Apoyo?" total={TOTAL}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
              <FreqBar data={data.agotFreq} title="Agotamiento Emocional" color={P.rose}/>
              <FreqBar data={data.cansFreq} title="Cansancio Físico" color="#F97316"/>
              <FreqBar data={data.estresFreq} title="Estrés Constante" color={P.primary}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
              <FreqBar data={data.autocuidFreq} title="Poco Tiempo Autocuidado" color={P.secondary}/>
              <FreqBar data={data.respExcFreq} title="Responsabilidades Excesivas" color={P.teal}/>
              <HBar data={data.poblCuidadaData} title="Población Cuidada" total={TOTAL}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <SmallPie data={data.reconocData} title="Nivel de Reconocimiento" total={TOTAL}/>
              <HBar data={data.sentimData} title="Sentimiento Predominante" total={TOTAL}/>
            </div>
          </div>
        )}

        {/* MÓDULO 4 */}
        {tab==="bienestar" && (
          <div>
            <SecTitle icon="🛡️" module="Módulo 4" title="Bienestar y Seguridad" subtitle="Salud, violencias, inseguridad territorial, riesgos y participación comunitaria"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:13,marginBottom:22}}>
              <KPICard icon="🩺" label="Enf. Diagnosticada" value={`${kpis.enfPct}%`} sub="Labor de cuidado afectada" color={P.rose}/>
              <KPICard icon="😴" label="Problemas de sueño" value={data.suenoFreq.find(d => d.freq === 'Casi siempre' || d.freq === 'Siempre')?.value || 0} sub="Reportes recurrentes" color={P.secondary}/>
              <KPICard icon="⚡" label="Tipos Violencia" value={data.violenciaData.length} sub="Vulneraciones identificadas" color={P.primary}/>
              <KPICard icon="✅" label="Desean Participar" value={data.participarData.find(d => d.name === "Sí")?.value || 0} sub="En programas" color={P.teal}/>
            </div>

            {/* INSEGURIDAD TERRITORIAL */}
            <div style={{marginBottom:18}}><TablaInseguridad data={data.inseguridadCruzada} total={TOTAL} /></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <HBar data={data.barrioInseg} title="🚨 Barrios Percibidos como Inseguros" note="Cuidadoras que viven o transitan en estos sectores" total={TOTAL}/>
              <HBar data={data.uplInseg} title="🗺️ UPL con Percepción de Inseguridad" note="Unidad de Planeación Local asignada" total={TOTAL}/>
            </div>

            {/* VIOLENCIA — multi-select */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <HBar data={data.violenciaData} title="Tipos de Violencia Experimentada" note="Multi-selección" total={TOTAL}/>
              <HBar data={data.factoresRiesgoData} title="Factores de Riesgo Identificados" note="Multi-selección" total={TOTAL}/>
            </div>

            {/* SALUD */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
              <SmallPie data={data.enfermedadData} title="¿Tiene Enfermedad Diagnosticada?" total={TOTAL}/>
              <HBar data={data.enfermedadesCuales} title="Tipo de Enfermedad Reportada" total={TOTAL}/>
              <SmallPie data={data.participarData} title="¿Desea Participar en Programas?" total={TOTAL}/>
            </div>

            {/* FRECUENCIAS */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
              <FreqBar data={data.suenoFreq} title="Afectación del Sueño" color={P.secondary}/>
              <FreqBar data={data.vidaSocialFreq} title="Afectación Vida Social" color={P.teal}/>
              <FreqBar data={data.apoioFamFreq} title="Poco Apoyo Familiar" color={P.rose}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <FreqBar data={data.tiempoCuidData} title="Tiempo Cuidado Ocupa Mayor Parte del Día" color="#7C3AED"/>
              <SmallPie data={data.segHogarData} title="Seguridad en el Hogar" total={TOTAL}/>
            </div>
            <HBar data={data.dificultadData} title="Barreras para la Participación Comunitaria" total={TOTAL}/>
          </div>
        )}

        {/* MÓDULO 5 */}
        {tab==="suenos" && (
          <div>
            <SecTitle icon="🌟" module="Módulo 5" title="Sueños y Proyecciones" subtitle="Aspiraciones, prioridades vitales, intereses de formación y proyectos deseados"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:13,marginBottom:22}}>
              <KPICard icon="🥇" label="Principales Prior." value={data.prioridadesData.length} sub="Intereses variados" color={P.primary}/>
              <KPICard icon="🩺" label="Menciones Salud" value={data.prioridadesData.find(d => d.name === "Salud")?.value || 0} sub="Como prioridad" color={P.rose}/>
              <KPICard icon="🎓" label="Áreas de interés" value={data.formacionData.length} sub="Deseo de aprender" color={P.teal}/>
              <KPICard icon="🤝" label="Desean más apoyo" value={data.apoyoData.find(d => d.name === "Sí")?.value || 0} sub="Respuesta afirmativa" color={P.secondary}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <SmallPie data={data.prioridadesData} title="Prioridades de Vida" total={TOTAL}/>
              <HBar data={data.formacionData} title="Interés en Formación / Capacitación" total={TOTAL}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <HBar data={data.proyectosData} title="Proyectos Ideales — Multi-selección" note="Multi-selección" total={TOTAL}/>
              <HBar data={data.bienestarDeseadoData} title="Actividades de Bienestar Deseadas" note="Multi-selección" total={TOTAL}/>
            </div>
            <SmallPie data={data.apoyoData} title="¿Desea Más Apoyo Institucional?" total={TOTAL}/>
          </div>
        )}

        {/* MÓDULO 6 · BIENESTAR FAMILIAR */}
        {tab==="familiar" && (
          <div>
            <SecTitle icon="🏠" module="Módulo 6" title="Bienestar Familiar" subtitle="Estructura del hogar, convivencia, redes de apoyo y participación social"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:13,marginBottom:22}}>
              <KPICard icon="🏠" label="Tipos de Estructura" value={data.estructuraData.length} sub="Conformación del hogar" color={P.primary}/>
              <KPICard icon="🤝" label="Comparten Habilidades" value={data.compartirHabilidadesData.find(d => d.name === "Sí")?.value || 0} sub="Disposición a aportar" color={P.teal}/>
              <KPICard icon="🚨" label="Sin Apoyo en Emergencia" value={data.sinApoyoEmergencia} sub="Responde 'Nadie'" color={P.rose}/>
              <KPICard icon="👥" label="Participación Social" value={data.participacionSocialData.find(d => d.name === "Sí, frecuentemente")?.value || 0} sub="Participa frecuentemente" color={P.secondary}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <HBar data={data.estructuraData} title="Estructura Familiar" total={TOTAL}/>
              <SmallPie data={data.relacionesData} title="Relaciones en el Hogar" total={TOTAL}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <HBar data={data.apoyoEmergenciaData} title="Apoyo en Emergencias" note="Multi-selección" total={TOTAL}/>
              <HBar data={data.personasHogarData} title="Personas en el Hogar" total={TOTAL}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              <SmallPie data={data.compartirHabilidadesData} title="¿Comparte Habilidades?" total={TOTAL}/>
              <SmallPie data={data.participacionSocialData} title="Participación Social" total={TOTAL}/>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{marginTop:32,borderTop:`1px solid ${P.muted}`,paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:10.5,color:"#94A3B8"}}>Diagnóstico en Vivo — Alcaldía Local de Barrios Unidos</div>
          <div style={{fontSize:10.5,color:P.primary,fontWeight:700}}>n={TOTAL} | Filtro: {estadoFiltro} | Registradas: {registeredCount} ({aprobadasCount} aprobadas · {pendientesCount} pendientes) | Fuente: UNIDAS Database</div>
        </div>
      </div>
    </div>
  );
}

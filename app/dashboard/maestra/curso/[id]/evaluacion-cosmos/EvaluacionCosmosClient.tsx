"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Search,
  Save,
  X,
  BookOpen,
  Heart,
  Leaf,
  Lightbulb,
  User,
  AlertTriangle,
  Loader2,
  ChevronRight,
} from "lucide-react";

type CampoId = "cosmos" | "comunidad" | "vida" | "tecnologia";

const MAPA_CAMPOS: Record<CampoId, number> = {
  cosmos: 1,
  comunidad: 2,
  vida: 3,
  tecnologia: 4,
};

interface Alumno {
  id: string;
  nombre: string;
  apellido: string;
  foto_url?: string;
}

interface IndicadorBD {
  id: string;
  campo_id: number;
  tematica: string;
  dimension: "ser" | "saber" | "hacer" | "decidir";
  criterio: string;
}

interface EvaluacionCosmosClientProps {
  cursoId: string;
  cursoNombre: string;
  colegioId: string;
  maestraId: string;
  alumnos: Alumno[];
  contenidosPDF: IndicadorBD[];
  evaluacionesExistentes: any[];
  gestion: number;
}

export default function EvaluacionCosmosClient({
  cursoId,
  cursoNombre,
  maestraId,
  alumnos = [],
  contenidosPDF = [],
  gestion,
}: EvaluacionCosmosClientProps) {
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<Alumno | null>(
    null,
  );
  const [campoActivo, setCampoActivo] = useState<CampoId>("cosmos");

  // Selectores de tiempo pedagógico
  const [trimestre, setTrimestre] = useState<number>(1);
  const [semana, setSemana] = useState<number>(1);

  const [notasDinamicas, setNotasDinamicas] = useState<Record<string, number>>(
    {},
  );
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  // 1. Filtro de búsqueda de alumnos
  const alumnosFiltrados = useMemo(() => {
    const lista = alumnos || [];
    const textoBusqueda = (search || "").toLowerCase().trim();

    return lista.filter((a) => {
      const nombreCompleto =
        `${a?.nombre || ""} ${a?.apellido || ""}`.toLowerCase();
      return nombreCompleto.includes(textoBusqueda);
    });
  }, [search, alumnos]);

  const camposNavbar = [
    { id: "cosmos", label: "Cosmos", icon: BookOpen, color: "text-orange-500" },
    {
      id: "comunidad",
      label: "Comunidad",
      icon: Heart,
      color: "text-violet-500",
    },
    { id: "vida", label: "Vida", icon: Leaf, color: "text-emerald-500" },
    {
      id: "tecnologia",
      label: "Tecnología",
      icon: Lightbulb,
      color: "text-sky-500",
    },
  ];

  // 2. Motor de agrupación por temáticas
  const estructuraCurricularDelCampo = useMemo(() => {
    const idCampoNumerico = MAPA_CAMPOS[campoActivo] || 1;
    const indicadoresDelCampo = (contenidosPDF || []).filter(
      (item) => item && item.campo_id === idCampoNumerico,
    );

    const agrupado: Record<
      string,
      {
        ser: IndicadorBD[];
        saber: IndicadorBD[];
        hacer: IndicadorBD[];
        decidir: IndicadorBD[];
      }
    > = {};

    indicadoresDelCampo.forEach((ind) => {
      if (!ind) return;
      const tema = ind.tematica || "Contenido General";
      const dimLimpia = String(ind.dimension || "saber")
        .toLowerCase()
        .trim();

      if (!agrupado[tema]) {
        agrupado[tema] = { ser: [], saber: [], hacer: [], decidir: [] };
      }

      if (
        dimLimpia === "ser" ||
        dimLimpia === "saber" ||
        dimLimpia === "hacer" ||
        dimLimpia === "decidir"
      ) {
        agrupado[tema][dimLimpia].push(ind);
      } else {
        agrupado[tema]["saber"].push(ind);
      }
    });

    return agrupado;
  }, [campoActivo, contenidosPDF]);

  // 3. Métricas acumulativas corregidas
  // 3. Métricas acumulativas corregidas a la escala real de 85 puntos
  const metricasFinales = useMemo(() => {
    const idCampoNumerico = MAPA_CAMPOS[campoActivo] || 1;
    const indicadoresActuales = (contenidosPDF || []).filter(
      (item) => item && item.campo_id === idCampoNumerico,
    );

    let sumaSer = 0,
      countSer = 0;
    let sumaSaber = 0,
      countSaber = 0;
    let sumaHacer = 0,
      countHacer = 0;

    indicadoresActuales.forEach((ind) => {
      if (!ind) return;
      const notaVal = notasDinamicas[ind.id] || 0;
      const dim = String(ind.dimension || "saber")
        .toLowerCase()
        .trim();

      if (dim === "ser") {
        sumaSer += notaVal;
        countSer++;
      }
      if (dim === "saber") {
        sumaSaber += notaVal;
        countSaber++;
      }
      if (dim === "hacer") {
        sumaHacer += notaVal;
        countHacer++;
      }
    });

    const totalSer = countSer > 0 ? Math.round(sumaSer / countSer) : 0;
    const totalSaber = countSaber > 0 ? Math.round(sumaSaber / countSaber) : 0;
    const totalHacer = countHacer > 0 ? Math.round(sumaHacer / countHacer) : 0;

    // Suma real sobre 85 puntos máximos por campo
    const notaFinal = totalSer + totalSaber + totalHacer;

    let escala = {
      label: "Sin evaluar",
      color: "text-gray-400 bg-gray-50 border-gray-100",
    };
    if (notaFinal > 0) {
      if (notaFinal <= 42)
        escala = {
          label: "En Desarrollo (ED)",
          color: "text-red-600 bg-red-50 border-red-100",
        };
      else if (notaFinal <= 58)
        escala = {
          label: "Desarrollo Aceptable (DA)",
          color: "text-amber-600 bg-amber-50 border-amber-100",
        };
      else if (notaFinal <= 72)
        escala = {
          label: "Desarrollo Óptimo (DO)",
          color: "text-indigo-600 bg-indigo-50 border-indigo-100",
        };
      else
        escala = {
          label: "Desarrollo Pleno (DP)",
          color: "text-emerald-600 bg-emerald-50 border-emerald-100",
        };
    }

    return { totalSer, totalSaber, totalHacer, notaFinal, escala };
  }, [campoActivo, contenidosPDF, notasDinamicas]);

  // 🚀 FUNCIÓN DE GUARDADO ULTRA PURGADA (SIN LA COLUMNA NOTA_DECIDIR QUE VIOLA EL CHECK)
  const handleGuardarEvaluacion = async () => {
    if (!alumnoSeleccionado) return;
    setGuardando(true);
    setMensajeEstado(null);

    const idContenidoValido = MAPA_CAMPOS[campoActivo] || 1;

    try {
      const { error } = await supabase.from("evaluaciones_semanales").upsert(
        {
          alumno_id: alumnoSeleccionado.id,
          curso_id: cursoId,
          maestra_id: maestraId,
          colegio_id: "a42cef58-9fec-4dcb-b469-f33630d878e8",
          contenido_id: idContenidoValido,
          semana_evaluada: semana,
          trimestre: trimestre,
          gestion: gestion,

          // Enviamos solo lo que calcula tu interfaz:
          nota_ser: metricasFinales.totalSer,
          nota_saber: metricasFinales.totalSaber,
          nota_hacer: metricasFinales.totalHacer,

          // ❌ ELIMINADA 'nota_decidir' PARA QUE NO SALTE EL CHECK CONSTRAINT "evaluaciones_semanales_nota_decidir_check"

          observacion: observacion.trim(),
        },
        {
          onConflict: "alumno_id,semana_evaluada,contenido_id",
        },
      );

      if (error) throw error;

      setMensajeEstado({
        tipo: "exito",
        texto: `Evaluación de la Semana ${semana} guardada correctamente.`,
      });
      setObservacion("");
    } catch (err: any) {
      console.error(err);
      setMensajeEstado({
        tipo: "error",
        texto: "No se pudo guardar el registro semanal en la base de datos.",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 pb-6 w-full text-xs font-sans">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/dashboard/maestra/curso/${cursoId}`}
              className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center shrink-0 transition-all"
            >
              <ArrowLeft size={16} className="text-gray-600" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                Evaluación Curricular Integrada
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                {cursoNombre}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-xl shrink-0 font-mono">
            Gestión {gestion}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: LISTA DE ALUMNOS */}
        <div className="space-y-3 w-full">
          <div className="relative w-full">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              type="text"
              placeholder="Buscar estudiante..."
              className="w-full bg-white border border-gray-100 rounded-xl pl-9 pr-4 py-2 text-xs font-bold shadow-xs outline-none focus:ring-1 focus:ring-orange-400 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs w-full">
            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Estudiantes ({alumnosFiltrados.length})
              </span>
            </div>

            <div className="divide-y divide-gray-50 max-h-[calc(100vh-220px)] overflow-y-auto">
              {alumnosFiltrados.map((alumno) => {
                const esActivo = alumnoSeleccionado?.id === alumno.id;
                return (
                  <button
                    key={alumno.id}
                    onClick={() => {
                      setAlumnoSeleccionado(alumno);
                      setNotasDinamicas({});
                      setMensajeEstado(null);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-all text-left group ${
                      esActivo
                        ? "bg-orange-50/40 border-r-2 border-orange-500"
                        : "hover:bg-gray-50/70"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center font-black text-xs shrink-0">
                        {alumno.nombre ? alumno.nombre[0] : "U"}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-black truncate ${esActivo ? "text-orange-600" : "text-gray-800"}`}
                        >
                          {alumno.nombre} {alumno.apellido}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-gray-300 group-hover:text-orange-400"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIO PEDAGÓGICO */}
        <div
          className={`w-full lg:col-span-2 ${alumnoSeleccionado ? "fixed inset-0 z-50 p-4 flex items-center justify-center lg:relative lg:inset-auto lg:p-0 lg:z-0 lg:block" : "hidden lg:block"}`}
        >
          {alumnoSeleccionado && (
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs lg:hidden"
              onClick={() => setAlumnoSeleccionado(null)}
            />
          )}

          {alumnoSeleccionado ? (
            <div className="relative bg-white w-full border border-gray-100 lg:rounded-2xl rounded-xl shadow-2xl lg:shadow-xs flex flex-col max-h-[85vh] lg:max-h-none overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                    {alumnoSeleccionado.nombre
                      ? alumnoSeleccionado.nombre[0]
                      : "U"}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-black text-gray-900 leading-tight truncate">
                      {alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setAlumnoSeleccionado(null)}
                  className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 lg:hidden"
                >
                  <X size={14} />
                </button>
              </div>

              {/* NAV TAB DE CAMPOS */}
              <div className="flex px-2 py-1 bg-gray-50/50 border-b border-gray-100 overflow-x-auto">
                {camposNavbar.map((campo) => {
                  const Icon = campo.icon;
                  const activo = campoActivo === campo.id;
                  return (
                    <button
                      key={campo.id}
                      onClick={() => setCampoActivo(campo.id as CampoId)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[75px] transition-all rounded-xl ${
                        activo
                          ? "bg-white shadow-xs border border-gray-100"
                          : "opacity-40"
                      }`}
                    >
                      <Icon
                        size={15}
                        className={activo ? campo.color : "text-gray-400"}
                      />
                      <span
                        className={`text-[9px] font-black uppercase tracking-tighter ${activo ? "text-gray-900" : "text-gray-400"}`}
                      >
                        {campo.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* PANEL DE CONTROL DE TIEMPO (TRIMESTRE Y SEMANA) */}
              <div className="px-4 py-3 bg-gray-50/40 border-b border-gray-100 grid grid-cols-2 gap-4 shrink-0">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                    Trimestre Escolar
                  </label>
                  <select
                    value={trimestre}
                    onChange={(e) => setTrimestre(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg py-1 px-2 font-bold text-xs shadow-xs outline-none focus:ring-1 focus:ring-orange-400"
                  >
                    <option value={1}>1er Trimestre</option>
                    <option value={2}>2do Trimestre</option>
                    <option value={3}>3er Trimestre</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                    Semana del Trimestre
                  </label>
                  <select
                    value={semana}
                    onChange={(e) => setSemana(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg py-1 px-2 font-mono font-black text-xs shadow-xs outline-none focus:ring-1 focus:ring-orange-400"
                  >
                    {Array.from({ length: 14 }, (_, i) => i + 1).map((sem) => (
                      <option key={sem} value={sem}>
                        Semana {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MARCADOR DE NOTA */}
              <div className="p-4 bg-white border-b border-gray-50">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${metricasFinales.escala.color}`}
                >
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider opacity-80">
                      Rendimiento Cualitativo
                    </p>
                    <p className="text-xs font-black mt-0.5">
                      {metricasFinales.escala.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-wider opacity-80">
                      Nota Final Calculada
                    </p>
                    <p className="text-lg font-black font-mono leading-none mt-0.5">
                      {metricasFinales.notaFinal}
                      <span className="text-xs font-bold opacity-60">
                        /85
                      </span>{" "}
                      {/* <-- Cambiado a /85 */}
                    </p>
                  </div>
                </div>
              </div>

              {/* ALERTAS DE ESTADO */}
              {mensajeEstado && (
                <div
                  className={`mx-4 mt-3 p-2.5 rounded-xl text-[11px] font-bold border ${
                    mensajeEstado.tipo === "exito"
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                      : "bg-red-50 border-red-100 text-red-700"
                  }`}
                >
                  {mensajeEstado.texto}
                </div>
              )}

              {/* CONTENEDOR DINÁMICO DE CRITERIOS */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white">
                {Object.keys(estructuraCurricularDelCampo).length > 0 ? (
                  Object.entries(estructuraCurricularDelCampo).map(
                    ([nombreTematica, dimensiones]) => (
                      <div
                        key={nombreTematica}
                        className="border border-gray-100 rounded-2xl p-3.5 space-y-3 bg-gray-50/20"
                      >
                        <h4 className="font-black text-gray-900 text-xs border-b border-gray-100 pb-1.5 uppercase">
                          📚 Temática: {nombreTematica}
                        </h4>

                        {(
                          [
                            {
                              key: "ser",
                              label: "SER",
                              max: 10,
                              data: dimensiones.ser,
                            },
                            {
                              key: "saber",
                              label: "SABER",
                              max: 45,
                              data: dimensiones.saber,
                            },
                            {
                              key: "hacer",
                              label: "HACER",
                              max: 40,
                              data: dimensiones.hacer,
                            },
                            {
                              key: "decidir",
                              label: "DECIDIR",
                              max: 5,
                              data: dimensiones.decidir,
                            },
                          ] as const
                        ).map((dim) =>
                          dim.data?.map((indicador) => (
                            <div
                              key={indicador.id}
                              className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-white p-2.5 rounded-xl border border-gray-100/70 items-center"
                            >
                              <div className="sm:col-span-1 flex flex-col">
                                <span className="font-black text-[9px] text-gray-500">
                                  {dim.label}
                                </span>
                                <span className="text-[8px] font-bold text-gray-300 font-mono">
                                  Max {dim.max} pts
                                </span>
                              </div>
                              <div className="sm:col-span-3 text-[10px] text-gray-500 font-bold italic leading-tight">
                                "{indicador.criterio}"
                              </div>
                              <div className="sm:col-span-1 flex justify-end">
                                <input
                                  type="number"
                                  min="0"
                                  max={dim.max}
                                  placeholder="0"
                                  className="w-14 bg-gray-50 border border-gray-200 rounded-lg py-1 text-xs font-black text-center font-mono outline-none focus:ring-1 focus:ring-orange-400"
                                  value={notasDinamicas[indicador.id] || ""}
                                  onChange={(e) => {
                                    const val = Math.min(
                                      dim.max,
                                      Math.max(0, Number(e.target.value)),
                                    );
                                    setNotasDinamicas({
                                      ...notasDinamicas,
                                      [indicador.id]: val,
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          )),
                        )}
                      </div>
                    ),
                  )
                ) : (
                  <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                    <AlertTriangle size={20} className="text-amber-400 mb-2" />
                    <p className="font-bold text-xs uppercase">
                      No hay indicadores mapeados para este campo
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                    Observaciones de la Semana
                  </label>
                  <textarea
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none"
                    rows={2}
                    placeholder="Escribe el desarrollo cualitativo o comportamiento del alumno esta semana..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                  />
                </div>
              </div>

              {/* ACCIÓN DE GUARDADO CONECTADA */}
              <div className="p-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
                <button
                  onClick={handleGuardarEvaluacion}
                  disabled={guardando}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-300 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  {guardando ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Conectando
                      a la Base de Datos...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Guardar Evaluación - Semana {semana}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[440px] text-gray-400 w-full">
              <User size={18} className="text-gray-300 mb-2" />
              <p className="text-xs font-black uppercase text-gray-500">
                Ningún estudiante seleccionado
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

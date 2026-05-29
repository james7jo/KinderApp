"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  User,
  Check,
  Save,
  Loader2,
  AlertCircle,
  HelpCircle,
  Clock,
  X,
} from "lucide-react";

type Alumno = {
  id: string;
  nombre: string;
  apellido: string;
  foto_url?: string | null;
};

type ContenidoPDF = {
  id: string;
  trimestre: number;
  titulo_tematico: string;
  contenidos_detalle: string[]; // Array JSONB de indicadores del Ministerio
};

type EvaluacionExistente = {
  alumno_id: string;
  trimestre: number;
  semana: number;
  contenido_id: string;
  indicador_indice: number;
  nivel_logro_id: number;
  descripcion: string;
};

interface Props {
  cursoId: string;
  cursoNombre: string;
  colegioId: string;
  maestraId: string;
  alumnos: Alumno[];
  contenidosPDF: ContenidoPDF[];
  evaluacionesExistentes: EvaluacionExistente[];
  gestion: number;
}

export default function EvaluacionCosmosClient({
  cursoId,
  cursoNombre,
  colegioId,
  maestraId,
  alumnos,
  contenidosPDF,
  evaluacionesExistentes,
  gestion,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  // Estados de los filtros principales
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>(
    alumnos[0]?.id ?? "",
  );
  const [trimestre, setTrimestre] = useState<number>(1);
  const [semana, setSemana] = useState<number>(1);

  // Estados de UI y guardado
  const [guardando, setGuardando] = useState(false);
  const [notificacion, setNotificacion] = useState<{
    texto: string;
    error: boolean;
  } | null>(null);

  // Matriz de evaluaciones locales en el formulario
  // Estructura de llave primaria compuesta: "contenidoId-indicadorIndex"
  const [evaluacionesForm, setEvaluacionesForm] = useState<
    Record<string, { logroId: number; obs: string }>
  >({});

  // 1. Filtrar los bloques temáticos del PDF según el trimestre seleccionado en la pantalla
  const contenidosFiltrados = useMemo(() => {
    return contenidosPDF.filter((c) => c.trimestre === trimestre);
  }, [contenidosPDF, trimestre]);

  // 2. Cada vez que cambie el alumno, trimestre o semana, cargar los datos que ya estén guardados en Supabase
  useEffect(() => {
    const mapeoInicial: Record<string, { logroId: number; obs: string }> = {};

    // Inicializar el formulario con lo que esté en blanco
    contenidosFiltrados.forEach((bloque) => {
      bloque.contenidos_detalle.forEach((_, index) => {
        mapeoInicial[`${bloque.id}-${index}`] = { logroId: 0, obs: "" };
      });
    });

    // Sobreponer los registros reales que ya existen en la base de datos
    evaluacionesExistentes.forEach((evalBD) => {
      if (
        evalBD.alumno_id === alumnoSeleccionado &&
        evalBD.trimestre === trimestre &&
        evalBD.semana === semana
      ) {
        mapeoInicial[`${evalBD.contenido_id}-${evalBD.indicador_indice}`] = {
          logroId: evalBD.nivel_logro_id,
          obs:
            evalBD.descripcion === "Sin observación" ? "" : evalBD.descripcion,
        };
      }
    });

    setEvaluacionesForm(mapeoInicial);
    setNotificacion(null);
  }, [
    alumnoSeleccionado,
    trimestre,
    semana,
    contenidosFiltrados,
    evaluacionesExistentes,
  ]);

  // Handler para marcar los botones de evaluación rápida (✓ / ◐ / ✗)
  const handleCambioLogro = (
    contenidoId: string,
    indicadorIndex: number,
    logroId: number,
  ) => {
    const key = `${contenidoId}-${indicadorIndex}`;
    setEvaluacionesForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], logroId },
    }));
  };

  // Handler para actualizar la caja de texto de observaciones
  const handleCambioObservacion = (
    contenidoId: string,
    indicadorIndex: number,
    texto: string,
  ) => {
    const key = `${contenidoId}-${indicadorIndex}`;
    setEvaluacionesForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], obs: texto },
    }));
  };

  // Acción del botón guardar
  const guardarEvaluacionSemanal = async () => {
    if (!alumnoSeleccionado) {
      setNotificacion({
        texto: "Por favor selecciona un alumno primero.",
        error: true,
      });
      return;
    }

    setGuardando(true);
    setNotificacion(null);

    try {
      const registrosAInsertar = [];

      // Recorrer los criterios del formulario para empaquetar los inserts
      for (const bloque of contenidosFiltrados) {
        for (let idx = 0; idx < bloque.contenidos_detalle.length; idx++) {
          const indicadorTexto = bloque.contenidos_detalle[idx];
          const estadoForm = evaluacionesForm[`${bloque.id}-${idx}`];

          // Si la maestra no ha evaluado este indicador aún, nos lo saltamos
          if (!estadoForm || estadoForm.logroId === 0) continue;

          // Asignar los puntajes estimados requeridos según la escala oficial
          let puntaje = 25; // No logrado (id=3)
          if (estadoForm.logroId === 1) puntaje = 85; // Logrado
          if (estadoForm.logroId === 2) puntaje = 55; // En proceso

          registrosAInsertar.push({
            alumno_id: alumnoSeleccionado,
            maestra_id: maestraId,
            curso_id: cursoId,
            colegio_id: colegioId,
            gestion: gestion,
            trimestre: trimestre,
            semana: semana,
            campo_id: 1, // Cosmos y Pensamiento
            contenido_id: bloque.id,
            indicador_texto: indicadorTexto,
            indicador_indice: idx,
            descripcion: estadoForm.obs.trim() || "Sin observación",
            nivel_logro_id: estadoForm.logroId,
            puntaje_estimado: puntaje,
          });
        }
      }

      if (registrosAInsertar.length === 0) {
        setNotificacion({
          texto: "Marcá al menos un indicador para guardar.",
          error: true,
        });
        setGuardando(false);
        return;
      }

      // Limpiar registros antiguos del mismo alumno/trimestre/semana/contenido para evitar duplicados en la tabla
      for (const bloque of contenidosFiltrados) {
        await supabase
          .from("observacion_semanal")
          .delete()
          .eq("alumno_id", alumnoSeleccionado)
          .eq("trimestre", trimestre)
          .eq("semana", semana)
          .eq("contenido_id", bloque.id);
      }

      // Guardar masivamente los nuevos criterios evaluados
      const { error } = await supabase
        .from("observacion_semanal")
        .insert(registrosAInsertar);

      if (error) throw error;

      setNotificacion({
        texto: `¡Evaluación de la Semana ${semana} guardada exitosamente!`,
        error: false,
      });

      // Forzar al Server Component a recargar los datos actualizados
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setNotificacion({
        texto: "Hubo un problema al guardar los datos en Supabase.",
        error: true,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-w-0 font-nunito bg-gray-50/50 min-h-screen pb-12">
      {/* BARRA SUPERIOR E ESTILOS */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
        <Link
          href={`/dashboard/maestra/curso/${cursoId}`}
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            {cursoNombre}
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Evaluación Semanal: Cosmos y Pensamiento
          </h1>
        </div>
      </div>

      <div className="px-4 lg:px-7 pt-5 max-w-4xl mx-auto space-y-4">
        {/* PANEL DE CONTROL / SELECTORES */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de Alumno */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <User size={12} className="text-orange-500" /> Estudiante
            </label>
            <select
              value={alumnoSeleccionado}
              onChange={(e) => setAlumnoSeleccionado(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-400 transition-all"
            >
              <option value="" disabled>
                Selecciona un alumno...
              </option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellido}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Trimestre */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <BookOpen size={12} className="text-orange-500" /> Trimestre
              Escolar
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
              {[1, 2, 3].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrimestre(t)}
                  className={`py-2 text-xs font-black rounded-lg transition-all ${
                    trimestre === t
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {t}° Trim
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Semana */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Clock size={12} className="text-orange-500" /> Semana de Clases
            </label>
            <select
              value={semana}
              onChange={(e) => setSemana(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-400 transition-all"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s}>
                  Semana {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NOTIFICACIONES */}
        {notificacion && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
              notificacion.error
                ? "bg-red-50 border-red-100 text-red-700"
                : "bg-green-50 border-green-100 text-green-700"
            }`}
          >
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-sm font-bold">{notificacion.texto}</p>
          </div>
        )}

        {/* LISTA DE EVALUACIÓN OFICIAL DEL PDF */}
        <div className="space-y-4">
          {contenidosFiltrados.length > 0 ? (
            contenidosFiltrados.map((bloque) => (
              <div
                key={bloque.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4"
              >
                {/* Cabecera del Bloque Temático del Ministerio */}
                <div className="border-b border-gray-50 pb-3">
                  <span className="bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                    Temática Orientadora
                  </span>
                  <h3 className="text-base font-black text-gray-900 mt-1">
                    {bloque.titulo_tematico}
                  </h3>
                </div>

                {/* Sublista de indicadores contenidos en el JSONB */}
                <div className="divide-y divide-gray-100 space-y-4 pt-1">
                  {bloque.contenidos_detalle.map((indicador, indx) => {
                    const key = `${bloque.id}-${indx}`;
                    const valorActual = evaluacionesForm[key]?.logroId ?? 0;
                    const obsActual = evaluacionesForm[key]?.obs ?? "";

                    return (
                      <div
                        key={indx}
                        className={`pt-4 first:pt-0 flex flex-col md:flex-row md:items-start gap-4 transition-all`}
                      >
                        {/* Texto del Indicador */}
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-700 leading-relaxed">
                            <span className="text-orange-400 font-mono font-black mr-1">
                              {indx + 1}.
                            </span>
                            {indicador}
                          </p>

                          {/* Caja de Observación */}
                          <input
                            type="text"
                            placeholder="Agregar observación opcional..."
                            value={obsActual}
                            onChange={(e) =>
                              handleCambioObservacion(
                                bloque.id,
                                indx,
                                e.target.value,
                              )
                            }
                            className="w-full mt-2 bg-gray-50 border border-gray-50 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-orange-400 transition-all text-gray-700"
                          />
                        </div>

                        {/* Botonera de tres opciones (✓ / ◐ / ✗) */}
                        <div className="flex items-center gap-1 shrink-0 self-start md:self-center bg-gray-50 p-1 rounded-xl border border-gray-100">
                          {/* LOGRADO */}
                          <button
                            type="button"
                            onClick={() =>
                              handleCambioLogro(bloque.id, indx, 1)
                            }
                            className={`flex items-center gap-1 px-3 py-2 text-xs font-black rounded-lg transition-all ${
                              valorActual === 1
                                ? "bg-green-500 text-white shadow-sm"
                                : "text-gray-400 hover:bg-gray-100 hover:text-green-600"
                            }`}
                          >
                            <Check size={13} /> Logrado
                          </button>

                          {/* EN PROCESO */}
                          <button
                            type="button"
                            onClick={() =>
                              handleCambioLogro(bloque.id, indx, 2)
                            }
                            className={`flex items-center gap-1 px-3 py-2 text-xs font-black rounded-lg transition-all ${
                              valorActual === 2
                                ? "bg-orange-400 text-white shadow-sm"
                                : "text-gray-400 hover:bg-gray-100 hover:text-orange-500"
                            }`}
                          >
                            <HelpCircle size={13} /> En Proceso
                          </button>

                          {/* NO LOGRADO */}
                          <button
                            type="button"
                            onClick={() =>
                              handleCambioLogro(bloque.id, indx, 3)
                            }
                            className={`flex items-center gap-1 px-3 py-2 text-xs font-black rounded-lg transition-all ${
                              valorActual === 3
                                ? "bg-red-500 text-white shadow-sm"
                                : "text-gray-400 hover:bg-gray-100 hover:text-red-500"
                            }`}
                          >
                            <X size={13} /> No Logrado
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <AlertCircle size={24} className="text-orange-400 mx-auto mb-2" />
              <p className="text-gray-500 font-bold text-sm">
                No hay contenidos curriculares de Cosmos cargados para el{" "}
                {trimestre}° Trimestre.
              </p>
            </div>
          )}
        </div>

        {/* BOTÓN FLOTANTE / DE ACCIÓN INFERIOR */}
        {contenidosFiltrados.length > 0 && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={guardarEvaluacionSemanal}
              disabled={guardando}
              className="w-full md:w-auto bg-gradient-to-br from-orange-500 to-orange-600 text-white px-6 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 transition-all active:scale-98 disabled:opacity-50"
            >
              {guardando ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Guardar Evaluación de Cosmos (Semana {semana})
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

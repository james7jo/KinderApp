"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Save,
  Loader2,
  AlertCircle,
  PlusCircle,
  Trash2,
  FileText,
  Sparkles,
} from "lucide-react";

type Campo = {
  id: number;
  nombre: string;
  sigla: string;
};

type Contenido = {
  id: number;
  campo_id: number;
  trimestre: number; // 1, 2, 3 = Trimestres normales. 4 = Perfil de Salida Anual
  anio_escolaridad: number;
  titulo_tematico: string;
  contenidos_detalle: string[];
};

interface Props {
  campos: Campo[];
  contenidosIniciales: Contenido[];
}

export default function CurriculoDirectorClient({
  campos,
  contenidosIniciales,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  // Filtros principales del Director
  const [anioEscolaridad, setAnioEscolaridad] = useState<number>(1);
  const [trimestre, setTrimestre] = useState<number>(1);
  const [campoSeleccionado, setCampoSeleccionado] = useState<number>(
    campos[0]?.id ?? 1,
  );

  // Estados de control para el catálogo
  const [contenidos, setContenidos] =
    useState<Contenido[]>(contenidosIniciales);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [notificacion, setNotificacion] = useState<{
    texto: string;
    error: boolean;
  } | null>(null);

  // Formulario para Nuevo Registro / Bloque Manual
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [textoIndicadores, setTextoIndicadores] = useState("");

  // Filtrar los bloques según la combinación de la botonera superior
  const contenidosFiltrados = useMemo(() => {
    return contenidos.filter(
      (c) =>
        c.anio_escolaridad === anioEscolaridad &&
        c.trimestre === trimestre &&
        c.campo_id === campoSeleccionado,
    );
  }, [contenidos, anioEscolaridad, trimestre, campoSeleccionado]);

  // Handler para editar un indicador individual en caliente
  const handleEditIndicador = (
    contenidoId: number,
    idx: number,
    nuevoTexto: string,
  ) => {
    setContenidos((prev) =>
      prev.map((c) => {
        if (c.id !== contenidoId) return c;
        const copia = [...c.contenidos_detalle];
        copia[idx] = nuevoTexto;
        return { ...c, contenidos_detalle: copia };
      }),
    );
  };

  // Handler para cuando el director edita el título temático del bloque en caliente
  const handleEditTituloTematico = (
    contenidoId: number,
    nuevoTitulo: string,
  ) => {
    setContenidos((prev) =>
      prev.map((c) =>
        c.id === contenidoId ? { ...c, titulo_tematico: nuevoTitulo } : c,
      ),
    );
  };

  // Añadir un indicador en blanco al final de un bloque específico
  const handleAddIndicadorFila = (contenidoId: number) => {
    setContenidos((prev) =>
      prev.map((c) => {
        if (c.id !== contenidoId) return c;
        return { ...c, contenidos_detalle: [...c.contenidos_detalle, ""] };
      }),
    );
  };

  // Remover un indicador específico por su posición (índice)
  const handleRemoveIndicadorFila = (
    contenidoId: number,
    idxAMorir: number,
  ) => {
    setContenidos((prev) =>
      prev.map((c) => {
        if (c.id !== contenidoId) return c;
        return {
          ...c,
          contenidos_detalle: c.contenidos_detalle.filter(
            (_, idx) => idx !== idxAMorir,
          ),
        };
      }),
    );
  };

  // Handler para guardar/actualizar un bloque existente en Supabase
  const actualizarBloque = async (bloque: Contenido) => {
    setGuardandoId(bloque.id);
    setNotificacion(null);

    try {
      // Limpiar líneas vacías que el director haya podido dejar por error
      const detallesLimpios = bloque.contenidos_detalle
        .map((t) => t.trim())
        .filter(Boolean);

      if (detallesLimpios.length === 0) {
        throw new Error(
          "El bloque debe tener por lo menos un criterio antes de guardar.",
        );
      }

      const { error } = await supabase
        .from("contenidos_trimestre")
        .update({
          titulo_tematico: bloque.titulo_tematico.trim(),
          contenidos_detalle: detallesLimpios, // Se guarda directo como array JSONB
        })
        .eq("id", bloque.id);

      if (error) throw error;

      setNotificacion({
        texto:
          "¡Malla oficial guardada y sincronizada en la Base de Datos con éxito!",
        error: false,
      });
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setNotificacion({
        texto: err.message || "Error al actualizar los indicadores.",
        error: true,
      });
    } finally {
      setGuardandoId(null);
    }
  };

  // Handler para registrar un bloque NUEVO desde cero de forma manual
  const handleCrearBloqueManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreandoNuevo(true);
    setNotificacion(null);

    try {
      if (!nuevoTitulo.trim() || !textoIndicadores.trim()) {
        throw new Error("El título y los indicadores son obligatorios.");
      }

      // 🌟 FUSIÓN INTELIGENTE: Picamos el texto plano por salto de línea y unimos los textos rotos
      const lineasBrutas = textoIndicadores
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const arrayIndicadores: string[] = [];

      lineasBrutas.forEach((linea) => {
        // Limpiar prefijos numéricos o viñetas (ej: "1. ", "- ", "• ")
        const lineaLimpia = linea.replace(/^[\d\.\-\•\*\s]+/g, "").trim();

        if (lineaLimpia.length === 0) return;

        // REGLA: Si inicia con minúscula, es continuación de la línea anterior
        const primeraLetra = lineaLimpia.charAt(0);
        const esContinuacion =
          primeraLetra === primeraLetra.toLowerCase() &&
          !/^[\d]/.test(primeraLetra) &&
          arrayIndicadores.length > 0;

        if (esContinuacion) {
          arrayIndicadores[arrayIndicadores.length - 1] += " " + lineaLimpia;
        } else {
          arrayIndicadores.push(lineaLimpia);
        }
      });

      // Limpieza final de espacios dobles internos
      const arrayFinal = arrayIndicadores.map((texto) =>
        texto.replace(/\s+/g, " ").trim(),
      );

      if (arrayFinal.length === 0) {
        throw new Error(
          "Escribe al menos un indicador válido (uno por línea).",
        );
      }

      const { data, error } = await supabase
        .from("contenidos_trimestre")
        .insert({
          anio_escolaridad: anioEscolaridad,
          trimestre: trimestre,
          campo_id: campoSeleccionado,
          titulo_tematico: nuevoTitulo.trim(),
          contenidos_detalle: arrayFinal,
          gestion_origen: new Date().getFullYear(),
          activo: true,
        })
        .select()
        .single();

      if (error) throw error;

      setContenidos((prev) => [...prev, data]);
      setNuevoTitulo("");
      setTextoIndicadores("");
      setNotificacion({
        texto: "¡Nuevo bloque temático curricular inyectado con éxito!",
        error: false,
      });
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setNotificacion({
        texto: err.message || "Error al insertar el bloque manual.",
        error: true,
      });
    } finally {
      setCreandoNuevo(false);
    }
  };

  // Eliminar un bloque si el director se equivocó feo
  const eliminarBloque = async (id: number) => {
    if (
      !confirm(
        "¿Seguro que deseas eliminar este bloque de indicadores oficiales? Esto afectará a las maestras.",
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("contenidos_trimestre")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setContenidos((prev) => prev.filter((c) => c.id !== id));
      setNotificacion({ texto: "Bloque curricular removido.", error: false });
      router.refresh();
    } catch (err) {
      console.error(err);
      setNotificacion({
        texto: "No se pudo eliminar el registro.",
        error: true,
      });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 pb-12 font-nunito">
      {/* BARRA SUPERIOR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
        <Link
          href="/dashboard/director"
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Gestor Curricular Estándar
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Planes y Programas del Ministerio
          </h1>
        </div>
      </div>

      <div className="px-4 lg:px-7 pt-5 max-w-5xl mx-auto space-y-4">
        {/* PANEL DE FILTROS MAESTROS */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Año Escolaridad */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <GraduationCap size={12} className="text-orange-500" /> Año de
                Escolaridad (Sección)
              </label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setAnioEscolaridad(1)}
                  className={`py-2.5 text-xs font-black rounded-lg transition-all ${
                    anioEscolaridad === 1
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  1er Año (1ra Sección)
                </button>
                <button
                  type="button"
                  onClick={() => setAnioEscolaridad(2)}
                  className={`py-2.5 text-xs font-black rounded-lg transition-all ${
                    anioEscolaridad === 2
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  2do Año (2da Sección)
                </button>
              </div>
            </div>

            {/* Periodo de Evaluación */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <BookOpen size={12} className="text-orange-500" /> Periodo de
                Evaluación
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                {[1, 2, 3].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrimestre(t)}
                    className={`py-2.5 text-xs font-black rounded-lg transition-all ${
                      trimestre === t
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {t}° Trim
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTrimestre(4)}
                  className={`py-2.5 text-[10px] font-black rounded-lg transition-all truncate px-1 ${
                    trimestre === 4
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-red-500 hover:bg-red-50"
                  }`}
                >
                  🎯 Perfil Anual
                </button>
              </div>
            </div>
          </div>

          {/* Selector de Campos */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              Campos de Saberes y Conocimientos oficiales
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {campos.map((campo) => (
                <button
                  key={campo.id}
                  type="button"
                  onClick={() => setCampoSeleccionado(campo.id)}
                  className={`p-3 text-left rounded-xl border text-xs font-black transition-all ${
                    campoSeleccionado === campo.id
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-gray-100 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="block text-[10px] text-gray-400 font-mono font-bold mb-0.5">
                    {campo.sigla}
                  </span>
                  <span className="truncate block">{campo.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NOTIFICACIÓN */}
        {notificacion && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              notificacion.error
                ? "bg-red-50 border-red-100 text-red-700"
                : "bg-green-50 border-green-100 text-green-700"
            }`}
          >
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-sm font-bold">{notificacion.texto}</p>
          </div>
        )}

        {/* LISTADO DE BLOQUES Y CARGADOR */}
        <div className="space-y-4">
          {/* Bloques existentes */}
          {contenidosFiltrados.map((bloque) => (
            <div
              key={bloque.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 border-l-4 border-l-orange-500"
            >
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="bg-gray-100 text-gray-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                  <FileText size={10} />{" "}
                  {trimestre === 4
                    ? "Evaluación Fin de Gestión"
                    : `Bloque Trimestre ${trimestre}`}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarBloque(bloque.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Temática Orientadora o Título del Bloque
                </label>
                <input
                  type="text"
                  value={bloque.titulo_tematico}
                  onChange={(e) =>
                    handleEditTituloTematico(bloque.id, e.target.value)
                  }
                  className="w-full bg-gray-50 border border-gray-100 font-bold text-gray-800 rounded-xl px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
                  <span>
                    Criterios de Evaluación / Indicadores Curriculares
                  </span>
                  <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">
                    {bloque.contenidos_detalle.length} criterios
                  </span>
                </label>

                {bloque.contenidos_detalle.map((indicador, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-orange-500 w-4 text-center">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={indicador}
                      onChange={(e) =>
                        handleEditIndicador(bloque.id, index, e.target.value)
                      }
                      className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-orange-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveIndicadorFila(bloque.id, index)
                      }
                      className="text-gray-300 hover:text-red-500 p-1 rounded-lg transition-colors"
                      title="Eliminar fila"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddIndicadorFila(bloque.id)}
                    className="text-[11px] font-black text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/70 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                  >
                    <PlusCircle size={12} />
                    Añadir fila de criterio curricular
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => actualizarBloque(bloque)}
                  disabled={guardandoId === bloque.id}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {guardandoId === bloque.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Save size={12} />
                  )}
                  Guardar Cambios Oficiales
                </button>
              </div>
            </div>
          ))}

          {/* Formulario manual de inyección base */}
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 bg-gradient-to-br from-white to-orange-50/10">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <PlusCircle size={16} className="text-orange-500" />
              <h3 className="text-sm font-black text-gray-900">
                {contenidosFiltrados.length > 0
                  ? "Añadir otro bloque temático manual"
                  : "Registrar Plan del Ministerio Manualmente"}
              </h3>
            </div>

            <form onSubmit={handleCrearBloqueManual} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  {trimestre === 4
                    ? "Título del Perfil de Salida (Ej: Desarrollo integral al cierre de gestión)"
                    : "Temática Orientadora (Ej: Afectividad y manifestaciones familiares)"}
                </label>
                <input
                  type="text"
                  required
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  placeholder="Escribe el bloque temático o perfil tal cual dicta el PDF..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                  <span>
                    Indicadores de logro (Pega el bloque de texto completo aquí)
                  </span>
                  <span className="text-[9px] text-orange-500 lowercase font-bold font-mono">
                    ⚠️ Presiona ENTER para separar cada indicador
                  </span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={textoIndicadores}
                  onChange={(e) => setTextoIndicadores(e.target.value)}
                  placeholder={
                    "Mi derecho a la identidad, mi nombre, mi grupo familiar...\nRelaciones interpersonales: respeto, solidaridad, honestidad...\nDerecho a una vida armónica y pacífica..."
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all font-mono leading-relaxed resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={creandoNuevo}
                  className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white text-xs font-black px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                >
                  {creandoNuevo ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} className="text-orange-400" />
                  )}
                  Procesar e Inyectar Indicadores Oficiales
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Save,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Sparkles, // 🎯 Icono para el botón flotante
  X, // 🎯 Icono para cerrar el modal
} from "lucide-react";
import ChatAmauta from "@/components/ChatAmauta";

type Campo = {
  id: number;
  nombre: string;
  sigla: string;
};

type ContenidoMinisterio = {
  id: number;
  campo_id: number;
  trimestre: number;
  anio_escolaridad: number;
  titulo_tematico: string;
  contenidos_detalle: string[];
};

type PlanEstructuradoItem = {
  contenido_id: number;
  titulo_tematico: string;
  semana_inicio: number;
  semana_fin: number;
  campo_id: number;
  trimestre: number;
};

interface Props {
  curso: { id: string; nombre: string; anio_escolaridad: number };
  maestraId: string;
  colegioId: string;
  campos: Campo[];
  contenidosMinisterio: ContenidoMinisterio[];
  planExistente: any | null;
}

export default function PlanificacionMaestraClient({
  curso,
  maestraId,
  colegioId,
  campos,
  contenidosMinisterio,
  planExistente,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [trimestreSel, setTrimestreSel] = useState<number>(1);
  const [campoSel, setCampoSel] = useState<number>(campos[0]?.id ?? 1);

  const [procesando, setProcesando] = useState(false);
  const [notificacion, setNotificacion] = useState<{
    texto: string;
    error: boolean;
  } | null>(null);

  const [contenidoEstructurado, setContenidoEstructurado] = useState<
    PlanEstructuradoItem[]
  >(
    planExistente?.contenido_structured ||
      planExistente?.contenido_estructurado ||
      [],
  );

  const [estadoPlan, setEstadoPlan] = useState<string>(
    planExistente?.estado || "borrador",
  );

  // 🎯 Estado para controlar la apertura del asistente en móviles
  const [chatMovilAbierto, setChatMovilAbierto] = useState(false);

  const isBloqueadoDesarrollo = false;

  const contenidosFiltrados = useMemo(() => {
    return contenidosMinisterio.filter(
      (c) => c.trimestre === trimestreSel && c.campo_id === campoSel,
    );
  }, [contenidosMinisterio, trimestreSel, campoSel]);

  const handleCambiarSemanas = (
    contenidoId: number,
    titulo: string,
    campoId: number,
    trim: number,
    llave: "semana_inicio" | "semana_fin",
    valor: number,
  ) => {
    setContenidoEstructurado((prev) => {
      const existe = prev.find((item) => item.contenido_id === contenidoId);

      if (existe) {
        return prev.map((item) =>
          item.contenido_id === contenidoId
            ? { ...item, [llave]: valor }
            : item,
        );
      } else {
        const nuevoItem: PlanEstructuradoItem = {
          contenido_id: contenidoId,
          titulo_tematico: titulo,
          semana_inicio: llave === "semana_inicio" ? valor : 1,
          semana_fin: llave === "semana_fin" ? valor : 1,
          campo_id: campoId,
          trimestre: trim,
        };
        return [...prev, nuevoItem];
      }
    });
  };

  const getSemanasAsignadas = (contenidoId: number) => {
    const encontrado = contenidoEstructurado.find(
      (item) => item.contenido_id === contenidoId,
    );
    return {
      semana_inicio: encontrado?.semana_inicio ?? 0,
      semana_fin: encontrado?.semana_fin ?? 0,
    };
  };

  const handleGuardarPlanificacion = async (nuevoEstado?: string) => {
    setProcesando(true);
    setNotificacion(null);

    let estadoFormateado = "Borrador";
    if (nuevoEstado) {
      estadoFormateado =
        nuevoEstado.charAt(0).toUpperCase() +
        nuevoEstado.slice(1).toLowerCase();
    } else if (estadoPlan) {
      estadoFormateado =
        estadoPlan.charAt(0).toUpperCase() + estadoPlan.slice(1).toLowerCase();
    }

    const gestionActual = new Date().getFullYear();

    try {
      const payload = {
        maestra_id: maestraId,
        curso_id: curso.id,
        colegio_id: colegioId,
        gestion: parseInt(gestionActual.toString(), 10),
        anio_escolaridad: parseInt(curso.anio_escolaridad.toString(), 10),
        contenido_estructurado: contenidoEstructurado,
        estado: estadoFormateado,
        updated_at: new Date().toISOString(),
      };

      if (planExistente?.id) {
        const { error: errUpdate } = await supabase
          .from("planificacion_anual")
          .update(payload)
          .eq("id", planExistente.id);

        if (errUpdate) throw errUpdate;
      } else {
        const { error: errInsert } = await supabase
          .from("planificacion_anual")
          .insert([
            {
              ...payload,
              created_at: new Date().toISOString(),
            },
          ]);

        if (errInsert) throw errInsert;
      }

      setEstadoPlan(estadoFormateado);

      setNotificacion({
        texto:
          estadoFormateado === "Enviado"
            ? "¡Planificación enviada formalmente al Director para su revisión!"
            : "¡Progreso de planificación guardado en Borrador de forma exitosa!",
        error: false,
      });

      router.refresh();
    } catch (err: any) {
      console.error("Error de Supabase:", err);
      setNotificacion({
        texto: `Error de Supabase: ${err.message || "Verifica las restricciones de la tabla"}`,
        error: true,
      });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 pb-24 lg:pb-12 font-sans text-xs relative">
      {/* BARRA SUPERIOR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/maestra/curso/${curso.id}`}
            className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </Link>
          <div className="min-w-0">
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">
              {curso.nombre} • Obligatorio PAT
            </p>
            <h1 className="text-sm font-black text-gray-900 truncate mt-1 uppercase tracking-tight">
              Planificación Anual Trimestralizada
            </h1>
          </div>
        </div>

        <span
          className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
            estadoPlan.toLowerCase() === "enviado"
              ? "bg-blue-100 text-blue-600"
              : estadoPlan.toLowerCase() === "aprobado"
                ? "bg-green-100 text-green-600"
                : "bg-amber-100 text-amber-600"
          }`}
        >
          {estadoPlan}
        </span>
      </div>

      {/* 🚀 GRILLA PRINCIPAL */}
      <div className="px-4 lg:px-7 pt-5 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* COLUMNA DE PLANIFICACIÓN (Responsiva en anchos) */}
        <div className="xl:col-span-3 space-y-4">
          {/* FILTROS Y ACCIONES */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Calendar size={12} className="text-orange-500" /> Trimestre a
                  Calendarizar
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  {[1, 2, 3].map((t) => (
                    <button
                      key={t}
                      type="button"
                      disabled={isBloqueadoDesarrollo}
                      onClick={() => setTrimestreSel(t)}
                      className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                        trimestreSel === t
                          ? "bg-orange-500 text-white shadow-xs"
                          : "text-gray-500"
                      }`}
                    >
                      {t}° Trim
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={isBloqueadoDesarrollo}
                    onClick={() => setTrimestreSel(4)}
                    className={`py-1.5 text-[10px] font-black rounded-lg transition-all ${
                      trimestreSel === 4
                        ? "bg-gray-900 text-white shadow-xs"
                        : "text-red-500"
                    }`}
                  >
                    🎯 Anual
                  </button>
                </div>
              </div>

              {/* CONTROLES DE GUARDADO */}
              <div className="flex items-end gap-2 justify-end">
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => handleGuardarPlanificacion("Borrador")}
                    className="bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-black px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm h-9 whitespace-nowrap"
                  >
                    {procesando ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    Guardar Borrador
                  </button>

                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => handleGuardarPlanificacion("Enviado")}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-black px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-orange-100 h-9 whitespace-nowrap"
                  >
                    <Send size={13} />
                    Enviar al Director
                  </button>
                </div>
              </div>
            </div>

            {/* CAMPO DE SABERES */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Campos de Saberes y Conocimientos del Ministerio
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {campos.map((campo) => (
                  <button
                    type="button"
                    key={campo.id}
                    onClick={() => setCampoSel(campo.id)}
                    className={`p-2.5 text-left rounded-xl border text-xs font-black transition-all ${
                      campoSel === campo.id
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-100 bg-white text-gray-600"
                    }`}
                  >
                    <span className="block text-[8px] text-gray-400 font-mono mb-0.5">
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
              className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold ${
                notificacion.error
                  ? "bg-red-50 border-red-100 text-red-700"
                  : "bg-green-50 border-green-100 text-green-700"
              }`}
            >
              {notificacion.error ? (
                <AlertCircle size={15} />
              ) : (
                <CheckCircle size={15} />
              )}
              <p>{notificacion.texto}</p>
            </div>
          )}

          {/* LISTADO DE BLOQUES */}
          <div className="space-y-4">
            {contenidosFiltrados.length > 0 ? (
              contenidosFiltrados.map((bloque) => {
                const { semana_inicio, semana_fin } = getSemanasAsignadas(
                  bloque.id,
                );
                const estaPlanificado = semana_inicio > 0;

                return (
                  <div
                    key={bloque.id}
                    className={`bg-white border rounded-2xl p-4 shadow-xs space-y-3 transition-all border-l-4 ${
                      estaPlanificado
                        ? "border-l-emerald-500 border-gray-100"
                        : "border-l-amber-400 border-gray-100"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-50 pb-2.5">
                      <div className="max-w-xl">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                          Temática del Bloque Oficial
                        </span>
                        <h3 className="text-xs font-black text-gray-800 leading-tight mt-0.5">
                          {bloque.titulo_tematico}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 self-start md:self-auto">
                        <div>
                          <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest text-center mb-0.5">
                            Inicio
                          </span>
                          <select
                            disabled={isBloqueadoDesarrollo}
                            value={semana_inicio}
                            onChange={(e) =>
                              handleCambiarSemanas(
                                bloque.id,
                                bloque.titulo_tematico,
                                bloque.campo_id,
                                bloque.trimestre,
                                "semana_inicio",
                                Number(e.target.value),
                              )
                            }
                            className="bg-white border border-gray-200 text-xs font-black text-gray-700 rounded-lg px-2 py-0.5 outline-none focus:border-orange-400"
                          >
                            <option value={0}>--</option>
                            {[...Array(12)].map((_, idx) => (
                              <option key={idx + 1} value={idx + 1}>
                                Semana {idx + 1}
                              </option>
                            ))}
                          </select>
                        </div>

                        <ChevronRight
                          size={13}
                          className="text-gray-300 mt-2.5"
                        />

                        <div>
                          <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest text-center mb-0.5">
                            Fin
                          </span>
                          <select
                            disabled={
                              isBloqueadoDesarrollo || semana_inicio === 0
                            }
                            value={semana_fin}
                            onChange={(e) =>
                              handleCambiarSemanas(
                                bloque.id,
                                bloque.titulo_tematico,
                                bloque.campo_id,
                                bloque.trimestre,
                                "semana_fin",
                                Number(e.target.value),
                              )
                            }
                            className="bg-white border border-gray-200 text-xs font-black text-gray-700 rounded-lg px-2 py-0.5 outline-none focus:border-orange-400"
                          >
                            <option value={0}>--</option>
                            {[...Array(12)].map((_, idx) => (
                              <option
                                key={idx + 1}
                                disabled={idx + 1 < semana_inicio}
                                value={idx + 1}
                              >
                                Semana {idx + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Indicadores de evaluación cargados por el director
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {bloque.contenidos_detalle.map((ind, i) => (
                          <div
                            key={i}
                            className="flex gap-2 items-start font-bold text-gray-600 bg-gray-50/40 p-2 rounded-xl border border-gray-100/50"
                          >
                            <span className="text-orange-500 font-mono font-black">
                              {i + 1}.
                            </span>
                            <p className="leading-tight">{ind}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-xs">
                <AlertCircle
                  size={20}
                  className="text-amber-500 mx-auto mb-1.5"
                />
                <p className="text-gray-500 font-black text-xs uppercase tracking-tight">
                  No hay contenidos oficiales registrados
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 🎯 PANEL DEL CHATBOT AMAUTA (ESCRITORIO: FIJO A LA DERECHA) */}
        <div className="hidden xl:block xl:col-span-1 lg:sticky lg:top-20 h-fit">
          <ChatAmauta />
        </div>
      </div>

      {/* 🎯 BOTÓN FLOTANTE (MÓVIL Y TABLETA) - CORREGIDO POR ENCIMA DE LA NAVBAR */}
      <div className="xl:hidden fixed bottom-24 right-6 z-40">
        <button
          onClick={() => setChatMovilAbierto(true)}
          className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all animate-bounce [animation-duration:3s]"
          title="Asistente Amauta"
        >
          <Sparkles size={24} className="animate-pulse" />
        </button>
      </div>

      {/* 🎯 MODAL DEL ASISTENTE EN PANTALLA COMPLETA (MÓVIL Y TABLETA) */}
      {chatMovilAbierto && (
        <div className="xl:hidden fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full h-[90vh] sm:h-[80vh] sm:max-w-lg sm:mx-auto rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Cabecera del Modal */}
            <div className="bg-gray-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-orange-400" />
                <span className="font-black text-xs uppercase tracking-wider">
                  Asistente Amauta
                </span>
              </div>
              <button
                onClick={() => setChatMovilAbierto(false)}
                className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenedor del Chat */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-2">
              <ChatAmauta />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

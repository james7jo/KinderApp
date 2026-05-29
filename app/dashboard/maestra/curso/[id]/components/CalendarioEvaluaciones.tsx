"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  Info,
} from "lucide-react";

type Evento = {
  fecha: string; // Formato "YYYY-MM-DD"
  titulo: string;
  tipo: "actividad" | "aviso" | "evaluacion" | "general";
  campoEvaluacion?: string;
};

interface Props {
  planEstructurado: any[];
  eventosInstitucionales?: Evento[];
}

export default function CalendarioEvaluaciones({
  planEstructurado,
  eventosInstitucionales = [],
}: Props) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  // Estado para saber qué día está presionando la maestra (para PC y Celular)
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

  const primerDia = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const inicioDia = (primerDia.getDay() + 6) % 7;

  function navMes(dir: number) {
    const d = new Date(anio, mes + dir, 1);
    setMes(d.getMonth());
    setAnio(d.getFullYear());
    setDiaSeleccionado(null); // Limpiamos la selección al cambiar de mes
  }

  function pad(n: number) {
    return String(n).padStart(2, "0");
  }

  // Evaluaciones fijadas según tu cronograma del PAT
  const evaluacionesPlanificadas: Evento[] = useMemo(() => {
    return [
      { fecha: "2026-02-18", titulo: "Inicio de trimestre", tipo: "general" },
      {
        fecha: "2026-02-27",
        titulo: "Evaluación del bloque",
        tipo: "evaluacion",
        campoEvaluacion: "Cosmos y Pensamiento",
      },
      {
        fecha: "2026-03-06",
        titulo: "Evaluación del bloque",
        tipo: "evaluacion",
        campoEvaluacion: "Comunidad y Sociedad",
      },
      {
        fecha: "2026-03-13",
        titulo: "Evaluación del bloque",
        tipo: "evaluacion",
        campoEvaluacion: "Vida Tierra Territorio",
      },
      { fecha: "2026-03-18", titulo: "Cierre de trimestre", tipo: "general" },
    ];
  }, [planEstructurado]);

  const todosLosEventos = useMemo(() => {
    return [...eventosInstitucionales, ...evaluacionesPlanificadas];
  }, [eventosInstitucionales, evaluacionesPlanificadas]);

  const eventosMes = todosLosEventos.filter((e) => {
    if (!e.fecha) return false;
    const [y, m] = e.fecha.split("-");
    return parseInt(y) === anio && parseInt(m) - 1 === mes;
  });

  const mapaEventos: Record<string, Evento[]> = {};
  eventosMes.forEach((e) => {
    if (!mapaEventos[e.fecha]) mapaEventos[e.fecha] = [];
    mapaEventos[e.fecha].push(e);
  });

  const hoyStr = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;

  // Obtener los eventos del día que la maestra tiene seleccionado o bajo el mouse
  const eventosDelDiaSeleccionado = useMemo(() => {
    if (!diaSeleccionado) return [];
    return mapaEventos[diaSeleccionado] ?? [];
  }, [diaSeleccionado, mapaEventos]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm w-full max-w-sm mx-auto font-sans text-[11px]">
      {/* HEADER MINIMALISTA Y PEQUEÑO */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-orange-500" />
          <h2 className="font-black text-gray-800 uppercase tracking-tight text-[10px]">
            Agenda de Evaluaciones
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navMes(-1)}
            className="w-5 h-5 border border-gray-100 rounded-md flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            <ChevronLeft size={11} className="text-gray-500" />
          </button>
          <span className="font-black text-gray-700 min-w-[85px] text-center text-[10px] uppercase tracking-tight">
            {MESES[mes]} {anio}
          </span>
          <button
            onClick={() => navMes(1)}
            className="w-5 h-5 border border-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            <ChevronRight size={11} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-2.5">
        {/* DIAS DE LA SEMANA */}
        <div className="grid grid-cols-7 mb-1 text-center">
          {DIAS.map((d) => (
            <div
              key={d}
              className="text-[9px] font-black text-gray-300 uppercase tracking-wider py-0.5"
            >
              {d}
            </div>
          ))}
        </div>

        {/* CELDAS REDUCIDAS (Formato de cuadrícula pequeña) */}
        <div className="grid grid-cols-7 gap-1">
          {/* Vacíos */}
          {Array.from({ length: inicioDia }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="h-9 w-9 mx-auto bg-gray-50/20 rounded-lg"
            />
          ))}

          {/* Días reales */}
          {Array.from({ length: diasEnMes }).map((_, i) => {
            const dia = i + 1;
            const fechaStr = `${anio}-${pad(mes + 1)}-${pad(dia)}`;
            const evs = mapaEventos[fechaStr] ?? [];
            const esHoy = fechaStr === hoyStr;
            const esSeleccionado = fechaStr === diaSeleccionado;

            const tieneEval = evs.some((e) => e.tipo === "evaluacion");
            const tieneGeneral = evs.some((e) => e.tipo === "general");

            // Configuración dinámica de colores compactos
            let cellStyle = "bg-transparent text-gray-600 hover:bg-gray-50";

            if (esSeleccionado) {
              cellStyle = "bg-slate-900 text-white font-black";
            } else if (tieneEval) {
              cellStyle =
                "bg-red-500 text-white font-black shadow-sm shadow-red-100 animate-pulse";
            } else if (tieneGeneral) {
              cellStyle = "bg-slate-700 text-white font-black";
            } else if (esHoy) {
              cellStyle =
                "border border-orange-500 text-orange-600 bg-orange-50/30 font-black";
            }

            return (
              <button
                key={dia}
                onClick={() =>
                  setDiaSeleccionado(esSeleccionado ? null : fechaStr)
                }
                onMouseEnter={() => setDiaSeleccionado(fechaStr)} // Soporte para pasar el mouse en PC
                className={`h-9 w-9 mx-auto rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-100 ${cellStyle}`}
              >
                {dia}
              </button>
            );
          })}
        </div>

        {/* ── 🌟 CONTENEDOR DETALLE DINÁMICO (RESPONSIVO ABAJO) ── */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 min-h-[45px]">
          {diaSeleccionado && eventosDelDiaSeleccionado.length > 0 ? (
            <div className="space-y-1">
              {eventosDelDiaSeleccionado.map((ev, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border flex items-start gap-2 ${
                    ev.tipo === "evaluacion"
                      ? "bg-red-50 border-red-100 text-red-900"
                      : "bg-gray-50 border-gray-100 text-gray-800"
                  }`}
                >
                  {ev.tipo === "evaluacion" ? (
                    <AlertCircle
                      size={14}
                      className="text-red-500 shrink-0 mt-0.5"
                    />
                  ) : (
                    <Info size={14} className="text-gray-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-tight">
                    <p className="font-black text-[10px] uppercase tracking-wide">
                      {ev.tipo === "evaluacion"
                        ? "🚨 Control de Evaluación"
                        : ev.titulo}
                    </p>
                    {ev.campoEvaluacion && (
                      <p className="text-xs font-black mt-0.5 text-red-700">
                        {ev.campoEvaluacion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center text-gray-400 py-1 gap-1 text-[10px] font-bold">
              <Info size={12} />
              <span>Toca o pasa el mouse por un día marcado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

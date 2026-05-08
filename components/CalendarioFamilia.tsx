"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Bell } from "lucide-react";

type Evento = {
  fecha: string;
  titulo: string;
  tipo: "actividad" | "aviso";
  hijoNombre?: string;
};

export default function CalendarioFamilia({ eventos }: { eventos: Evento[] }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
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
    setDiaSeleccionado(null);
  }

  function padFecha(n: number) {
    return String(n).padStart(2, "0");
  }

  const eventosMes = eventos.filter((e) => {
    if (!e.fecha) return false;
    const [y, m] = e.fecha.split("-");
    return parseInt(y) === anio && parseInt(m) - 1 === mes;
  });

  const mapaEventos: Record<string, Evento[]> = {};
  eventosMes.forEach((e) => {
    if (!mapaEventos[e.fecha]) mapaEventos[e.fecha] = [];
    mapaEventos[e.fecha].push(e);
  });

  // Fecha de hoy formateada correctamente para comparar
  const hoyStr = `${hoy.getFullYear()}-${padFecha(hoy.getMonth() + 1)}-${padFecha(hoy.getDate())}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm font-mono text-[11px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-orange-500" />
          <h2 className="font-black text-gray-900 uppercase tracking-tighter">
            Calendario
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navMes(-1)}
            className="w-6 h-6 hover:bg-gray-100 rounded-md flex items-center justify-center transition-all"
          >
            <ChevronLeft size={12} />
          </button>
          <span className="font-black text-gray-700 min-w-[90px] text-center uppercase tracking-tighter">
            {MESES[mes]} {anio}
          </span>
          <button
            onClick={() => navMes(1)}
            className="w-6 h-6 hover:bg-gray-100 rounded-md flex items-center justify-center transition-all"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-7 mb-2">
          {DIAS.map((d) => (
            <div
              key={d}
              className="text-center font-black text-gray-300 py-1 uppercase"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1.5">
          {Array.from({ length: inicioDia }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: diasEnMes }).map((_, i) => {
            const dia = i + 1;
            const fechaStr = `${anio}-${padFecha(mes + 1)}-${padFecha(dia)}`;
            const evs = mapaEventos[fechaStr] ?? [];
            const tieneActividad = evs.some((e) => e.tipo === "actividad");
            const tieneAviso = evs.some((e) => e.tipo === "aviso");
            const esHoy = fechaStr === hoyStr;
            const seleccionado = fechaStr === diaSeleccionado;

            // ── LÓGICA DE ESTILOS CUADRADOS Y MARCADOS ──
            let circleClass = "bg-transparent";
            let textClass = "text-gray-600";
            let ringClass = "border-transparent";

            if (seleccionado) {
              circleClass = "bg-slate-900";
              textClass = "text-white";
            } else if (tieneActividad) {
              circleClass = "bg-emerald-500";
              textClass = "text-white";
            } else if (tieneAviso) {
              circleClass = "bg-sky-500";
              textClass = "text-white";
            }

            // El "HOY" siempre lleva un anillo naranja exterior
            if (esHoy) {
              ringClass = "border-orange-500 border-2 ring-2 ring-orange-200";
              if (!tieneActividad && !tieneAviso && !seleccionado) {
                textClass = "text-orange-600";
              }
            }

            return (
              <button
                key={dia}
                onClick={() =>
                  setDiaSeleccionado(seleccionado ? null : fechaStr)
                }
                className="flex items-center justify-center"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${circleClass} ${ringClass}`}
                >
                  <span className={`font-black ${textClass}`}>{dia}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Leyenda minimalista */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-emerald-500" />
            <span className="text-[9px] font-black text-gray-400 uppercase">
              Actividad
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-sky-500" />
            <span className="text-[9px] font-black text-gray-400 uppercase">
              Aviso
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm border-2 border-orange-500" />
            <span className="text-[9px] font-black text-gray-400 uppercase">
              Hoy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

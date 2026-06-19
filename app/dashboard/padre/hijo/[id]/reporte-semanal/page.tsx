"use client";

import React from "react";
import {
  BookOpen,
  Heart,
  Leaf,
  Lightbulb,
  Calendar,
  FileText,
  User,
} from "lucide-react";

interface ReporteSemanalPadresProps {
  nombreAlumno: string;
  semana: number;
  trimestre: number;
  evaluacionesCampos: {
    campo: "Cosmos" | "Comunidad" | "Vida" | "Tecnología";
    nota_ser: number;
    nota_saber: number;
    nota_hacer: number;
    observacion: string;
  }[];
}

export default function ReporteSemanalPadres({
  nombreAlumno,
  semana,
  trimestre,
  evaluacionesCampos = [],
}: ReporteSemanalPadresProps) {
  // Función idéntica a tu escala de negocio para mantener consistencia
  const obtenerEscalaCualitativa = (notaFinal: number) => {
    if (notaFinal === 0)
      return {
        label: "Sin evaluar",
        color: "bg-gray-100 text-gray-500",
        barColor: "bg-gray-300",
      };
    if (notaFinal <= 42)
      return {
        label: "En Desarrollo (ED)",
        color: "bg-red-50 text-red-700 border-red-100",
        barColor: "bg-red-500",
      };
    if (notaFinal <= 58)
      return {
        label: "Desarrollo Aceptable (DA)",
        color: "bg-amber-50 text-amber-700 border-amber-100",
        barColor: "bg-amber-500",
      };
    if (notaFinal <= 72)
      return {
        label: "Desarrollo Óptimo (DO)",
        color: "bg-indigo-50 text-indigo-700 border-indigo-100",
        barColor: "bg-indigo-500",
      };
    return {
      label: "Desarrollo Pleno (DP)",
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      barColor: "bg-emerald-500",
    };
  };

  // ====== REEMPLAZA ESTE BLOQUE EN TU ARCHIVO ======
  const iconosCampos = {
    Cosmos: {
      icon: BookOpen,
      color: "text-orange-500",
      bg: "bg-orange-50",
      barColor: "bg-orange-500",
    },
    Comunidad: {
      icon: Heart,
      color: "text-violet-500",
      bg: "bg-violet-50",
      barColor: "bg-violet-500",
    },
    Vida: {
      icon: Leaf,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      barColor: "bg-emerald-500",
    },
    Tecnología: {
      icon: Lightbulb,
      color: "text-sky-500",
      bg: "bg-sky-50",
      barColor: "bg-sky-500",
    },
  };
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-slate-50/50 min-h-screen text-xs font-sans">
      {/* ENCABEZADO REPORTE DE FAMILIA */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-black shadow-md shadow-orange-500/20 text-sm">
              {nombreAlumno?.[0] || "A"}
            </div>
            <div>
              <span className="text-[9px] uppercase font-black text-orange-500 tracking-wider block">
                Informe de Seguimiento Escolar
              </span>
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">
                {nombreAlumno}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl font-bold text-gray-600">
            <Calendar size={14} className="text-gray-400" />
            <span>
              {trimestre}º Trimestre — Semana {semana}
            </span>
          </div>
        </div>
      </div>

      {/* RECORRIDO DE LOS CAMPOS EVALUADOS */}
      <div className="space-y-4">
        {evaluacionesCampos.map((evaluacion) => {
          const config = iconosCampos[evaluacion.campo] || iconosCampos.Cosmos;
          const Icono = config.icon;
          const notaFinal =
            evaluacion.nota_ser + evaluacion.nota_saber + evaluacion.nota_hacer;
          const escala = obtenerEscalaCualitativa(notaFinal);

          return (
            <div
              key={evaluacion.campo}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all"
            >
              {/* Encabezado del Campo */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 ${config.bg} ${config.color} rounded-xl flex items-center justify-center shadow-xs`}
                  >
                    <Icono size={16} />
                  </div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">
                    Campo: {evaluacion.campo}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wide border uppercase ${escala.color}`}
                >
                  {escala.label}
                </span>
              </div>

              {/* Visualización de Dimensiones (Simplificada para padres) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="space-y-2 md:col-span-2">
                  {/* Barra de progreso unificada de los 85 puntos */}
                  <div>
                    <div className="flex justify-between font-bold text-gray-500 mb-1 text-[10px]">
                      <span>Logro de Aprendizajes Semanal</span>
                      <span className="font-mono font-black text-gray-700">
                        {notaFinal} / 85 pts
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${config.barColor} transition-all duration-500`}
                        style={{ width: `${(notaFinal / 85) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Micro desglose para transparencia técnica */}
                  <div className="flex gap-4 text-[9px] font-bold text-gray-400 font-mono pt-1">
                    <span>
                      SER:{" "}
                      <strong className="text-gray-600">
                        {evaluacion.nota_ser}/10
                      </strong>
                    </span>
                    <span>
                      SABER:{" "}
                      <strong className="text-gray-600">
                        {evaluacion.nota_saber}/45
                      </strong>
                    </span>
                    <span>
                      HACER:{" "}
                      <strong className="text-gray-600">
                        {evaluacion.nota_hacer}/40
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Comentario Cualitativo Pedagógico */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl md:col-span-1 h-full flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] uppercase font-black text-gray-400 block tracking-widest mb-1">
                      Nota Pedagógica de la Maestra:
                    </span>
                    <p className="text-[10px] font-medium text-gray-600 italic leading-normal">
                      {evaluacion.observacion
                        ? `"${evaluacion.observacion}"`
                        : "Sin comentarios específicos registrados esta semana."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

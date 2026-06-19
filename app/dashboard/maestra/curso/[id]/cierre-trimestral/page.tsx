"use client";

import React, { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  Download,
  Users,
  Calculator,
  FileCheck,
  Loader2,
} from "lucide-react";

interface RegistroSemanal {
  alumno_id: string;
  contenido_id: number; // 1=cosmos, 2=comunidad, 3=vida, 4=tecnologia
  nota_ser: number;
  nota_saber: number;
  nota_hacer: number;
}

interface Alumno {
  id: string;
  nombre: string;
  apellido: string;
}

interface ConsolidacionTrimestralProps {
  cursoId: string;
  trimestreActivo: number;
  gestionActiva: number;
  alumnos: Alumno[];
  evaluacionesSemanalesCargadas: RegistroSemanal[];
}

export default function ConsolidacionTrimestral({
  cursoId,
  trimestreActivo,
  gestionActiva,
  alumnos = [],
  evaluacionesSemanalesCargadas = [],
}: ConsolidacionTrimestralProps) {
  const supabase = createClient();
  const [procesando, setProcesando] = useState(false);
  const [completado, setCompletado] = useState(false);

  // MOTOR PROMEDIADOR CENTRALIZADO
  const libretaConsolidada = useMemo(() => {
    return alumnos.map((alumno) => {
      // Filtrar todas las semanas de este alumno en este trimestre
      const notasAlumno = evaluacionesSemanalesCargadas.filter(
        (e) => e.alumno_id === alumno.id,
      );

      const calcularPromedioPorCampo = (campoId: number) => {
        const registrosCampo = notasAlumno.filter(
          (e) => e.contenido_id === campoId,
        );
        const semanasEvaluadas = registrosCampo.length;

        if (semanasEvaluadas === 0)
          return { ser: 0, saber: 0, hacer: 0, total: 0 };

        const sumaSer = registrosCampo.reduce(
          (acc, curr) => acc + curr.nota_ser,
          0,
        );
        const sumaSaber = registrosCampo.reduce(
          (acc, curr) => acc + curr.nota_saber,
          0,
        );
        const sumaHacer = registrosCampo.reduce(
          (acc, curr) => acc + curr.nota_hacer,
          0,
        );

        // Promedios redondeados según normativa ministerial boliviana
        const promeSer = Math.round(sumaSer / semanasEvaluadas);
        const promeSaber = Math.round(sumaSaber / semanasEvaluadas);
        const promeHacer = Math.round(sumaHacer / semanasEvaluadas);

        return {
          ser: promeSer,
          saber: promeSaber,
          hacer: promeHacer,
          total: promeSer + promeSaber + promeHacer,
        };
      };

      const cosmos = calcularPromedioPorCampo(1);
      const comunidad = calcularPromedioPorCampo(2);
      const vida = calcularPromedioPorCampo(3);
      const tecnologia = calcularPromedioPorCampo(4);

      return {
        id: alumno.id,
        nombreCompleto: `${alumno.nombre} ${alumno.apellido}`,
        campos: { cosmos, comunidad, vida, tecnologia },
      };
    });
  }, [alumnos, evaluacionesSemanalesCargadas]);

  // GUARDAR CIERRE TRIMESTRAL EN SUPABASE
  const handleGuardarCierreTrimestral = async () => {
    setProcesando(true);
    try {
      // Armamos el batch para una tabla central de centralizadores trimestrales
      const registrosCierre = libretaConsolidada.flatMap((al) =>
        [1, 2, 3, 4].map((campoId) => {
          const mapeoCampos = {
            1: "cosmos",
            2: "comunidad",
            3: "vida",
            4: "tecnologia",
          } as const;
          const datosCampo = al.campos[mapeoCampos[campoId as 1 | 2 | 3 | 4]];

          return {
            alumno_id: al.id,
            curso_id: cursoId,
            trimestre: trimestreActivo,
            gestion: gestionActiva,
            campo_id: campoId,
            nota_trimestral_ser: datosCampo.ser,
            nota_trimestral_saber: datosCampo.saber,
            nota_trimestral_hacer: datosCampo.hacer,
            nota_trimestral_final: datosCampo.total,
          };
        }),
      );

      const { error } = await supabase
        .from("calificaciones_trimestrales")
        .upsert(registrosCierre, {
          onConflict: "alumno_id,trimestre,campo_id,gestion",
        });

      if (error) throw error;
      setCompletado(true);
    } catch (err) {
      console.error(
        "Error al procesar el cierre trimestral administrativo:",
        err,
      );
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden text-xs font-sans">
      {/* HEADER DEL CONSOLIDADOR */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator size={16} className="text-slate-700" />
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">
              Centralizador y Cierre del {trimestreActivo}º Trimestre
            </h2>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
            Automatización de promedios ponderados sobre 100 puntos totales
          </p>
        </div>
        <button
          onClick={handleGuardarCierreTrimestral}
          disabled={procesando || completado}
          className="bg-slate-900 hover:bg-slate-800 disabled:bg-emerald-500 text-white font-black uppercase tracking-wider px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-sm transition-all text-[10px]"
        >
          {procesando ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Procesando
              Históricos...
            </>
          ) : completado ? (
            <>
              <ShieldCheck size={13} /> Notas Centralizadas con Éxito
            </>
          ) : (
            <>
              <FileCheck size={13} /> Cerrar Trimestre y Guardar Centralizador
            </>
          )}
        </button>
      </div>

      {/* TABLA EXCLUSIVA PARA EL CONTROL CENTRAL DE LA MAESTRA */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-wider font-mono divide-x divide-slate-800">
              <th className="px-4 py-3 min-w-[180px]">Nómina del Alumno</th>
              <th className="px-3 py-3 text-center bg-orange-600">
                Cosmos (100)
              </th>
              <th className="px-3 py-3 text-center bg-violet-600">
                Comunidad (100)
              </th>
              <th className="px-3 py-3 text-center bg-emerald-600">
                Vida (100)
              </th>
              <th className="px-3 py-3 text-center bg-sky-600">
                Tecnología (100)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
            {libretaConsolidada.map((alumno) => (
              <tr
                key={alumno.id}
                className="hover:bg-slate-50/50 transition-colors divide-x divide-gray-50"
              >
                <td className="px-4 py-3 text-gray-900 font-black truncate">
                  {alumno.nombreCompleto}
                </td>

                {/* Cosmos */}
                <td className="px-3 py-3 text-center font-mono">
                  <span className="text-gray-900 text-xs font-black">
                    {alumno.campos.cosmos.total}
                  </span>
                  <div className="text-[8px] text-gray-400 mt-0.5 font-sans">
                    S:{alumno.campos.cosmos.ser} | S:
                    {alumno.campos.cosmos.saber} | H:
                    {alumno.campos.cosmos.hacer}
                  </div>
                </td>

                {/* Comunidad */}
                <td className="px-3 py-3 text-center font-mono">
                  <span className="text-gray-900 text-xs font-black">
                    {alumno.campos.comunidad.total}
                  </span>
                  <div className="text-[8px] text-gray-400 mt-0.5 font-sans">
                    S:{alumno.campos.comunidad.ser} | S:
                    {alumno.campos.comunidad.saber} | H:
                    {alumno.campos.comunidad.hacer}
                  </div>
                </td>

                {/* Vida Tierra */}
                <td className="px-3 py-3 text-center font-mono">
                  <span className="text-gray-900 text-xs font-black">
                    {alumno.campos.vida.total}
                  </span>
                  <div className="text-[8px] text-gray-400 mt-0.5 font-sans">
                    S:{alumno.campos.vida.ser} | S:{alumno.campos.vida.saber} |
                    H:{alumno.campos.vida.hacer}
                  </div>
                </td>

                {/* Tecnología */}
                <td className="px-3 py-3 text-center font-mono">
                  <span className="text-gray-900 text-xs font-black">
                    {alumno.campos.tecnologia.total}
                  </span>
                  <div className="text-[8px] text-gray-400 mt-0.5 font-sans">
                    S:{alumno.campos.tecnologia.ser} | S:
                    {alumno.campos.tecnologia.saber} | H:
                    {alumno.campos.tecnologia.hacer}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

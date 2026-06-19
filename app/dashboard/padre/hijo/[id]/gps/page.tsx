"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Clock,
  User,
  Bell,
  BellOff,
  Loader2,
  Activity,
  Square,
  ShieldAlert,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Navigation,
  Calendar,
} from "lucide-react";
import dynamic from "next/dynamic";

const MapaRecogida = dynamic(() => import("./MapaRecogida"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <Loader2 size={24} className="text-gray-400 animate-spin" />
    </div>
  ),
});

type Ubicacion = { lat: number; lng: number; created_at: string };

type PlanRecogidaItem = {
  id: string;
  recolector_nombre: string | null;
  recolector_email: string | null;
  estado_aprobacion: string;
  activo: boolean;
  finalizado_at: string | null;
  created_at: string;
  recorrido_gps_historial: any;
};

export default function GpsPage() {
  const params = useParams();
  const id = params.id as string; // ID del alumno
  const supabase = createClient();

  const [alumnoNombre, setAlumnoNombre] = useState("");
  const [nueva, setNueva] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [recogidaActiva, setRecogidaActiva] = useState<PlanRecogidaItem | null>(
    null,
  );
  const [historialPlanes, setHistorialPlanes] = useState<PlanRecogidaItem[]>(
    [],
  );
  const [planSeleccionadoId, setPlanSeleccionadoId] = useState<string | null>(
    null,
  );

  const [segundosUltimoPing, setSegundosUltimoPing] = useState<number>(0);
  const [votando, setVotando] = useState(false);

  // Parseador de coordenadas JSONB a formato del Mapa
  const parsearHistorialGps = (historialJson: any): Ubicacion[] => {
    return Array.isArray(historialJson)
      ? historialJson.map((p: any) => ({
          lat: Number(p.lat),
          lng: Number(p.lng),
          created_at: p.time || new Date().toISOString(),
        }))
      : [];
  };

  const cargarDatos = useCallback(async () => {
    // 1. Cargar nombre del alumno
    const { data: alumno } = await supabase
      .from("alumnos")
      .select("nombre, apellido")
      .eq("id", id)
      .single();
    setAlumnoNombre(`${alumno?.nombre} ${alumno?.apellido}`);

    // 2. Cargar TODOS los planes de recogida de este alumno (activos e históricos de la nueva tabla)
    const { data: planes } = await supabase
      .from("plan_recogida")
      .select(
        "id, activo, estado_aprobacion, recolector_nombre, recolector_email, recorrido_gps_historial, created_at, updated_at",
      )
      .eq("alumno_id", id)
      .order("created_at", { ascending: false });

    const listaPlanes: PlanRecogidaItem[] = (planes ?? []).map((p) => ({
      id: p.id,
      recolector_nombre: p.recolector_nombre,
      recolector_email: p.recolector_email,
      estado_aprobacion: p.estado_aprobacion,
      activo: p.activo,
      finalizado_at: p.updated_at,
      created_at: p.created_at,
      recorrido_gps_historial: p.recorrido_gps_historial,
    }));

    // Separamos el plan que está activo hoy para el monitoreo inmediato
    const activo = listaPlanes.find(
      (p) => p.activo && p.estado_aprobacion !== "rechazado",
    );
    const historicos = listaPlanes.filter(
      (p) => !p.activo && p.estado_aprobacion === "aprobado",
    );

    setHistorialPlanes(historicos);
    setRecogidaActiva(activo ?? null);

    // CONTROL DEL MAPA:
    // Si el papá hizo clic en un registro del historial, mostramos esa ruta guardada.
    // Si no ha hecho clic en nada, pero hay un viaje en curso activo, mostramos el viaje activo.
    if (planSeleccionadoId) {
      const seleccionado = listaPlanes.find((p) => p.id === planSeleccionadoId);
      if (seleccionado) {
        setUbicaciones(
          parsearHistorialGps(seleccionado.recorrido_gps_historial),
        );
        return;
      }
    }

    if (activo) {
      setUbicaciones(parsearHistorialGps(activo.recorrido_gps_historial));
    } else {
      setUbicaciones([]);
    }
  }, [id, planSeleccionadoId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Realtime escuchando cambios en la tabla única plan_recogida
  useEffect(() => {
    const ch = supabase
      .channel(`padre-gps-realtime-v2-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "plan_recogida",
          filter: `alumno_id=eq.${id}`,
        },
        (payload) => {
          // Si hay una inserción o actualización, disparamos la alerta de cambio y refrescamos
          if (payload.eventType === "INSERT") {
            setNueva(true);
            setTimeout(() => setNueva(false), 8000);
          }
          cargarDatos();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, cargarDatos]);

  // Contador de latencia del último ping
  useEffect(() => {
    if (
      !recogidaActiva?.finalizado_at ||
      recogidaActiva.estado_aprobacion !== "aprobado"
    )
      return;
    const i = setInterval(() => {
      const s = Math.floor(
        (Date.now() - new Date(recogidaActiva.finalizado_at!).getTime()) / 1000,
      );
      setSegundosUltimoPing(s < 0 ? 0 : s);
    }, 1000);
    return () => clearInterval(i);
  }, [recogidaActiva?.finalizado_at, recogidaActiva?.estado_aprobacion]);

  async function resolverSolicitud(accion: "aprobado" | "rechazado") {
    if (!recogidaActiva) return;
    setVotando(true);
    await supabase
      .from("plan_recogida")
      .update({
        estado_aprobacion: accion,
        activo: accion === "aprobado" ? true : false,
      })
      .eq("id", recogidaActiva.id);

    setVotando(false);
    await cargarDatos();
  }

  const enVivo =
    recogidaActiva &&
    recogidaActiva.estado_aprobacion === "aprobado" &&
    segundosUltimoPing < 30;
  const mirandoHistorial = !!planSeleccionadoId;

  return (
    <main className="min-w-0 font-nunito bg-slate-50/30 min-h-screen text-xs">
      {/* BARRA SUPERIOR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/padre/hijo/${id}`}
            className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div>
            <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest">
              {alumnoNombre}
            </p>
            <h1 className="text-sm font-black text-gray-900 leading-tight">
              Centro de Control y Monitoreo
            </h1>
          </div>
        </div>
        <div className="relative">
          <Bell
            size={18}
            className={
              nueva ? "text-orange-500 animate-bounce" : "text-gray-400"
            }
          />
        </div>
      </div>

      {/* CANDADO INTERMEDIO: EN ESPERA DE APROBACIÓN */}
      {recogidaActiva &&
        recogidaActiva.estado_aprobacion === "esperando_aprobacion" && (
          <div className="mx-4 lg:mx-7 mt-5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 border border-orange-400">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-white animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-widest bg-white/20 px-2 py-0.5 rounded-md">
                  Verificación Requerida
                </span>
              </div>
              <h2 className="text-base font-black tracking-tight uppercase">
                ¿Autorizas que retiren a tu hijo?
              </h2>
              <div className="bg-white/10 border border-white/10 p-3 rounded-xl text-left font-sans mt-2">
                <p className="text-[11px] font-black">
                  {recogidaActiva.recolector_nombre}
                </p>
                <p className="text-[9px] text-orange-200 font-mono tracking-tight">
                  {recogidaActiva.recolector_email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-stretch md:self-center">
              <button
                disabled={votando}
                onClick={() => resolverSolicitud("rechazado")}
                className="flex-1 md:flex-initial bg-white/10 border border-white/20 px-4 py-3 rounded-xl font-black uppercase text-[10px]"
              >
                Denegar Permiso
              </button>
              <button
                disabled={votando}
                onClick={() => resolverSolicitud("aprobado")}
                className="flex-1 md:flex-initial bg-white text-orange-600 px-5 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg"
              >
                Autorizar Entrega
              </button>
            </div>
          </div>
        )}

      {/* CUERPO CENTRAL */}
      <div className="px-4 lg:px-7 pt-5 pb-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA MAPA */}
          <div className="lg:col-span-2 space-y-4">
            {(recogidaActiva &&
              recogidaActiva.estado_aprobacion === "aprobado") ||
            mirandoHistorial ? (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
                {/* Info dinámico de barra de mapa */}
                <div
                  className={`px-4 py-2.5 flex items-center justify-between border-b ${mirandoHistorial ? "bg-slate-900 text-white" : enVivo ? "bg-orange-50 border-orange-100 text-orange-800" : "bg-slate-50 border-gray-100 text-gray-500"}`}
                >
                  <div className="flex items-center gap-2 font-black">
                    {mirandoHistorial ? (
                      <>
                        <Navigation
                          size={12}
                          className="text-orange-400 rotate-45 animate-pulse"
                        />
                        <span>Visualizando Ruta Histórica</span>
                      </>
                    ) : enVivo ? (
                      <>
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        <span>Trayecto en curso (Gps Activo)</span>
                      </>
                    ) : (
                      <span>Señal en pausa</span>
                    )}
                  </div>
                  {mirandoHistorial && (
                    <button
                      onClick={() => setPlanSeleccionadoId(null)}
                      className="bg-white/20 hover:bg-white/30 text-white font-black text-[9px] px-2 py-0.5 rounded-lg uppercase transition-all"
                    >
                      Volver al presente
                    </button>
                  )}
                </div>

                {/* Renderizado de Mapa */}
                <div className="h-80 lg:h-96 bg-gray-50 relative">
                  {ubicaciones.length > 0 ? (
                    <MapaRecogida ubicaciones={ubicaciones} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-gray-400">
                      <Loader2
                        size={20}
                        className="animate-spin text-orange-400 mb-1"
                      />
                      <p className="font-bold">Generando trazo en el mapa...</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center font-black text-xs uppercase">
                      <MapPin size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Puntos de geolocalización indexados:
                      </p>
                      <p className="text-gray-900 font-black text-xs">
                        {ubicaciones.length} coordenadas en este trayecto
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 border-dashed p-12 text-center flex flex-col items-center justify-center min-h-[340px] text-gray-400">
                <MapPin size={26} className="text-orange-300 mb-2" />
                <h3 className="font-black text-gray-700 text-sm">
                  Sin rastreo activo en este momento
                </h3>
                <p className="text-[11px] text-gray-400 max-w-xs mt-1">
                  Toca cualquier registro en tu historial de abajo para cargar y
                  revisar el trayecto GPS exacto que se completó ese día.
                </p>
              </div>
            )}
          </div>

          {/* COLUMNA INTERACTIVA DEL HISTORIAL */}
          <div className="lg:col-span-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Historial con Trazado GPS ({historialPlanes.length})
            </p>
            {historialPlanes.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-gray-400">
                <BellOff size={16} className="mx-auto mb-1 text-gray-300" />
                <p className="font-bold">Ningún viaje histórico guardado</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {historialPlanes.map((plan) => {
                  const esElSeleccionado = planSeleccionadoId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() =>
                        setPlanSeleccionadoId(esElSeleccionado ? null : plan.id)
                      }
                      className={`w-full bg-white border rounded-xl p-3 flex items-start gap-3 text-left transition-all hover:border-orange-200 active:scale-98 ${esElSeleccionado ? "border-orange-500 ring-2 ring-orange-100" : "border-gray-100"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${esElSeleccionado ? "bg-orange-500 text-white" : "bg-emerald-50 text-emerald-600"}`}
                      >
                        {esElSeleccionado ? (
                          <Navigation size={14} className="rotate-45" />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="font-black text-gray-800 text-xs truncate uppercase">
                          {plan.recolector_nombre}
                        </p>
                        <div className="flex items-center gap-1 text-gray-400 font-medium font-mono text-[9px]">
                          <Calendar size={9} />
                          <span>
                            {new Date(plan.created_at).toLocaleString("es-BO", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-[9px] text-orange-500 font-black pt-1 block uppercase">
                          ➡️ Ver trazado de ruta
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

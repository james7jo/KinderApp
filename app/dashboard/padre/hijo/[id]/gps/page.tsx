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

type Notif = {
  id: string;
  nombre_recogedor: string;
  correo_recogedor: string;
  latitud: number | null;
  longitud: number | null;
  recogido_at: string;
};

type Ubicacion = { lat: number; lng: number; created_at: string };

type PlanRecogidaActivo = {
  id: string;
  nombre_recogedor: string;
  correo_recogedor: string;
  recolector_nombre: string | null;
  recolector_email: string | null;
  estado_aprobacion:
    | "pendiente"
    | "esperando_aprobacion"
    | "aprobado"
    | "rechazado";
  escaneado_at: string | null;
  activo: boolean;
  ultimo_ping: string | null;
};

export default function GpsPage() {
  const params = useParams();
  const id = params.id as string; // ID del alumno
  const supabase = createClient();

  const [alumnoNombre, setAlumnoNombre] = useState("");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [nueva, setNueva] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [recogida, setRecogida] = useState<PlanRecogidaActivo | null>(null);
  const [segundosUltimoPing, setSegundosUltimoPing] = useState<number>(0);
  const [votando, setVotando] = useState(false);

  // Cargar datos iniciales desde 'plan_recogida'
  const cargar = useCallback(async () => {
    const [{ data: alumno }, { data: notifsData }] = await Promise.all([
      supabase.from("alumnos").select("nombre, apellido").eq("id", id).single(),
      supabase
        .from("notificaciones_recogida")
        .select("*")
        .eq("alumno_id", id)
        .order("recogido_at", { ascending: false })
        .limit(20),
    ]);
    setAlumnoNombre(`${alumno?.nombre} ${alumno?.apellido}`);
    setNotifs(notifsData ?? []);

    const hoy = new Date().toISOString().split("T")[0];
    const { data: rec } = await supabase
      .from("plan_recogida")
      .select(
        "id, token, activo, estado_aprobacion, recolector_nombre, recolector_email, escaneado_at, recorrido_gps_historial, updated_at",
      )
      .eq("alumno_id", id)
      .eq("activo", true)
      .gte("created_at", hoy + "T00:00:00")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rec) {
      setRecogida({
        id: rec.id,
        nombre_recogedor: rec.recolector_nombre ?? "Externo por escanear",
        correo_recogedor: rec.recolector_email ?? "",
        recolector_nombre: rec.recolector_nombre,
        recolector_email: rec.recolector_email,
        estado_aprobacion: rec.estado_aprobacion as any,
        escaneado_at: rec.escaneado_at,
        activo: rec.activo,
        ultimo_ping: rec.updated_at,
      });

      // El historial de ubicaciones lo parseamos directo desde la columna JSONB
      const historialGps = Array.isArray(rec.recorrido_gps_historial)
        ? rec.recorrido_gps_historial.map((p: any) => ({
            lat: Number(p.lat),
            lng: Number(p.lng),
            created_at: p.time || new Date().toISOString(),
          }))
        : [];
      setUbicaciones(historialGps);
    } else {
      setRecogida(null);
      setUbicaciones([]);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Realtime unificado escuchando 'plan_recogida' y alertas
  useEffect(() => {
    const ch = supabase
      .channel(`padre-gps-realtime-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "plan_recogida",
          filter: `alumno_id=eq.${id}`,
        },
        () => cargar(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones_recogida",
          filter: `alumno_id=eq.${id}`,
        },
        () => {
          setNueva(true);
          cargar();
          setTimeout(() => setNueva(false), 8000);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, cargar]);

  // Contador de latencia del último ping
  useEffect(() => {
    if (!recogida?.ultimo_ping || recogida.estado_aprobacion !== "aprobado")
      return;
    const i = setInterval(() => {
      const s = Math.floor(
        (Date.now() - new Date(recogida.ultimo_ping!).getTime()) / 1000,
      );
      setSegundosUltimoPing(s < 0 ? 0 : s);
    }, 1000);
    return () => clearInterval(i);
  }, [recogida?.ultimo_ping, recogida?.estado_aprobacion]);

  // ====== REEMPLAZA LA FUNCIÓN COMPLETA PARA EVITAR ERRORES ======
  async function resolverSolicitud(accion: "aprobado" | "rechazado") {
    if (!recogida) return;
    setVotando(true);

    await supabase
      .from("plan_recogida")
      .update({
        estado_aprobacion: accion,
        aprobado_at: accion === "aprobado" ? new Date().toISOString() : null,
        activo: accion === "aprobado" ? true : false, // En TypeScript se pone true : false limpio
      })
      .eq("id", recogida.id);

    setVotando(false);
    await cargar();
  }

  const enVivo =
    recogida &&
    recogida.estado_aprobacion === "aprobado" &&
    segundosUltimoPing < 30;
  const perdido =
    recogida &&
    recogida.estado_aprobacion === "aprobado" &&
    segundosUltimoPing >= 30 &&
    segundosUltimoPing < 300;

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
          {nueva && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full" />
          )}
        </div>
      </div>

      {/* 🚨 CANDADO INTERMEDIO: INTERFAZ DE DECISIÓN IMPERATIVA PARA EL PAPÁ */}
      {recogida && recogida.estado_aprobacion === "esperando_aprobacion" && (
        <div className="mx-4 lg:mx-7 mt-5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 animate-fade-in border border-orange-400">
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
            <p className="text-orange-50 text-xs font-medium max-w-xl">
              Alguien escaneó el QR en la puerta del aula. Google identificó al
              recolector como:
            </p>
            <div className="bg-white/10 border border-white/10 p-3 rounded-xl text-left font-sans mt-2">
              <p className="text-[11px] font-black">
                {recogida.recolector_nombre}
              </p>
              <p className="text-[9px] text-orange-200 font-mono tracking-tight">
                {recogida.recolector_email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-center">
            <button
              disabled={votando}
              onClick={() => resolverSolicitud("rechazado")}
              className="flex-1 md:flex-initial bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <ThumbsDown size={13} /> Denegar Permiso
            </button>
            <button
              disabled={votando}
              onClick={() => resolverSolicitud("aprobado")}
              className="flex-1 md:flex-initial bg-white text-orange-600 px-5 py-3 rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95"
            >
              {votando ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ThumbsUp size={13} />
              )}{" "}
              Autorizar Entrega
            </button>
          </div>
        </div>
      )}

      {/* CUERPO DEL DASHBOARD */}
      <div className="px-4 lg:px-7 pt-5 pb-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECCIÓN MAPA */}
          <div className="lg:col-span-2 space-y-4">
            {recogida && recogida.estado_aprobacion === "aprobado" ? (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
                {/* Header dinámico del mapa */}
                <div
                  className={`px-4 py-2.5 flex items-center justify-between border-b ${enVivo ? "bg-orange-50 border-orange-100 text-orange-800" : "bg-slate-50 border-gray-100 text-gray-500"}`}
                >
                  <div className="flex items-center gap-2 font-black">
                    {enVivo ? (
                      <>
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        <span>Trayecto en curso (Gps Activo)</span>
                      </>
                    ) : (
                      <>
                        <Square size={12} className="text-gray-400" />
                        <span>Señal en pausa</span>
                      </>
                    )}
                  </div>
                  {segundosUltimoPing < 300 && (
                    <span className="font-mono text-[10px] opacity-70">
                      Ping: Hace {segundosUltimoPing}s
                    </span>
                  )}
                </div>

                {/* Contenedor del Mapa */}
                <div className="h-80 lg:h-96 bg-gray-50 relative">
                  {ubicaciones.length > 0 ? (
                    <MapaRecogida ubicaciones={ubicaciones} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-gray-400">
                      <Loader2
                        size={20}
                        className="animate-spin text-orange-400 mb-1"
                      />
                      <p className="font-bold">
                        Aprobado. Esperando que salgan del aula...
                      </p>
                    </div>
                  )}
                </div>

                {/* Datos del portador del GPS */}
                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-sm">
                      {recogida.recolector_nombre?.[0] || "U"}
                    </div>
                    <div>
                      <p className="font-black text-gray-900">
                        {recogida.recolector_nombre}
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium font-mono">
                        {recogida.recolector_email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 border-dashed p-12 text-center flex flex-col items-center justify-center min-h-[340px] text-gray-400">
                <MapPin
                  size={26}
                  className="text-orange-300 mb-2 animate-bounce"
                />
                <h3 className="font-black text-gray-700 text-sm">
                  Sin rastreo activo en este momento
                </h3>
                <p className="text-[11px] text-gray-400 max-w-xs mt-1 leading-normal">
                  Cuando la maestra genere un código QR y este sea verificado y
                  aprobado, podrás visualizar la ruta GPS aquí en tiempo real.
                </p>
              </div>
            )}
          </div>

          {/* SECCIÓN HISTORIAL */}
          <div className="lg:col-span-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Historial de Entregas Recientes
            </p>
            {notifs.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-gray-400">
                <BellOff size={16} className="mx-auto mb-1 text-gray-300" />
                <p className="font-bold">Ninguna salida reportada</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {notifs.map((n) => (
                  <div
                    key={n.id}
                    className="bg-white border border-gray-100 rounded-xl p-3 flex items-start gap-3 shadow-2xs"
                  >
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle2 size={15} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="font-black text-gray-800 text-xs truncate uppercase">
                        {n.nombre_recogedor}
                      </p>
                      <div className="flex items-center gap-1 text-gray-400 font-medium font-mono text-[9px]">
                        <Clock size={10} />
                        <span>
                          {new Date(n.recogido_at).toLocaleString("es-BO", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

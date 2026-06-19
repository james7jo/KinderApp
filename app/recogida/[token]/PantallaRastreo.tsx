"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  Loader2,
} from "lucide-react";

type Props = {
  recogidaId: string;
  token: string;
  alumno: any;
  usuario: any;
};

export default function PantallaRastreo({
  recogidaId,
  token,
  alumno,
  usuario,
}: Props) {
  const supabase = createClient();
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const ultimoEnvioRef = useRef<number>(0);

  const [puntosEnviados, setPuntosEnviados] = useState(0);
  const [ultimaPos, setUltimaPos] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [tiempoActivo, setTiempoActivo] = useState(0);
  const [conectado, setConectado] = useState(true);
  const [pausado, setPausado] = useState(false);
  const [error, setError] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const [finalizado, setFinalizado] = useState(false);

  // Wake Lock — Pantalla siempre activa
  useEffect(() => {
    async function pedirWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request(
            "screen",
          );
        }
      } catch (e) {
        console.warn("Wake Lock no disponible");
      }
    }
    pedirWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current)
        pedirWakeLock();
      setPausado(document.visibilityState === "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release();
    };
  }, []);

  useEffect(() => {
    if (finalizado) return;
    const i = setInterval(() => setTiempoActivo((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [finalizado]);

  useEffect(() => {
    const handleOnline = () => setConectado(true);
    const handleOffline = () => setConectado(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setConectado(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // WATCH POSITION: PING CONTINUO DIRECTO AL JSONB DE 'PLAN_RECOGIDA'
  useEffect(() => {
    if (finalizado) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    if (!navigator.geolocation) {
      setError("GPS no disponible");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const ahora = Date.now();
        // Envío optimizado cada 5 segundos para cuidar rendimiento y batería
        if (ahora - ultimoEnvioRef.current < 5000) return;
        ultimoEnvioRef.current = ahora;

        const nuevoPunto = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          time: new Date().toISOString(),
        };
        setUltimaPos({
          lat: nuevoPunto.lat,
          lng: nuevoPunto.lng,
          accuracy: pos.coords.accuracy,
        });

        try {
          // 1. Jalamos el historial actual acumulado de la columna JSONB
          const { data: actual } = await supabase
            .from("plan_recogida")
            .select("recorrido_gps_historial")
            .eq("id", recogidaId)
            .single();

          const historialPrevio = Array.isArray(actual?.recorrido_gps_historial)
            ? actual.recorrido_gps_historial
            : [];

          // 2. Insertamos el punto concatenándolo al arreglo JSONB e impactando el updated_at (Realtime del papá)
          const { error: errUpdate } = await supabase
            .from("plan_recogida")
            .update({
              latitud: nuevoPunto.lat,
              longitud: nuevoPunto.lng,
              recorrido_gps_historial: [...historialPrevio, nuevoPunto], // Inyección limpia estructurada
            })
            .eq("id", recogidaId);

          if (!errUpdate) {
            setPuntosEnviados((p) => p + 1);
          }
        } catch (e) {
          console.error("Error sincronizando telemetría GPS:", e);
        }
      },
      (err) => {
        if (err.code === 1) setError("Permiso de ubicación denegado");
        else if (err.code === 2) setError("Ubicación no disponible");
        else if (err.code === 3) setError("Timeout GPS");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );

    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [recogidaId, finalizado]);

  // FINALIZAR RECOGIDA
  async function finalizar() {
    if (!confirm("¿Confirmás que ya entregaste al niño en su casa?")) return;
    setFinalizando(true);

    // 1. Almacenamos la alerta oficial inmutable en la tabla de notificaciones históricas
    await supabase.from("notificaciones_recogida").insert({
      alumno_id: alumno.id,
      nombre_recogedor: usuario?.user_metadata?.full_name ?? usuario?.email,
      correo_recogedor: usuario?.email,
      latitud: ultimaPos?.lat || null,
      longitud: ultimaPos?.lng || null,
      recogido_at: new Date().toISOString(),
    });

    // 2. Apagamos el plan de recogida unificado
    await supabase
      .from("plan_recogida")
      .update({
        activo: false, // Se cierra el proceso
        escaneado_at: new Date().toISOString(), // Congela la hora de llegada
      })
      .eq("id", recogidaId);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    try {
      await wakeLockRef.current?.release();
    } catch {}
    wakeLockRef.current = null;
    setFinalizado(true);
    setFinalizando(false);
  }

  function formatTiempo(s: number) {
    const m = Math.floor(s / 60);
    const seg = s % 60;
    return `${String(m).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  }

  if (finalizado)
    return (
      <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center font-nunito px-6 text-center text-white">
        <div className="w-28 h-28 bg-white/20 rounded-3xl flex items-center justify-center mb-6">
          <CheckCircle2 size={56} className="text-white" />
        </div>
        <h1 className="font-black text-3xl mb-2">¡Entrega completada!</h1>
        <p className="text-green-100 text-base font-medium mb-6">
          {alumno?.nombre} fue entregado correctamente
        </p>
        <div className="bg-white/20 rounded-2xl px-5 py-3">
          <p className="text-xs font-bold text-green-100">
            Tiempo total de viaje
          </p>
          <p className="text-2xl font-black">{formatTiempo(tiempoActivo)}</p>
        </div>
        <p className="text-white/70 text-xs mt-8">
          Podés cerrar la página de forma segura.
        </p>
      </div>
    );

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-orange-500 to-orange-600 font-nunito flex flex-col text-white"
      style={{ minHeight: "100dvh" }}
    >
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          {alumno?.foto_url ? (
            <img
              src={alumno.foto_url}
              alt=""
              className="w-12 h-12 rounded-xl object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="font-black text-xl">{alumno?.nombre?.[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest">
              Trasladando de forma segura a
            </p>
            <p className="font-black text-base truncate">
              {alumno?.nombre} {alumno?.apellido}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div
            className={`flex items-center gap-1.5 backdrop-blur-sm rounded-full px-3 py-1 ${conectado ? "bg-white/20" : "bg-red-500/40"}`}
          >
            <Wifi size={12} />{" "}
            <span className="text-[11px] font-bold">
              {conectado ? "Transmitiendo" : "Sin internet"}
            </span>
          </div>
          {pausado && (
            <div className="flex items-center gap-1.5 bg-red-500/40 backdrop-blur-sm rounded-full px-3 py-1">
              <AlertTriangle size={12} />{" "}
              <span className="text-[11px] font-bold">Pantalla bloqueada</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
          <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <MapPin size={40} className="text-orange-500" />
          </div>
        </div>
        <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest mb-1">
          {ultimaPos
            ? "Señal satelital vinculada"
            : "Sincronizando satélites..."}
        </p>
        <p className="font-black text-3xl mb-1">{formatTiempo(tiempoActivo)}</p>
        <p className="text-orange-100 text-xs">
          {puntosEnviados} ubicaciones enviadas en vivo
        </p>
        {error && (
          <div className="mt-4 bg-red-500/40 backdrop-blur-sm rounded-xl px-4 py-2 text-xs font-bold text-center max-w-xs">
            {error}
          </div>
        )}
      </div>

      <div className="px-5 pb-8 pt-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 mb-4">
          <p className="text-[9px] font-black text-orange-100 uppercase tracking-widest">
            Responsable del menor
          </p>
          <p className="text-xs font-bold truncate">
            {usuario?.user_metadata?.full_name ?? usuario?.email}
          </p>
        </div>
        <button
          onClick={finalizar}
          disabled={finalizando}
          className="w-full bg-white text-orange-600 font-black py-4 rounded-2xl tracking-wider uppercase text-xs shadow-xl flex items-center justify-center gap-2"
        >
          {finalizando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "✓ Llegué a destino / Entregar menor"
          )}
        </button>
      </div>
    </div>
  );
}

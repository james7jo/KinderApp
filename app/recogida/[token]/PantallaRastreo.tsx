"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Battery,
  Wifi,
  Loader2,
  X,
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

  // ── Wake Lock — mantener pantalla encendida ──
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

    // Re-pedir wake lock si se libera
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) {
        pedirWakeLock();
      }
      setPausado(document.visibilityState === "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release();
    };
  }, []);

  // ── Contador de tiempo activo ──
  useEffect(() => {
    if (finalizado) return;
    const i = setInterval(() => setTiempoActivo((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [finalizado]);

  // ── Conexión a internet ──
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

  // ── GPS continuo con watchPosition ──
  useEffect(() => {
    if (finalizado) return;
    if (!navigator.geolocation) {
      setError("GPS no disponible");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const ahora = Date.now();
        // Enviar máximo cada 5 segundos
        if (ahora - ultimoEnvioRef.current < 5000) return;
        ultimoEnvioRef.current = ahora;

        const punto = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUltimaPos(punto);

        // Insertar ubicación
        const { error } = await supabase.from("ubicaciones").insert({
          recogida_id: recogidaId,
          lat: punto.lat,
          lng: punto.lng,
          accuracy: punto.accuracy,
        });

        if (!error) {
          // Actualizar último ping
          await supabase
            .from("recogidas_qr")
            .update({ ultimo_ping: new Date().toISOString() })
            .eq("id", recogidaId);
          setPuntosEnviados((p) => p + 1);
        }
      },
      (err) => {
        if (err.code === 1) setError("Permiso de ubicación denegado");
        else if (err.code === 2) setError("Ubicación no disponible");
        else if (err.code === 3) setError("Timeout — intentando de nuevo");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );

    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [recogidaId, finalizado]);

  // ── Finalizar recogida ──
  async function finalizar() {
    if (!confirm("¿Confirmás que ya entregaste al niño?")) return;
    setFinalizando(true);

    await supabase
      .from("recogidas_qr")
      .update({
        finalizado: true,
        finalizado_at: new Date().toISOString(),
      })
      .eq("id", recogidaId);

    if (watchIdRef.current !== null)
      navigator.geolocation.clearWatch(watchIdRef.current);
    wakeLockRef.current?.release();
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
          <p className="text-xs font-bold text-green-100">Tiempo total</p>
          <p className="text-2xl font-black">{formatTiempo(tiempoActivo)}</p>
        </div>
        <p className="text-white/70 text-xs mt-8">Podés cerrar la página</p>
      </div>
    );

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-orange-500 to-orange-600 font-nunito flex flex-col text-white"
      style={{ minHeight: "100dvh" }}
    >
      {/* Header con info */}
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
            <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">
              Trasladando a
            </p>
            <p className="font-black text-lg leading-tight truncate">
              {alumno?.nombre} {alumno?.apellido}
            </p>
          </div>
        </div>

        {/* Indicadores de estado */}
        <div className="flex gap-2">
          <div
            className={`flex items-center gap-1.5 backdrop-blur-sm rounded-full px-3 py-1.5 ${
              conectado ? "bg-white/20" : "bg-red-500/40"
            }`}
          >
            <Wifi size={12} />
            <span className="text-[11px] font-bold">
              {conectado ? "Conectado" : "Sin internet"}
            </span>
          </div>
          {pausado && (
            <div className="flex items-center gap-1.5 bg-red-500/40 backdrop-blur-sm rounded-full px-3 py-1.5">
              <AlertTriangle size={12} />
              <span className="text-[11px] font-bold">Pantalla oculta</span>
            </div>
          )}
        </div>
      </div>

      {/* Centro — Estado en vivo */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-4">
        <div className="relative mb-6">
          {/* Pulso animado */}
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
          <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
          <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <MapPin size={48} className="text-orange-500" />
          </div>
        </div>

        <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-2">
          {ultimaPos ? "Compartiendo ubicación" : "Obteniendo ubicación..."}
        </p>
        <p className="font-black text-3xl mb-1">{formatTiempo(tiempoActivo)}</p>
        <p className="text-orange-100 text-sm">
          {puntosEnviados}{" "}
          {puntosEnviados === 1 ? "punto enviado" : "puntos enviados"}
        </p>

        {error && (
          <div className="mt-6 bg-red-500/40 backdrop-blur-sm rounded-xl px-4 py-3 max-w-xs">
            <p className="text-sm font-bold text-center">{error}</p>
          </div>
        )}
      </div>

      {/* Footer — botón finalizar */}
      <div className="px-5 pb-8 pt-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
          <p className="text-[10px] font-black text-orange-100 uppercase tracking-widest mb-1">
            Identificado como
          </p>
          <p className="text-sm font-bold truncate">
            {usuario?.user_metadata?.full_name ?? usuario?.email}
          </p>
        </div>

        <button
          onClick={finalizar}
          disabled={finalizando}
          className="w-full bg-white text-orange-600 font-black py-5 rounded-2xl transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {finalizando ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Finalizando...
            </>
          ) : (
            <>
              <CheckCircle2 size={20} /> Llegué al destino
            </>
          )}
        </button>
        <p className="text-orange-100 text-[10px] text-center mt-3 font-medium">
          Tocá cuando hayas entregado al niño para finalizar el rastreo
        </p>
      </div>
    </div>
  );
}

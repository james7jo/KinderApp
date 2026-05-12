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

type RecogidaActiva = {
  id: string;
  nombre_recogedor: string;
  correo_recogedor: string;
  escaneado_at: string;
  finalizado: boolean;
  finalizado_at: string | null;
  ultimo_ping: string | null;
};

export default function GpsPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [alumnoNombre, setAlumnoNombre] = useState("");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [nueva, setNueva] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [recogida, setRecogida] = useState<RecogidaActiva | null>(null);
  const [segundosUltimoPing, setSegundosUltimoPing] = useState<number>(0);

  // Cargar datos iniciales
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

    // Buscar recogida activa (hoy, escaneada, no finalizada o reciente)
    const hoy = new Date().toISOString().split("T")[0];
    const { data: rec } = await supabase
      .from("recogidas_qr")
      .select(
        "id, nombre_recogedor, correo_recogedor, escaneado_at, finalizado, finalizado_at, ultimo_ping",
      )
      .eq("alumno_id", id)
      .not("escaneado_at", "is", null)
      .gte("created_at", hoy + "T00:00:00")
      .order("escaneado_at", { ascending: false })
      .limit(1)
      .single();

    if (rec) {
      setRecogida(rec);
      const { data: ubs } = await supabase
        .from("ubicaciones")
        .select("lat, lng, created_at")
        .eq("recogida_id", rec.id)
        .order("created_at", { ascending: true });
      setUbicaciones(ubs ?? []);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Realtime — nuevas notificaciones de recogida
  useEffect(() => {
    const ch = supabase
      .channel(`notifs-${id}`)
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

  // Realtime — nuevas ubicaciones de la recogida activa
  useEffect(() => {
    if (!recogida?.id || recogida.finalizado) return;
    const ch = supabase
      .channel(`ubs-${recogida.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ubicaciones",
          filter: `recogida_id=eq.${recogida.id}`,
        },
        (payload) => {
          const u = payload.new as any;
          setUbicaciones((prev) => [
            ...prev,
            { lat: u.lat, lng: u.lng, created_at: u.created_at },
          ]);
        },
      )
      .subscribe();

    // Realtime — cambios de estado de la recogida (finalización)
    const chRec = supabase
      .channel(`rec-${recogida.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "recogidas_qr",
          filter: `id=eq.${recogida.id}`,
        },
        (payload) => {
          setRecogida((prev) =>
            prev ? { ...prev, ...(payload.new as any) } : null,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
      supabase.removeChannel(chRec);
    };
  }, [recogida?.id, recogida?.finalizado]);

  // Contador "hace X segundos del último ping"
  useEffect(() => {
    if (!recogida?.ultimo_ping || recogida.finalizado) return;
    const i = setInterval(() => {
      const s = Math.floor(
        (Date.now() - new Date(recogida.ultimo_ping!).getTime()) / 1000,
      );
      setSegundosUltimoPing(s);
    }, 1000);
    return () => clearInterval(i);
  }, [recogida?.ultimo_ping, recogida?.finalizado]);

  const ultimaUb = ubicaciones[ubicaciones.length - 1];
  const hoy = new Date().toISOString().split("T")[0];

  // Estado del rastreo
  const enVivo = recogida && !recogida.finalizado && segundosUltimoPing < 30;
  const perdido =
    recogida &&
    !recogida.finalizado &&
    segundosUltimoPing >= 30 &&
    segundosUltimoPing < 300;
  const ofline = recogida && !recogida.finalizado && segundosUltimoPing >= 300;

  return (
    <main className="min-w-0 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href={`/dashboard/padre/hijo/${id}`}
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">
            {alumnoNombre}
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Rastreo en vivo
          </h1>
        </div>
        <div className="relative">
          <Bell size={20} className="text-gray-400" />
          {nueva && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping" />
          )}
        </div>
      </div>

      {/* Alerta de nueva recogida */}
      {nueva && (
        <div className="bg-orange-500 text-white px-4 py-3 flex items-center gap-3">
          <CheckCircle2 size={18} />
          <p className="font-black text-sm">¡Tu hijo acaba de ser recogido!</p>
        </div>
      )}

      <div className="px-4 lg:px-7 pt-5 pb-8 max-w-5xl mx-auto">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-5 lg:space-y-0">
          {/* COLUMNA IZQUIERDA — MAPA + ESTADO (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {recogida ? (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Estado del rastreo */}
                <div
                  className={`px-4 py-3 flex items-center justify-between border-b ${
                    recogida.finalizado
                      ? "bg-green-50 border-green-100"
                      : enVivo
                        ? "bg-orange-50 border-orange-100"
                        : perdido
                          ? "bg-amber-50 border-amber-100"
                          : "bg-red-50 border-red-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {recogida.finalizado ? (
                      <>
                        <CheckCircle2 size={14} className="text-green-500" />
                        <p className="font-black text-green-700 text-sm">
                          Entregado correctamente
                        </p>
                      </>
                    ) : enVivo ? (
                      <>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        <p className="font-black text-orange-700 text-sm">
                          Rastreando en vivo
                        </p>
                      </>
                    ) : perdido ? (
                      <>
                        <Activity size={14} className="text-amber-500" />
                        <p className="font-black text-amber-700 text-sm">
                          Sin señal
                        </p>
                      </>
                    ) : (
                      <>
                        <Square size={14} className="text-red-500" />
                        <p className="font-black text-red-700 text-sm">
                          Rastreo inactivo
                        </p>
                      </>
                    )}
                  </div>
                  {!recogida.finalizado && segundosUltimoPing < 300 && (
                    <p className="text-[10px] font-bold text-gray-500">
                      hace {segundosUltimoPing}s
                    </p>
                  )}
                  {recogida.finalizado && recogida.finalizado_at && (
                    <p className="text-[10px] font-bold text-green-600">
                      {new Date(recogida.finalizado_at).toLocaleTimeString(
                        "es-BO",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </p>
                  )}
                </div>

                {/* Mapa */}
                <div className="h-80 lg:h-96 relative bg-gray-100">
                  {ubicaciones.length > 0 ? (
                    <MapaRecogida ubicaciones={ubicaciones} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-400 text-sm font-bold">
                        Esperando primera ubicación...
                      </p>
                    </div>
                  )}
                </div>

                {/* Info del recogedor */}
                <div className="px-4 py-3 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shrink-0">
                      <User size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-sm truncate">
                        {recogida.nombre_recogedor}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {recogida.correo_recogedor}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Puntos
                      </p>
                      <p className="font-black text-orange-500 text-sm">
                        {ubicaciones.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center px-4">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin size={28} className="text-gray-300" />
                </div>
                <p className="font-black text-gray-700 text-base mb-1">
                  Sin rastreo activo
                </p>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                  Cuando alguien escanee el QR para recoger a tu hijo verás el
                  recorrido en tiempo real
                </p>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA — HISTORIAL (1/3) */}
          <div className="lg:col-span-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Historial ({notifs.length})
            </p>
            {notifs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center px-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <BellOff size={20} className="text-gray-300" />
                </div>
                <p className="font-black text-gray-700 text-sm">
                  Sin alertas aún
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifs.map((n) => {
                  const esHoy =
                    new Date(n.recogido_at).toISOString().split("T")[0] === hoy;
                  return (
                    <div
                      key={n.id}
                      className={`bg-white rounded-2xl border overflow-hidden ${esHoy ? "border-green-200" : "border-gray-100"}`}
                    >
                      <div
                        className={`h-1 ${esHoy ? "bg-green-400" : "bg-gray-200"}`}
                      />
                      <div className="p-3 flex items-start gap-2.5">
                        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} className="text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {esHoy && (
                            <span className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                              HOY
                            </span>
                          )}
                          <p className="font-black text-gray-900 text-sm truncate">
                            {n.nombre_recogedor}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock
                              size={10}
                              className="text-gray-400 shrink-0"
                            />
                            <span className="text-[10px] font-bold text-gray-500">
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
                    </div>
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

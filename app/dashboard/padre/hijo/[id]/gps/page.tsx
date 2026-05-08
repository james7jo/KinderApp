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
  Navigation,
  Loader2,
} from "lucide-react";

type Notificacion = {
  id: string;
  nombre_recogedor: string;
  correo_recogedor: string;
  latitud: number | null;
  longitud: number | null;
  recogido_at: string;
};

type Ubicacion = { lat: number; lng: number; updated_at: string };

export default function AlertasRecogidaPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [alumnoNombre, setAlumnoNombre] = useState("");
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [nueva, setNueva] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [recogidaActivaId, setRecogidaActivaId] = useState<string | null>(null);
  const [rastreando, setRastreando] = useState(false);
  const [ruta, setRuta] = useState<[number, number][]>([]);
  const [ultimaPos, setUltimaPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [MapComponent, setMapComponent] = useState<any>(null);

  const cargar = useCallback(async () => {
    const [{ data: alumno }, { data: data }] = await Promise.all([
      supabase.from("alumnos").select("nombre, apellido").eq("id", id).single(),
      supabase
        .from("notificaciones_recogida")
        .select("*")
        .eq("alumno_id", id)
        .order("recogido_at", { ascending: false })
        .limit(20),
    ]);
    setAlumnoNombre(`${alumno?.nombre} ${alumno?.apellido}`);
    setNotifs(data ?? []);

    const hoy = new Date().toISOString().split("T")[0];
    const { data: recActiva } = await supabase
      .from("recogidas_qr")
      .select("id, escaneado_at")
      .eq("alumno_id", id)
      .eq("activo", true)
      .gte("created_at", hoy + "T00:00:00")
      .not("escaneado_at", "is", null)
      .order("escaneado_at", { ascending: false })
      .limit(1)
      .single();

    if (recActiva?.id) {
      setRecogidaActivaId(recActiva.id);
      const { data: ubs } = await supabase
        .from("ubicaciones")
        .select("lat, lng, updated_at")
        .eq("recogida_id", recActiva.id)
        .order("updated_at", { ascending: true });
      if (ubs && ubs.length > 0) {
        setUbicaciones(ubs);
        setRuta(ubs.map((u) => [u.lat, u.lng]));
        setUltimaPos({
          lat: ubs[ubs.length - 1].lat,
          lng: ubs[ubs.length - 1].lng,
        });
        setRastreando(true);
      }
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
    import("react-leaflet").then((rl) => {
      setMapComponent({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        Popup: rl.Popup,
        Circle: rl.Circle,
        Polyline: rl.Polyline,
        useMap: rl.useMap,
      });
    });
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("notifs-" + id)
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
      supabase.removeChannel(channel);
    };
  }, [id, cargar]);

  useEffect(() => {
    if (!recogidaActivaId) return;
    const channel = supabase
      .channel("ubs-" + recogidaActivaId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ubicaciones",
          filter: `recogida_id=eq.${recogidaActivaId}`,
        },
        (payload) => {
          const u = payload.new as any;
          const nuevoPunto: [number, number] = [u.lat, u.lng];
          setRuta((prev) => [...prev, nuevoPunto]);
          setUltimaPos({ lat: u.lat, lng: u.lng });
          setRastreando(true);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [recogidaActivaId]);

  const hoy = new Date().toISOString().split("T")[0];
  const ultimaUbicacion = ubicaciones[ubicaciones.length - 1];

  function MapMover({ center }: { center: [number, number] }) {
    const map = MapComponent.useMap();
    useEffect(() => {
      map.setView(center, map.getZoom(), { animate: true });
    }, [center[0], center[1]]);
    return null;
  }

  return (
    <main className="min-w-0 font-nunito">
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
            Alertas de recogida
          </h1>
        </div>
        <div className="relative">
          <Bell size={20} className="text-gray-400" />
          {nueva && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping" />
          )}
        </div>
      </div>

      {nueva && (
        <div className="bg-orange-500 text-white px-4 py-3 flex items-center gap-3">
          <CheckCircle2 size={18} />
          <p className="font-black text-sm">¡Tu hijo acaba de ser recogido!</p>
        </div>
      )}

      <div className="px-4 lg:px-7 pt-5 pb-8 max-w-4xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
          {/* Mapa en tiempo real */}
          <div className="space-y-4">
            {rastreando && ultimaPos && MapComponent ? (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <p className="font-black text-gray-900 text-sm">
                      Ubicación en tiempo real
                    </p>
                  </div>
                  {ultimaUbicacion && (
                    <p className="text-[10px] text-gray-400 font-bold">
                      {new Date(ultimaUbicacion.updated_at).toLocaleTimeString(
                        "es-BO",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </p>
                  )}
                </div>
                <div style={{ height: "300px" }}>
                  <MapComponent.MapContainer
                    center={[ultimaPos.lat, ultimaPos.lng]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <MapComponent.TileLayer
                      attribution="&copy; OpenStreetMap"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {ruta.length > 1 && (
                      <MapComponent.Polyline
                        positions={ruta}
                        color="#f97316"
                        weight={4}
                        opacity={0.8}
                        dashArray="8 4"
                      />
                    )}
                    {ruta.length > 0 && (
                      <MapComponent.Circle
                        center={ruta[0]}
                        radius={15}
                        color="#22c55e"
                        fillColor="#22c55e"
                        fillOpacity={0.8}
                      />
                    )}
                    <MapComponent.Circle
                      center={[ultimaPos.lat, ultimaPos.lng]}
                      radius={40}
                      color="#f97316"
                      fillColor="#f97316"
                      fillOpacity={0.3}
                    />
                    <MapComponent.Marker
                      position={[ultimaPos.lat, ultimaPos.lng]}
                    >
                      <MapComponent.Popup>{alumnoNombre}</MapComponent.Popup>
                    </MapComponent.Marker>
                    <MapMover center={[ultimaPos.lat, ultimaPos.lng]} />
                  </MapComponent.MapContainer>
                </div>
                <div className="px-4 py-3 bg-blue-50 flex items-center gap-2">
                  <Navigation size={13} className="text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-600 font-medium">
                    Se actualiza cada 10 seg mientras el recogedor tenga la
                    página abierta
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center px-4">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin size={24} className="text-gray-300" />
                </div>
                <p className="font-black text-gray-700 text-base mb-1">
                  Sin rastreo activo
                </p>
                <p className="text-gray-400 text-sm">
                  Cuando alguien escanee el QR verás su recorrido aquí
                </p>
              </div>
            )}
          </div>

          {/* Historial */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Historial
            </p>
            {notifs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center px-4">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BellOff size={24} className="text-gray-300" />
                </div>
                <p className="font-black text-gray-700">Sin alertas aún</p>
              </div>
            ) : (
              notifs.map((n) => {
                const esHoy =
                  new Date(n.recogido_at).toISOString().split("T")[0] === hoy;
                return (
                  <div
                    key={n.id}
                    className={`bg-white rounded-2xl border overflow-hidden mb-3 ${esHoy ? "border-green-200" : "border-gray-100"}`}
                  >
                    <div
                      className={`h-1 ${esHoy ? "bg-green-400" : "bg-gray-200"}`}
                    />
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} className="text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {esHoy && (
                            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              HOY
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 font-bold">
                            {new Date(n.recogido_at).toLocaleDateString(
                              "es-BO",
                              { day: "numeric", month: "short" },
                            )}
                          </span>
                        </div>
                        <p className="font-black text-gray-900">
                          {n.nombre_recogedor}
                        </p>
                        {n.correo_recogedor && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <User
                              size={11}
                              className="text-gray-400 shrink-0"
                            />
                            <p className="text-xs text-gray-400 truncate">
                              {n.correo_recogedor}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} className="text-orange-400" />
                            <span className="text-xs font-bold text-orange-500">
                              {new Date(n.recogido_at).toLocaleTimeString(
                                "es-BO",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                          {n.latitud && n.longitud && (
                            <a
                              href={`https://maps.google.com/?q=${n.latitud},${n.longitud}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full"
                            >
                              <MapPin size={11} className="text-blue-500" />
                              <span className="text-xs font-bold text-blue-500">
                                Punto inicial
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

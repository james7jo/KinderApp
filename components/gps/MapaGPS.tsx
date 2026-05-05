"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  alumnoId: string;
  alumnoNombre: string;
}

export default function MapaGPS({ alumnoId, alumnoNombre }: Props) {
  const [ubicacion, setUbicacion] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [ultimaVez, setUltimaVez] = useState<string>("");
  const [MapComponent, setMapComponent] = useState<any>(null);
  const supabase = createClient();
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
  }, []);

  useEffect(() => {
    // Cargar ubicación inicial
    async function cargarUbicacion() {
      const { data } = await supabase
        .from("ubicaciones")
        .select("lat, lng, updated_at")
        .eq("alumno_id", alumnoId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setUbicacion({ lat: data.lat, lng: data.lng });
        setUltimaVez(new Date(data.updated_at).toLocaleTimeString("es-BO"));
      }
    }
    cargarUbicacion();

    // Suscripción realtime
    const channel = supabase
      .channel(`ubicacion-${alumnoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ubicaciones",
          filter: `alumno_id=eq.${alumnoId}`,
        },
        (payload) => {
          const data = payload.new as any;
          setUbicacion({ lat: data.lat, lng: data.lng });
          setUltimaVez(new Date(data.updated_at).toLocaleTimeString("es-BO"));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alumnoId]);

  // Cargar Leaflet solo en cliente
  useEffect(() => {
    import("react-leaflet").then((rl) => {
      setMapComponent({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        Popup: rl.Popup,
        Circle: rl.Circle,
      });
    });
  }, []);

  if (!ubicacion)
    return (
      <div className="h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-2">📍</p>
          <p className="text-gray-400 text-sm font-medium">Sin señal GPS</p>
        </div>
      </div>
    );

  if (!MapComponent)
    return (
      <div className="h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando mapa...</p>
      </div>
    );

  const { MapContainer, TileLayer, Marker, Popup, Circle } = MapComponent;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-xs font-bold text-green-500">EN VIVO</p>
        </div>
        <p className="text-xs text-gray-400">
          Última actualización: {ultimaVez}
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
        style={{ height: "300px" }}
      >
        <MapContainer
          center={[ubicacion.lat, ubicacion.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          key={`${ubicacion.lat}-${ubicacion.lng}`}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={[ubicacion.lat, ubicacion.lng]}
            radius={50}
            color="#f97316"
            fillColor="#f97316"
            fillOpacity={0.2}
          />
          <Marker position={[ubicacion.lat, ubicacion.lng]}>
            <Popup>{alumnoNombre}</Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-lg">📍</span>
        </div>
        <div>
          <p className="font-black text-gray-900 text-sm">{alumnoNombre}</p>
          <p className="text-gray-400 text-xs">
            {ubicacion.lat.toFixed(6)}, {ubicacion.lng.toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  );
}

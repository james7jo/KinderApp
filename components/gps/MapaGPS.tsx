"use client";
import { useEffect, useState, useRef } from "react";
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
  const [ruta, setRuta] = useState<[number, number][]>([]);
  const [ultimaVez, setUltimaVez] = useState<string>("");
  const [MapComponent, setMapComponent] = useState<any>(null);
  const mapRef = useRef<any>(null);
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
    async function cargarRuta() {
      // Traemos los últimos 50 puntos para dibujar la ruta
      const { data } = await supabase
        .from("ubicaciones")
        .select("lat, lng, updated_at")
        .eq("alumno_id", alumnoId)
        .order("updated_at", { ascending: true })
        .limit(50);

      if (data && data.length > 0) {
        const puntos: [number, number][] = data.map((d) => [d.lat, d.lng]);
        setRuta(puntos);
        const ultimo = data[data.length - 1];
        setUbicacion({ lat: ultimo.lat, lng: ultimo.lng });
        setUltimaVez(new Date(ultimo.updated_at).toLocaleTimeString("es-BO"));
      }
    }
    cargarRuta();

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
          const nuevoPunto: [number, number] = [data.lat, data.lng];
          setUbicacion({ lat: data.lat, lng: data.lng });
          setUltimaVez(new Date(data.updated_at).toLocaleTimeString("es-BO"));
          setRuta((prev) => [...prev, nuevoPunto]);
          // Mover el mapa al nuevo punto
          if (mapRef.current) {
            mapRef.current.setView(nuevoPunto, mapRef.current.getZoom());
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alumnoId]);

  useEffect(() => {
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

  const { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } =
    MapComponent;

  // Componente interno para mover el mapa cuando cambia ubicación
  function MapMover({ center }: { center: [number, number] }) {
    const map = MapComponent.useMap();
    useEffect(() => {
      map.setView(center, map.getZoom(), { animate: true });
    }, [center]);
    return null;
  }

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
          ref={mapRef}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Ruta recorrida */}
          {ruta.length > 1 && (
            <Polyline
              positions={ruta}
              color="#f97316"
              weight={4}
              opacity={0.8}
              dashArray="8 4"
            />
          )}

          {/* Punto de inicio (verde) */}
          {ruta.length > 1 && (
            <Circle
              center={ruta[0]}
              radius={15}
              color="#22c55e"
              fillColor="#22c55e"
              fillOpacity={0.8}
            />
          )}

          {/* Posición actual */}
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

          <MapMover center={[ubicacion.lat, ubicacion.lng]} />
        </MapContainer>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-lg">📍</span>
        </div>
        <div className="flex-1">
          <p className="font-black text-gray-900 text-sm">{alumnoNombre}</p>
          <p className="text-gray-400 text-xs">
            {ubicacion.lat.toFixed(6)}, {ubicacion.lng.toFixed(6)}
          </p>
        </div>
        {ruta.length > 1 && (
          <div className="text-right">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
              Recorrido
            </p>
            <p className="text-sm font-black text-gray-700">
              {ruta.length} puntos
            </p>
          </div>
        )}
      </div>

      {/* Leyenda */}
      {ruta.length > 1 && (
        <div className="flex items-center gap-4 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-400 font-medium">
              Inicio recogida
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-1 bg-orange-400 rounded"
              style={{ borderTop: "2px dashed #f97316" }}
            />
            <span className="text-xs text-gray-400 font-medium">Ruta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-orange-500 rounded-full" />
            <span className="text-xs text-gray-400 font-medium">
              Posición actual
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

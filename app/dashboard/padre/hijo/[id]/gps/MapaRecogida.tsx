"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Punto = { lat: number; lng: number; updated_at: string };

// Fix de iconos de Leaflet en Next.js
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
};

export default function MapaRecogida({
  ubicaciones,
}: {
  ubicaciones: Punto[];
}) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const polilineaRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || ubicaciones.length === 0) return;
    fixLeafletIcons();

    const ultimo = ubicaciones[ubicaciones.length - 1];

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView([ultimo.lat, ultimo.lng], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(mapRef.current);

      // Punto de inicio en verde
      const iconInicio = L.divIcon({
        html: `<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        className: "",
        iconAnchor: [7, 7],
      });
      L.marker([ubicaciones[0].lat, ubicaciones[0].lng], { icon: iconInicio })
        .bindPopup("Punto de inicio")
        .addTo(mapRef.current);
    }

    // Actualizar polilínea (ruta)
    const coords: [number, number][] = ubicaciones.map((u) => [u.lat, u.lng]);
    if (polilineaRef.current) {
      polilineaRef.current.setLatLngs(coords);
    } else {
      polilineaRef.current = L.polyline(coords, {
        color: "#f97316",
        weight: 4,
        opacity: 0.8,
      }).addTo(mapRef.current!);
    }

    // Marcador actual (naranja pulsante)
    const iconActual = L.divIcon({
      html: `<div style="background:#f97316;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(249,115,22,0.5)"></div>`,
      className: "",
      iconAnchor: [9, 9],
    });
    if (markerRef.current) {
      markerRef.current.setLatLng([ultimo.lat, ultimo.lng]);
    } else {
      markerRef.current = L.marker([ultimo.lat, ultimo.lng], {
        icon: iconActual,
      })
        .bindPopup("Ubicación actual")
        .addTo(mapRef.current!);
    }

    mapRef.current?.setView([ultimo.lat, ultimo.lng], mapRef.current.getZoom());
  }, [ubicaciones]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
  );
}

"use client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Punto = { lat: number; lng: number; created_at: string };

export default function MapaRecogida({
  ubicaciones,
}: {
  ubicaciones: Punto[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerActualRef = useRef<maplibregl.Marker | null>(null);
  const markerInicioRef = useRef<maplibregl.Marker | null>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (ubicaciones.length === 0) return;

    const ultimo = ubicaciones[ubicaciones.length - 1];

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [ultimo.lng, ultimo.lat],
      zoom: 16,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current.on("load", () => {
      if (!mapRef.current) return;

      // Source de la ruta
      mapRef.current.addSource("ruta", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: ubicaciones.map((u) => [u.lng, u.lat]),
          },
        },
      });

      // Capa de la línea
      mapRef.current.addLayer({
        id: "ruta",
        type: "line",
        source: "ruta",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#f97316",
          "line-width": 5,
          "line-opacity": 0.85,
        },
      });

      // Marcador inicio (verde)
      const inicio = ubicaciones[0];
      const elInicio = document.createElement("div");
      elInicio.style.cssText =
        "width:18px;height:18px;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)";
      markerInicioRef.current = new maplibregl.Marker({ element: elInicio })
        .setLngLat([inicio.lng, inicio.lat])
        .setPopup(new maplibregl.Popup().setText("Punto de inicio"))
        .addTo(mapRef.current);

      // Marcador actual (naranja con pulso)
      const elActual = document.createElement("div");
      elActual.innerHTML = `
        <div style="position:relative;width:24px;height:24px;">
          <div style="position:absolute;inset:0;background:#f97316;border-radius:50%;animation:pulso 1.5s infinite;opacity:0.6"></div>
          <div style="position:relative;width:24px;height:24px;background:#f97316;border:3px solid white;border-radius:50%;box-shadow:0 2px 12px rgba(249,115,22,0.6)"></div>
        </div>
        <style>@keyframes pulso{0%{transform:scale(1);opacity:0.6}100%{transform:scale(2);opacity:0}}</style>
      `;
      markerActualRef.current = new maplibregl.Marker({ element: elActual })
        .setLngLat([ultimo.lng, ultimo.lat])
        .setPopup(new maplibregl.Popup().setText("Ubicación actual"))
        .addTo(mapRef.current);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Actualizar ruta y marcador cuando llegan nuevas ubicaciones
  useEffect(() => {
    if (!mapRef.current || ubicaciones.length === 0) return;
    const map = mapRef.current;
    if (!map.loaded() || !map.getSource("ruta")) return;

    const source = map.getSource("ruta") as maplibregl.GeoJSONSource;
    source.setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: ubicaciones.map((u) => [u.lng, u.lat]),
      },
    });

    const ultimo = ubicaciones[ubicaciones.length - 1];
    if (markerActualRef.current) {
      markerActualRef.current.setLngLat([ultimo.lng, ultimo.lat]);
    }

    // Mover mapa suavemente al último punto
    map.easeTo({ center: [ultimo.lng, ultimo.lat], duration: 800 });
  }, [ubicaciones]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

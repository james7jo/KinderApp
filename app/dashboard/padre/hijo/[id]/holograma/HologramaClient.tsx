"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Lightbulb,
  Activity,
  Award,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";

interface HologramaClientProps {
  alumnoNombre: string;
  trimestre: number;
  genero: "M" | "F";
  promedios: {
    ser: number;
    saber: number;
    hacer: number;
    decidir: number;
  };
}

export default function HologramaClient({
  alumnoNombre,
  trimestre,
  genero,
  promedios,
}: HologramaClientProps) {
  const router = useRouter();
  const [parteSeleccionada, setParteSeleccionada] = useState<string | null>(
    null,
  );

  // ── Rotación 3D del Holograma ──
  const [rotY, setRotY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const dragStart = useRef<{ x: number; rotY: number } | null>(null);
  const autoRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const showBack = Math.abs((((rotY % 360) + 360) % 360) - 180) < 90;

  const startAutoRotate = useCallback(() => {
    if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    autoRotateRef.current = setInterval(() => {
      setRotY((y) => y + 0.6);
    }, 16);
    setIsRotating(true);
  }, []);

  const stopAutoRotate = useCallback(() => {
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = null;
    }
    setIsRotating(false);
  }, []);

  useEffect(() => {
    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      stopAutoRotate();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, rotY };
      e.preventDefault();
    },
    [rotY, stopAutoRotate],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStart.current) return;
      const delta = e.clientX - dragStart.current.x;
      setRotY(dragStart.current.rotY + delta * 0.8);
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      stopAutoRotate();
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, rotY };
    },
    [rotY, stopAutoRotate],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !dragStart.current) return;
      const delta = e.touches[0].clientX - dragStart.current.x;
      setRotY(dragStart.current.rotY + delta * 0.8);
    },
    [isDragging],
  );

  // ── Escalas Oficiales del Ministerio ──
  const obtenerEscala = (
    dimension: "ser" | "saber" | "hacer" | "decidir",
    nota: number,
  ) => {
    if (nota === 0)
      return {
        label: "Sin Registro",
        color: "fill-gray-200 text-gray-400 bg-gray-50 border-gray-200",
      };

    let esED = false,
      esDA = false,
      esDO = false;

    if (dimension === "ser") {
      if (nota <= 5) esED = true;
      else if (nota <= 7) esDA = true;
      else if (nota <= 9) esDO = true;
    } else if (dimension === "saber") {
      if (nota <= 22) esED = true;
      else if (nota <= 30) esDA = true;
      else if (nota <= 40) esDO = true;
    } else if (dimension === "hacer") {
      if (nota <= 20) esED = true;
      else if (nota <= 27) esDA = true;
      else if (nota <= 35) esDO = true;
    } else if (dimension === "decidir") {
      if (nota <= 2) esED = true;
      else if (nota <= 3) esDA = true;
      else if (nota <= 4) esDO = true;
    }

    if (esED)
      return {
        label: "En Desarrollo (ED)",
        color:
          "fill-red-400 text-red-600 bg-red-50 border-red-200 hover:fill-red-500",
      };
    if (esDA)
      return {
        label: "Desarrollo Aceptable (DA)",
        color:
          "fill-amber-400 text-amber-600 bg-amber-50 border-amber-200 hover:fill-amber-500",
      };
    if (esDO)
      return {
        label: "Desarrollo Óptimo (DO)",
        color:
          "fill-indigo-400 text-indigo-600 bg-indigo-50 border-indigo-200 hover:fill-indigo-500",
      };
    return {
      label: "Desarrollo Pleno (DP)",
      color:
        "fill-emerald-400 text-emerald-600 bg-emerald-50 border-emerald-200 hover:fill-emerald-500",
    };
  };

  const chinaSer = obtenerEscala("ser", promedios.ser);
  const chinaSaber = obtenerEscala("saber", promedios.saber);
  const chinaHacer = obtenerEscala("hacer", promedios.hacer);
  const chinaDecidir = obtenerEscala("decidir", promedios.decidir);

  const cambiarTrimestre = (t: number) => router.push(`?trimestre=${t}`);

  // ── Paleta visual por escala (adaptada a diseño KinderApp claro) ──
  const getParteFill = (
    escala: ReturnType<typeof obtenerEscala>,
    activa: boolean,
  ) => {
    const base = (() => {
      if (escala.label.startsWith("En Desarrollo"))
        return {
          fill: "#fee2e2",
          stroke: "#ef4444",
          accent: "#dc2626",
          text: "#b91c1c",
        };
      if (escala.label.startsWith("Desarrollo Aceptable"))
        return {
          fill: "#fef3c7",
          stroke: "#f59e0b",
          accent: "#d97706",
          text: "#92400e",
        };
      if (escala.label.startsWith("Desarrollo Óptimo"))
        return {
          fill: "#e0e7ff",
          stroke: "#6366f1",
          accent: "#4f46e5",
          text: "#3730a3",
        };
      if (escala.label.startsWith("Desarrollo Pleno"))
        return {
          fill: "#d1fae5",
          stroke: "#10b981",
          accent: "#059669",
          text: "#065f46",
        };
      // Sin Registro → estilo naranja KinderApp
      return {
        fill: "#fff7ed",
        stroke: "#f97316",
        accent: "#ea580c",
        text: "#9a3412",
      };
    })();
    return {
      ...base,
      opacity: activa ? "1" : "0.82",
      strokeWidth: activa ? "1.5" : "1",
    };
  };

  const saberColor = getParteFill(chinaSaber, parteSeleccionada === "saber");
  const serColor = getParteFill(chinaSer, parteSeleccionada === "ser");
  const hacerColor = getParteFill(chinaHacer, parteSeleccionada === "hacer");

  const normalizedRot = ((rotY % 360) + 360) % 360;
  const scaleX = Math.abs(Math.cos((normalizedRot * Math.PI) / 180));
  const perspectiveScale = 0.85 + scaleX * 0.15;

  // Color de acento KinderApp: naranja para todos
  const accentColor = "#f97316";
  const accentLight = "#fff7ed";

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 lg:p-6 text-xs font-sans text-gray-700">
      {/* CABECERA */}
      <div className="max-w-5xl mx-auto flex items-center justify-between border border-gray-100 bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 hover:bg-gray-100 transition-all"
          >
            <ArrowLeft size={15} className="text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <h1 className="text-xs font-black text-gray-900 uppercase tracking-widest">
                KinderApp · Mapa de Desarrollo
              </h1>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              {alumnoNombre}
            </p>
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
          {[1, 2, 3].map((t) => (
            <button
              key={t}
              onClick={() => cambiarTrimestre(t)}
              className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                trimestre === t
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t} Trimestre
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* ═══════════════════════════════════════
            COLUMNA IZQUIERDA: FIGURA 3D — Estilo KinderApp
        ═══════════════════════════════════════ */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white">
          {/* Barra superior */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                Mapa Corporal 3D
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-gray-400 font-bold">
                {genero === "M" ? "MASC" : "FEM"} · T{trimestre}
              </span>
              <button
                onClick={() =>
                  isRotating ? stopAutoRotate() : startAutoRotate()
                }
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all ${
                  isRotating
                    ? "border-orange-400 text-orange-600 bg-orange-50"
                    : "border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50"
                }`}
              >
                <RotateCcw
                  size={9}
                  className={isRotating ? "animate-spin" : ""}
                />
                {isRotating ? "Detener" : "Rotar 360°"}
              </button>
            </div>
          </div>

          {/* Área del SVG */}
          <div
            ref={svgContainerRef}
            className="relative flex items-center justify-center py-8 px-4 bg-white"
            style={{
              minHeight: "440px",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
              // Fondo sutil con rejilla muy clara — estilo KinderApp
              backgroundImage: `radial-gradient(circle, #f97316 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0",
              opacity: 1,
            }}
          >
            {/* Capa de rejilla (overlay para suavizar los puntos) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "rgba(255,255,255,0.82)" }}
            />

            {/* Sombra de suelo */}
            <div
              className="absolute left-1/2 bottom-8 -translate-x-1/2 pointer-events-none"
              style={{
                width: "110px",
                height: "12px",
                background: "rgba(249,115,22,0.10)",
                borderRadius: "50%",
                filter: "blur(6px)",
              }}
            />

            {/* SVG 3D de la figura */}
            <div
              style={{
                transform: `perspective(600px) rotateY(${rotY}deg)`,
                transformStyle: "preserve-3d",
                transition: isDragging ? "none" : "transform 0.05s linear",
                position: "relative",
                zIndex: 1,
              }}
            >
              <svg
                viewBox="0 0 200 360"
                style={{
                  width: "190px",
                  height: "auto",
                  display: "block",
                  transform: `scaleX(${perspectiveScale})`,
                  // Sombra suave para dar profundidad
                  filter: "drop-shadow(0 4px 12px rgba(249,115,22,0.18))",
                }}
              >
                <defs>
                  {/* Gradiente base del cuerpo (blanco a gris muy suave) */}
                  <linearGradient
                    id="body-base"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#f9fafb" />
                    <stop offset="100%" stopColor="#f3f4f6" />
                  </linearGradient>
                  {/* Efecto glow suave para parte activa */}
                  <filter
                    id="glow-active"
                    x="-40%"
                    y="-40%"
                    width="180%"
                    height="180%"
                  >
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter
                    id="glow-part"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {!showBack ? (
                  genero === "M" ? (
                    /* ── NIÑO FRENTE ── */
                    <g>
                      {/* CABEZA — SABER */}
                      <g
                        onClick={() =>
                          !isDragging && setParteSeleccionada("saber")
                        }
                        style={{ cursor: "pointer" }}
                        filter={
                          parteSeleccionada === "saber"
                            ? "url(#glow-active)"
                            : "url(#glow-part)"
                        }
                      >
                        {/* Cráneo */}
                        <ellipse
                          cx="100"
                          cy="44"
                          rx="25"
                          ry="27"
                          fill={saberColor.fill}
                          stroke={saberColor.stroke}
                          strokeWidth={saberColor.strokeWidth}
                        />
                        {/* Ojos */}
                        <ellipse
                          cx="91"
                          cy="41"
                          rx="4"
                          ry="4.5"
                          fill="white"
                          stroke={saberColor.stroke}
                          strokeWidth="0.5"
                        />
                        <ellipse
                          cx="109"
                          cy="41"
                          rx="4"
                          ry="4.5"
                          fill="white"
                          stroke={saberColor.stroke}
                          strokeWidth="0.5"
                        />
                        <circle
                          cx="92.5"
                          cy="39.5"
                          r="1.5"
                          fill={saberColor.accent}
                        />
                        <circle
                          cx="110.5"
                          cy="39.5"
                          r="1.5"
                          fill={saberColor.accent}
                        />
                        {/* Pupila reflejo */}
                        <circle
                          cx="93.5"
                          cy="38.5"
                          r="0.5"
                          fill="white"
                          opacity="0.8"
                        />
                        <circle
                          cx="111.5"
                          cy="38.5"
                          r="0.5"
                          fill="white"
                          opacity="0.8"
                        />
                        {/* Nariz */}
                        <path
                          d="M98,47 L96,51 L104,51"
                          fill="none"
                          stroke={saberColor.stroke}
                          strokeWidth="0.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.6"
                        />
                        {/* Boca sonrisa */}
                        <path
                          d="M93,55 Q100,60 107,55"
                          fill="none"
                          stroke={saberColor.stroke}
                          strokeWidth="0.8"
                          strokeLinecap="round"
                        />
                        {/* Orejas */}
                        <path
                          d="M75,38 Q71,44 75,50"
                          fill="none"
                          stroke={saberColor.stroke}
                          strokeWidth="1"
                          opacity="0.7"
                        />
                        <path
                          d="M125,38 Q129,44 125,50"
                          fill="none"
                          stroke={saberColor.stroke}
                          strokeWidth="1"
                          opacity="0.7"
                        />
                        {/* Pelo */}
                        <path
                          d="M76,24 Q80,13 100,16 Q120,13 124,24"
                          fill={saberColor.fill}
                          stroke={saberColor.stroke}
                          strokeWidth="1.2"
                        />
                        <line
                          x1="86"
                          y1="15"
                          x2="84"
                          y2="9"
                          stroke={saberColor.stroke}
                          strokeWidth="1"
                          strokeLinecap="round"
                          opacity="0.7"
                        />
                        <line
                          x1="100"
                          y1="13"
                          x2="100"
                          y2="7"
                          stroke={saberColor.stroke}
                          strokeWidth="1"
                          strokeLinecap="round"
                          opacity="0.7"
                        />
                        <line
                          x1="114"
                          y1="15"
                          x2="116"
                          y2="9"
                          stroke={saberColor.stroke}
                          strokeWidth="1"
                          strokeLinecap="round"
                          opacity="0.7"
                        />
                        {/* Coronita / indicador SABER */}
                        <circle
                          cx="100"
                          cy="4"
                          r="3"
                          fill={saberColor.stroke}
                          fillOpacity="0.15"
                          stroke={saberColor.stroke}
                          strokeWidth="0.6"
                        />
                        <circle
                          cx="100"
                          cy="4"
                          r="1.2"
                          fill={saberColor.accent}
                          opacity="0.7"
                        />
                      </g>

                      {/* Cuello */}
                      <rect
                        x="93"
                        y="70"
                        width="14"
                        height="14"
                        rx="3"
                        fill="url(#body-base)"
                        stroke={accentColor}
                        strokeWidth="0.6"
                        opacity="0.5"
                      />

                      {/* TRONCO — SER */}
                      <g
                        onClick={() =>
                          !isDragging && setParteSeleccionada("ser")
                        }
                        style={{ cursor: "pointer" }}
                        filter={
                          parteSeleccionada === "ser"
                            ? "url(#glow-active)"
                            : "url(#glow-part)"
                        }
                      >
                        <path
                          d="M76,84 C72,89 70,103 72,122 C74,141 79,162 83,175 L117,175 C121,162 126,141 128,122 C130,103 128,89 124,84 Z"
                          fill={serColor.fill}
                          stroke={serColor.stroke}
                          strokeWidth={serColor.strokeWidth}
                        />
                        {/* Corazón decorativo */}
                        <path
                          d="M100,106 C100,106 94,99 90,102 C86,105 87,112 100,120 C113,112 114,105 110,102 C106,99 100,106 100,106 Z"
                          fill={serColor.accent}
                          fillOpacity="0.18"
                          stroke={serColor.stroke}
                          strokeWidth="0.8"
                          opacity="0.8"
                        />
                        {/* Líneas de estructura */}
                        <line
                          x1="82"
                          y1="138"
                          x2="90"
                          y2="138"
                          stroke={serColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.35"
                        />
                        <line
                          x1="90"
                          y1="138"
                          x2="90"
                          y2="145"
                          stroke={serColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.35"
                        />
                        <line
                          x1="110"
                          y1="138"
                          x2="118"
                          y2="138"
                          stroke={serColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.35"
                        />
                        <line
                          x1="110"
                          y1="138"
                          x2="110"
                          y2="145"
                          stroke={serColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.35"
                        />
                        <circle
                          cx="90"
                          cy="145"
                          r="1.5"
                          fill="none"
                          stroke={serColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.35"
                        />
                        <circle
                          cx="110"
                          cy="145"
                          r="1.5"
                          fill="none"
                          stroke={serColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.35"
                        />
                        <line
                          x1="78"
                          y1="162"
                          x2="122"
                          y2="162"
                          stroke={serColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.25"
                          strokeDasharray="2,2"
                        />
                      </g>

                      {/* BRAZOS — HACER */}
                      <g
                        onClick={() =>
                          !isDragging && setParteSeleccionada("hacer")
                        }
                        style={{ cursor: "pointer" }}
                        filter={
                          parteSeleccionada === "hacer"
                            ? "url(#glow-active)"
                            : "url(#glow-part)"
                        }
                      >
                        {/* Brazo izq */}
                        <ellipse
                          cx="72"
                          cy="90"
                          rx="7"
                          ry="6"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                        <rect
                          x="56"
                          y="88"
                          width="15"
                          height="40"
                          rx="6"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(-9,63,108)"
                        />
                        <circle
                          cx="59"
                          cy="130"
                          r="6"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth="0.7"
                        />
                        <rect
                          x="47"
                          y="128"
                          width="13"
                          height="34"
                          rx="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(-6,53,145)"
                        />
                        <ellipse
                          cx="47"
                          cy="163"
                          rx="8"
                          ry="5.5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                        {/* Brazo der */}
                        <ellipse
                          cx="128"
                          cy="90"
                          rx="7"
                          ry="6"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                        <rect
                          x="129"
                          y="88"
                          width="15"
                          height="40"
                          rx="6"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(9,137,108)"
                        />
                        <circle
                          cx="141"
                          cy="130"
                          r="6"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth="0.7"
                        />
                        <rect
                          x="140"
                          y="128"
                          width="13"
                          height="34"
                          rx="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(6,147,145)"
                        />
                        <ellipse
                          cx="153"
                          cy="163"
                          rx="8"
                          ry="5.5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                      </g>

                      {/* PIERNAS — HACER */}
                      <g
                        onClick={() =>
                          !isDragging && setParteSeleccionada("hacer")
                        }
                        style={{ cursor: "pointer" }}
                        filter={
                          parteSeleccionada === "hacer"
                            ? "url(#glow-active)"
                            : "url(#glow-part)"
                        }
                      >
                        <path
                          d="M80,175 L120,175 L122,194 L78,194 Z"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                        <rect
                          x="78"
                          y="192"
                          width="19"
                          height="50"
                          rx="8"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(-2,87,217)"
                        />
                        <circle
                          cx="84"
                          cy="244"
                          r="8"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth="0.7"
                        />
                        <rect
                          x="78"
                          y="250"
                          width="16"
                          height="46"
                          rx="7"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(1,86,273)"
                        />
                        <ellipse
                          cx="83"
                          cy="298"
                          rx="11"
                          ry="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                        <rect
                          x="103"
                          y="192"
                          width="19"
                          height="50"
                          rx="8"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(2,113,217)"
                        />
                        <circle
                          cx="116"
                          cy="244"
                          r="8"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth="0.7"
                        />
                        <rect
                          x="106"
                          y="250"
                          width="16"
                          height="46"
                          rx="7"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(-1,114,273)"
                        />
                        <ellipse
                          cx="117"
                          cy="298"
                          rx="11"
                          ry="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                      </g>
                    </g>
                  ) : (
                    /* ── NIÑA FRENTE ── */
                    <g>
                      {/* CABEZA — SABER */}
                      <g
                        onClick={() =>
                          !isDragging && setParteSeleccionada("saber")
                        }
                        style={{ cursor: "pointer" }}
                        filter={
                          parteSeleccionada === "saber"
                            ? "url(#glow-active)"
                            : "url(#glow-part)"
                        }
                      >
                        <ellipse
                          cx="100"
                          cy="44"
                          rx="24"
                          ry="26"
                          fill={saberColor.fill}
                          stroke={saberColor.stroke}
                          strokeWidth={saberColor.strokeWidth}
                        />
                        <ellipse
                          cx="91"
                          cy="42"
                          rx="4.5"
                          ry="5"
                          fill="white"
                          stroke={saberColor.stroke}
                          strokeWidth="0.6"
                        />
                        <ellipse
                          cx="109"
                          cy="42"
                          rx="4.5"
                          ry="5"
                          fill="white"
                          stroke={saberColor.stroke}
                          strokeWidth="0.6"
                        />
                        <circle
                          cx="93"
                          cy="40"
                          r="1.5"
                          fill={saberColor.accent}
                        />
                        <circle
                          cx="111"
                          cy="40"
                          r="1.5"
                          fill={saberColor.accent}
                        />
                        <circle
                          cx="94"
                          cy="39"
                          r="0.5"
                          fill="white"
                          opacity="0.8"
                        />
                        <circle
                          cx="112"
                          cy="39"
                          r="0.5"
                          fill="white"
                          opacity="0.8"
                        />
                        {/* Pestañas */}
                        <line
                          x1="87"
                          y1="36"
                          x2="85"
                          y2="33"
                          stroke={saberColor.stroke}
                          strokeWidth="0.7"
                          strokeLinecap="round"
                        />
                        <line
                          x1="91"
                          y1="35"
                          x2="91"
                          y2="32"
                          stroke={saberColor.stroke}
                          strokeWidth="0.7"
                          strokeLinecap="round"
                        />
                        <line
                          x1="95"
                          y1="36"
                          x2="97"
                          y2="33"
                          stroke={saberColor.stroke}
                          strokeWidth="0.7"
                          strokeLinecap="round"
                        />
                        <line
                          x1="105"
                          y1="36"
                          x2="103"
                          y2="33"
                          stroke={saberColor.stroke}
                          strokeWidth="0.7"
                          strokeLinecap="round"
                        />
                        <line
                          x1="109"
                          y1="35"
                          x2="109"
                          y2="32"
                          stroke={saberColor.stroke}
                          strokeWidth="0.7"
                          strokeLinecap="round"
                        />
                        <line
                          x1="113"
                          y1="36"
                          x2="115"
                          y2="33"
                          stroke={saberColor.stroke}
                          strokeWidth="0.7"
                          strokeLinecap="round"
                        />
                        {/* Boca */}
                        <path
                          d="M93,54 Q100,60 107,54"
                          fill="none"
                          stroke={saberColor.stroke}
                          strokeWidth="0.8"
                          strokeLinecap="round"
                        />
                        {/* Mejillas */}
                        <ellipse
                          cx="85"
                          cy="50"
                          rx="4"
                          ry="2.5"
                          fill={saberColor.accent}
                          opacity="0.12"
                        />
                        <ellipse
                          cx="115"
                          cy="50"
                          rx="4"
                          ry="2.5"
                          fill={saberColor.accent}
                          opacity="0.12"
                        />
                        {/* Orejas */}
                        <path
                          d="M76,38 Q72,44 76,50"
                          fill="none"
                          stroke={saberColor.stroke}
                          strokeWidth="0.8"
                          opacity="0.7"
                        />
                        <path
                          d="M124,38 Q128,44 124,50"
                          fill="none"
                          stroke={saberColor.stroke}
                          strokeWidth="0.8"
                          opacity="0.7"
                        />
                        {/* Cabello */}
                        <path
                          d="M77,26 Q75,10 80,6 Q90,2 100,4 Q110,2 120,6 Q125,10 123,26"
                          fill={saberColor.fill}
                          stroke={saberColor.stroke}
                          strokeWidth="1.2"
                        />
                        <path
                          d="M76,34 Q69,54 71,74 Q73,84 76,88"
                          fill="none"
                          stroke={saberColor.stroke}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          opacity="0.7"
                        />
                        <path
                          d="M124,34 Q131,54 129,74 Q127,84 124,88"
                          fill="none"
                          stroke={saberColor.stroke}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          opacity="0.7"
                        />
                        {/* Moño */}
                        <ellipse
                          cx="100"
                          cy="4"
                          rx="5"
                          ry="4"
                          fill={saberColor.fill}
                          stroke={saberColor.stroke}
                          strokeWidth="0.8"
                        />
                        <circle
                          cx="100"
                          cy="4"
                          r="1.5"
                          fill={saberColor.accent}
                          opacity="0.7"
                        />
                      </g>

                      {/* Cuello */}
                      <rect
                        x="93"
                        y="69"
                        width="14"
                        height="13"
                        rx="3"
                        fill="url(#body-base)"
                        stroke={accentColor}
                        strokeWidth="0.6"
                        opacity="0.5"
                      />

                      {/* TRONCO — SER */}
                      <g
                        onClick={() =>
                          !isDragging && setParteSeleccionada("ser")
                        }
                        style={{ cursor: "pointer" }}
                        filter={
                          parteSeleccionada === "ser"
                            ? "url(#glow-active)"
                            : "url(#glow-part)"
                        }
                      >
                        <path
                          d="M80,82 C76,87 74,100 76,116 C78,130 82,146 84,160 L116,160 C118,146 122,130 124,116 C126,100 124,87 120,82 Z"
                          fill={serColor.fill}
                          stroke={serColor.stroke}
                          strokeWidth={serColor.strokeWidth}
                        />
                        {/* Corazón */}
                        <path
                          d="M100,102 C100,102 94,95 90,98 C86,101 87,108 100,116 C113,108 114,101 110,98 C106,95 100,102 100,102 Z"
                          fill={serColor.accent}
                          fillOpacity="0.18"
                          stroke={serColor.stroke}
                          strokeWidth="0.8"
                          opacity="0.8"
                        />
                        <path
                          d="M84,82 Q100,88 116,82"
                          fill="none"
                          stroke={serColor.stroke}
                          strokeWidth="0.5"
                          opacity="0.4"
                        />
                        <line
                          x1="84"
                          y1="128"
                          x2="94"
                          y2="128"
                          stroke={serColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.3"
                        />
                        <line
                          x1="106"
                          y1="128"
                          x2="116"
                          y2="128"
                          stroke={serColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.3"
                        />
                        <circle
                          cx="100"
                          cy="128"
                          r="1.5"
                          fill="none"
                          stroke={serColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.35"
                        />
                      </g>

                      {/* BRAZOS — HACER */}
                      <g
                        onClick={() =>
                          !isDragging && setParteSeleccionada("hacer")
                        }
                        style={{ cursor: "pointer" }}
                        filter={
                          parteSeleccionada === "hacer"
                            ? "url(#glow-active)"
                            : "url(#glow-part)"
                        }
                      >
                        <ellipse
                          cx="76"
                          cy="87"
                          rx="6"
                          ry="5.5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                        <rect
                          x="62"
                          y="85"
                          width="13"
                          height="36"
                          rx="5.5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(-7,68,103)"
                        />
                        <circle
                          cx="63"
                          cy="123"
                          r="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth="0.7"
                        />
                        <rect
                          x="52"
                          y="121"
                          width="11"
                          height="30"
                          rx="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(-5,57,136)"
                        />
                        <ellipse
                          cx="51"
                          cy="153"
                          rx="7"
                          ry="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                        <ellipse
                          cx="124"
                          cy="87"
                          rx="6"
                          ry="5.5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                        <rect
                          x="125"
                          y="85"
                          width="13"
                          height="36"
                          rx="5.5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(7,132,103)"
                        />
                        <circle
                          cx="137"
                          cy="123"
                          r="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth="0.7"
                        />
                        <rect
                          x="137"
                          y="121"
                          width="11"
                          height="30"
                          rx="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(5,143,136)"
                        />
                        <ellipse
                          cx="149"
                          cy="153"
                          rx="7"
                          ry="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                      </g>

                      {/* FALDA + PIERNAS — HACER */}
                      <g
                        onClick={() =>
                          !isDragging && setParteSeleccionada("hacer")
                        }
                        style={{ cursor: "pointer" }}
                        filter={
                          parteSeleccionada === "hacer"
                            ? "url(#glow-active)"
                            : "url(#glow-part)"
                        }
                      >
                        <path
                          d="M82,160 L118,160 L126,206 L74,206 Z"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                        <line
                          x1="76"
                          y1="175"
                          x2="124"
                          y2="175"
                          stroke={hacerColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.3"
                        />
                        <line
                          x1="74"
                          y1="190"
                          x2="126"
                          y2="190"
                          stroke={hacerColor.stroke}
                          strokeWidth="0.4"
                          opacity="0.3"
                        />
                        <rect
                          x="80"
                          y="204"
                          width="15"
                          height="48"
                          rx="6"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(-2,87,228)"
                        />
                        <circle
                          cx="85"
                          cy="254"
                          r="7"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth="0.7"
                        />
                        <rect
                          x="80"
                          y="259"
                          width="13"
                          height="38"
                          rx="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(1,86,278)"
                        />
                        <ellipse
                          cx="83"
                          cy="299"
                          rx="10"
                          ry="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                        <rect
                          x="105"
                          y="204"
                          width="15"
                          height="48"
                          rx="6"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(2,113,228)"
                        />
                        <circle
                          cx="115"
                          cy="254"
                          r="7"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth="0.7"
                        />
                        <rect
                          x="107"
                          y="259"
                          width="13"
                          height="38"
                          rx="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                          transform="rotate(-1,114,278)"
                        />
                        <ellipse
                          cx="117"
                          cy="299"
                          rx="10"
                          ry="5"
                          fill={hacerColor.fill}
                          stroke={hacerColor.stroke}
                          strokeWidth={hacerColor.strokeWidth}
                        />
                      </g>
                    </g>
                  )
                ) : (
                  /* ── VISTA TRASERA UNIFICADA ── */
                  <g opacity="0.65">
                    <ellipse
                      cx="100"
                      cy="44"
                      rx="25"
                      ry="27"
                      fill={saberColor.fill}
                      stroke={saberColor.stroke}
                      strokeWidth="0.8"
                      strokeDasharray="2,1.5"
                    />
                    <path
                      d="M88,68 Q100,72 112,68"
                      fill="none"
                      stroke={saberColor.stroke}
                      strokeWidth="0.6"
                      opacity="0.4"
                    />
                    {genero === "F" ? (
                      <g>
                        <path
                          d="M77,26 Q75,10 80,6 Q90,2 100,4 Q110,2 120,6 Q125,10 123,26"
                          fill={saberColor.fill}
                          stroke={saberColor.stroke}
                          strokeWidth="1"
                        />
                        <path
                          d="M76,34 Q69,54 71,74 Q73,84 76,88"
                          fill="none"
                          stroke={saberColor.stroke}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          opacity="0.5"
                        />
                        <path
                          d="M124,34 Q131,54 129,74 Q127,84 124,88"
                          fill="none"
                          stroke={saberColor.stroke}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          opacity="0.5"
                        />
                      </g>
                    ) : (
                      <path
                        d="M76,24 Q80,13 100,16 Q120,13 124,24"
                        fill={saberColor.fill}
                        stroke={saberColor.stroke}
                        strokeWidth="1"
                      />
                    )}
                    <rect
                      x="93"
                      y="70"
                      width="14"
                      height="14"
                      rx="3"
                      fill="url(#body-base)"
                      stroke={accentColor}
                      strokeWidth="0.5"
                      opacity="0.4"
                    />
                    <path
                      d="M76,84 C72,89 70,103 72,122 C74,141 79,162 83,175 L117,175 C121,162 126,141 128,122 C130,103 128,89 124,84 Z"
                      fill={serColor.fill}
                      stroke={serColor.stroke}
                      strokeWidth="0.8"
                      strokeDasharray="2,1.5"
                    />
                    <line
                      x1="100"
                      y1="86"
                      x2="100"
                      y2="172"
                      stroke={serColor.stroke}
                      strokeWidth="0.5"
                      opacity="0.25"
                      strokeDasharray="3,2"
                    />
                    <ellipse
                      cx="72"
                      cy="90"
                      rx="7"
                      ry="6"
                      fill={hacerColor.fill}
                      stroke={hacerColor.stroke}
                      strokeWidth="0.7"
                      strokeDasharray="2,1.5"
                    />
                    <rect
                      x="56"
                      y="88"
                      width="15"
                      height="40"
                      rx="6"
                      fill={hacerColor.fill}
                      stroke={hacerColor.stroke}
                      strokeWidth="0.7"
                      strokeDasharray="2,1.5"
                      transform="rotate(-9,63,108)"
                    />
                    <ellipse
                      cx="128"
                      cy="90"
                      rx="7"
                      ry="6"
                      fill={hacerColor.fill}
                      stroke={hacerColor.stroke}
                      strokeWidth="0.7"
                      strokeDasharray="2,1.5"
                    />
                    <rect
                      x="129"
                      y="88"
                      width="15"
                      height="40"
                      rx="6"
                      fill={hacerColor.fill}
                      stroke={hacerColor.stroke}
                      strokeWidth="0.7"
                      strokeDasharray="2,1.5"
                      transform="rotate(9,137,108)"
                    />
                    <path
                      d="M80,175 L120,175 L122,194 L78,194 Z"
                      fill={hacerColor.fill}
                      stroke={hacerColor.stroke}
                      strokeWidth="0.7"
                      strokeDasharray="2,1.5"
                    />
                    <rect
                      x="78"
                      y="192"
                      width="19"
                      height="100"
                      rx="8"
                      fill={hacerColor.fill}
                      stroke={hacerColor.stroke}
                      strokeWidth="0.7"
                      strokeDasharray="2,1.5"
                      transform="rotate(-2,87,242)"
                    />
                    <rect
                      x="103"
                      y="192"
                      width="19"
                      height="100"
                      rx="8"
                      fill={hacerColor.fill}
                      stroke={hacerColor.stroke}
                      strokeWidth="0.7"
                      strokeDasharray="2,1.5"
                      transform="rotate(2,113,242)"
                    />
                  </g>
                )}

                {/* Sombra de suelo */}
                <ellipse
                  cx="100"
                  cy="316"
                  rx="38"
                  ry="5"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="0.6"
                  opacity="0.15"
                  strokeDasharray="3,2"
                />
                <ellipse
                  cx="100"
                  cy="316"
                  rx="22"
                  ry="3"
                  fill={accentColor}
                  fillOpacity="0.06"
                  stroke={accentColor}
                  strokeWidth="0.4"
                  opacity="0.3"
                />
              </svg>
            </div>

            {/* Hint arrastrar */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="text-[8px] font-mono tracking-wider text-orange-400 font-bold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                {isDragging ? "◈ Rotando" : "◂ Arrastrar para rotar ▸"}
              </span>
            </div>
          </div>

          {/* Barra inferior de estado */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50/60">
            <span className="text-[8px] font-mono tracking-widest text-gray-400 font-bold">
              ROT {Math.round(((rotY % 360) + 360) % 360)}°
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest text-orange-500">
              {showBack ? "Vista Posterior" : "Vista Frontal"}
            </span>
            <span className="text-[8px] font-mono tracking-widest text-gray-400 font-bold">
              {genero === "M" ? "MASC" : "FEM"}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            COLUMNA DERECHA: DIMENSIONES
        ═══════════════════════════════════════ */}
        <div className="space-y-3">
          <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-px h-4 bg-orange-500" />
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Dimensiones del Ministerio de Educación
              </h3>
            </div>

            <div className="space-y-2">
              {/* SER */}
              <button
                onClick={() =>
                  setParteSeleccionada(
                    parteSeleccionada === "ser" ? null : "ser",
                  )
                }
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  parteSeleccionada === "ser"
                    ? "border-orange-500 bg-orange-50/20"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Heart size={14} className="text-violet-500 shrink-0" />
                    <div>
                      <p className="font-black text-gray-900 text-[11px]">
                        SER
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5 font-mono">
                        Valores y Afectividad · {promedios.ser}/10
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${chinaSer.color.split(" ")[1]} ${chinaSer.color.split(" ")[2]} ${chinaSer.color.split(" ")[3]}`}
                  >
                    {promedios.ser > 0
                      ? chinaSer.label.split(" ")[0] +
                        " " +
                        chinaSer.label.split(" ")[1]
                      : "S/R"}
                  </span>
                </div>
                {parteSeleccionada === "ser" && (
                  <p className="text-[10px] text-gray-500 font-medium mt-2 leading-relaxed border-t border-gray-100 pt-2">
                    Representa los valores del estudiante en el aula:
                    compañerismo, respeto, autonomía y hábitos de higiene.
                  </p>
                )}
              </button>

              {/* SABER */}
              <button
                onClick={() =>
                  setParteSeleccionada(
                    parteSeleccionada === "saber" ? null : "saber",
                  )
                }
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  parteSeleccionada === "saber"
                    ? "border-orange-500 bg-orange-50/20"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lightbulb size={14} className="text-orange-500 shrink-0" />
                    <div>
                      <p className="font-black text-gray-900 text-[11px]">
                        SABER
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5 font-mono">
                        Cognición y Comprensión · {promedios.saber}/45
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${chinaSaber.color.split(" ")[1]} ${chinaSaber.color.split(" ")[2]} ${chinaSaber.color.split(" ")[3]}`}
                  >
                    {promedios.saber > 0
                      ? chinaSaber.label.split(" ")[0] +
                        " " +
                        chinaSaber.label.split(" ")[1]
                      : "S/R"}
                  </span>
                </div>
                {parteSeleccionada === "saber" && (
                  <p className="text-[10px] text-gray-500 font-medium mt-2 leading-relaxed border-t border-gray-100 pt-2">
                    Capacidad de comprensión, identificación de formas, lógica
                    matemática y reconocimiento del entorno.
                  </p>
                )}
              </button>

              {/* HACER */}
              <button
                onClick={() =>
                  setParteSeleccionada(
                    parteSeleccionada === "hacer" ? null : "hacer",
                  )
                }
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  parteSeleccionada === "hacer"
                    ? "border-orange-500 bg-orange-50/20"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Activity size={14} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-black text-gray-900 text-[11px]">
                        HACER
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5 font-mono">
                        Expresión Corporal y Arte · {promedios.hacer}/40
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${chinaHacer.color.split(" ")[1]} ${chinaHacer.color.split(" ")[2]} ${chinaHacer.color.split(" ")[3]}`}
                  >
                    {promedios.hacer > 0
                      ? chinaHacer.label.split(" ")[0] +
                        " " +
                        chinaHacer.label.split(" ")[1]
                      : "S/R"}
                  </span>
                </div>
                {parteSeleccionada === "hacer" && (
                  <p className="text-[10px] text-gray-500 font-medium mt-2 leading-relaxed border-t border-gray-100 pt-2">
                    Desarrollo físico, coordinación motriz, destreza en pintura,
                    dibujo y expresión artística.
                  </p>
                )}
              </button>

              {/* DECIDIR */}
              <button
                onClick={() =>
                  setParteSeleccionada(
                    parteSeleccionada === "decidir" ? null : "decidir",
                  )
                }
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  parteSeleccionada === "decidir"
                    ? "border-orange-500 bg-orange-50/20"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Award size={14} className="text-sky-500 shrink-0" />
                    <div>
                      <p className="font-black text-gray-900 text-[11px]">
                        DECIDIR
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5 font-mono">
                        Autonomía y Toma de Decisiones · {promedios.decidir}/5
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${chinaDecidir.color.split(" ")[1]} ${chinaDecidir.color.split(" ")[2]} ${chinaDecidir.color.split(" ")[3]}`}
                  >
                    {promedios.decidir > 0
                      ? chinaDecidir.label.split(" ")[0] +
                        " " +
                        chinaDecidir.label.split(" ")[1]
                      : "S/R"}
                  </span>
                </div>
                {parteSeleccionada === "decidir" && (
                  <p className="text-[10px] text-gray-500 font-medium mt-2 leading-relaxed border-t border-gray-100 pt-2">
                    Capacidad del estudiante para tomar decisiones, resolver
                    situaciones cotidianas y actuar con criterio propio.
                  </p>
                )}
              </button>
            </div>
          </div>

          {/* Leyenda */}
          <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Escala de Evaluación Oficial
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                {
                  label: "Desarrollo Pleno",
                  color: "bg-emerald-50 text-emerald-600 border-emerald-100",
                },
                {
                  label: "Desarrollo Óptimo",
                  color: "bg-indigo-50 text-indigo-600 border-indigo-100",
                },
                {
                  label: "Desarro. Aceptable",
                  color: "bg-amber-50 text-amber-600 border-amber-100",
                },
                {
                  label: "En Desarrollo",
                  color: "bg-red-50 text-red-600 border-red-100",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${item.color}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                  <span className="text-[8px] font-black uppercase tracking-tight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer del Sistema */}
          <div className="flex items-center gap-2 px-1 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
            <p className="text-[8px] font-mono text-gray-400 font-bold tracking-wider">
              KINDERAPP · SISTEMA DE GESTIÓN EDUCATIVA BOLIVIANA ·{" "}
              {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

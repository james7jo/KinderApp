"use client";

import { useState } from "react";
import {
  WifiOff,
  RefreshCw,
  MapPin,
  Maximize2,
  X,
  Activity,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

type Camara = {
  id: string;
  nombre: string;
  ubicacion: string | null;
  stream_url: string;
  activa: boolean;
};

function StreamView({
  camara,
  compact = false,
}: {
  camara: Camara;
  compact?: boolean;
}) {
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <div className="relative w-full h-full bg-slate-950 group">
      {!error ? (
        <img
          key={key}
          src={camara.stream_url}
          alt={camara.nombre}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 bg-slate-900">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center animate-pulse">
            <WifiOff size={24} className="text-slate-500" />
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm font-black uppercase tracking-widest">
              Señal Perdida
            </p>
            {!compact && (
              <p className="text-slate-600 text-[10px] mt-1 font-mono">
                {camara.stream_url}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setError(false);
              setKey((k) => k + 1);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl text-xs font-black hover:bg-orange-500 hover:text-white transition-all"
          >
            <RefreshCw size={14} /> RECONECTAR
          </button>
        </div>
      )}

      {/* Overlay de estado Tecnológico */}
      {!error && (
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-2xl">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-white text-[10px] font-black tracking-[0.2em] uppercase">
              Rec: 24/7
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalStream({
  camara,
  onClose,
}: {
  camara: Camara;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-black text-white text-lg leading-none uppercase tracking-tighter">
              {camara.nombre}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                Transmisión Encriptada
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-11 h-11 bg-white/5 hover:bg-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all text-white/50 group"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform" />
        </button>
      </div>
      <div className="flex-1 relative flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl aspect-video rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10">
          <StreamView camara={camara} />
        </div>
      </div>
    </div>
  );
}

export default function CamaraStreamMaestra({ camara }: { camara: Camara }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="group relative bg-white rounded-[2.5rem] p-2 border border-slate-100 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500">
        {/* Stream Container */}
        <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-50 shadow-inner">
          <StreamView camara={camara} compact />

          {/* Botón Flotante Pro */}
          <button
            onClick={() => setShowModal(true)}
            className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-all flex items-center justify-center z-10"
          >
            <div className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl">
              <Maximize2 size={16} className="text-slate-900" />
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                Expandir Señal
              </span>
            </div>
          </button>
        </div>

        {/* Info Footer */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors">
              <Activity
                size={18}
                className="text-slate-400 group-hover:text-orange-500 transition-colors"
              />
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-sm truncate leading-tight group-hover:text-orange-600 transition-colors">
                {camara.nombre}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin size={10} className="text-slate-300 shrink-0" />
                <p className="text-slate-400 text-[10px] font-bold truncate uppercase">
                  {camara.ubicacion || "Área General"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-10 h-10 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all active:scale-90"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {showModal && (
        <ModalStream camara={camara} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

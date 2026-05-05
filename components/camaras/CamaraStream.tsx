"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  camara: {
    id: string;
    nombre: string;
    ubicacion: string | null;
    stream_url: string;
    activa: boolean;
  };
  showDelete?: boolean;
}

export default function CamaraStream({ camara, showDelete = true }: Props) {
  const [error, setError] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleEliminar() {
    if (!confirm("¿Desactivar esta cámara?")) return;
    setEliminando(true);
    await supabase
      .from("camaras")
      .update({ activa: false })
      .eq("id", camara.id);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500" />

      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${error ? "bg-red-400" : "bg-green-500 animate-pulse"}`}
          />
          <div>
            <p className="font-black text-gray-900 text-sm">{camara.nombre}</p>
            {camara.ubicacion && (
              <p className="text-gray-400 text-xs">📍 {camara.ubicacion}</p>
            )}
          </div>
        </div>
        {showDelete && (
          <button
            onClick={handleEliminar}
            disabled={eliminando}
            className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        )}
      </div>

      <div className="relative bg-gray-900" style={{ aspectRatio: "16/9" }}>
        {!error ? (
          <img
            src={camara.stream_url}
            alt={camara.nombre}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <WifiOff size={32} className="text-gray-600" />
            <p className="text-gray-500 text-sm font-medium">Sin señal</p>
            <p className="text-gray-600 text-xs px-4 text-center">
              {camara.stream_url}
            </p>
          </div>
        )}
        {!error && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur rounded-lg px-2 py-1">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-xs font-bold">EN VIVO</span>
          </div>
        )}
      </div>
    </div>
  );
}

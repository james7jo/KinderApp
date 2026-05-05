"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NuevaCamaraButton({
  colegioId,
}: {
  colegioId: string;
}) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await supabase.from("camaras").insert({
      colegio_id: colegioId,
      nombre,
      ubicacion: ubicacion || null,
      stream_url: streamUrl,
      activa: true,
    });

    setNombre("");
    setUbicacion("");
    setStreamUrl("");
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-orange-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-orange-200"
      >
        <Plus size={18} />
        <span className="hidden sm:inline">Nueva cámara</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-gray-900 text-lg">Nueva cámara</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAgregar} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Nombre *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Aula Principal, Entrada..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Ubicación
                </label>
                <input
                  type="text"
                  placeholder="Ej: Primer piso, Patio..."
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  URL del stream *
                </label>
                <input
                  type="text"
                  placeholder="http://192.168.x.x:8080/video"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3 rounded-xl transition-all mt-2 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                {loading ? "Agregando..." : "Agregar cámara"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

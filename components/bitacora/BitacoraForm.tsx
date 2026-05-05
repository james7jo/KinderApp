"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

type EstadoAnimo =
  | "feliz"
  | "triste"
  | "travieso"
  | "cansado"
  | "enfermo"
  | "normal";

const ESTADOS: { value: EstadoAnimo; emoji: string; label: string }[] = [
  { value: "feliz", emoji: "😊", label: "Feliz" },
  { value: "normal", emoji: "😐", label: "Normal" },
  { value: "triste", emoji: "😢", label: "Triste" },
  { value: "travieso", emoji: "😈", label: "Travieso" },
  { value: "cansado", emoji: "😴", label: "Cansado" },
  { value: "enfermo", emoji: "🤒", label: "Enfermo" },
];

interface Props {
  alumnoId: string;
  maestraId: string;
  fecha: string;
  bitacoraExistente: any | null;
}

export default function BitacoraForm({
  alumnoId,
  maestraId,
  fecha,
  bitacoraExistente,
}: Props) {
  const [open, setOpen] = useState(false);
  const [comio, setComio] = useState<boolean | null>(
    bitacoraExistente?.comio ?? null,
  );
  const [estado, setEstado] = useState<EstadoAnimo | "">(
    bitacoraExistente?.estado_animo ?? "",
  );
  const [actividades, setActividades] = useState(
    bitacoraExistente?.actividades ?? "",
  );
  const [observaciones, setObservaciones] = useState(
    bitacoraExistente?.observaciones ?? "",
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleGuardar() {
    setSaving(true);

    const data = {
      alumno_id: alumnoId,
      maestra_id: maestraId,
      fecha,
      comio,
      estado_animo: estado || null,
      actividades: actividades || null,
      observaciones: observaciones || null,
    };

    if (bitacoraExistente) {
      await supabase
        .from("bitacoras")
        .update(data)
        .eq("id", bitacoraExistente.id);
    } else {
      await supabase.from("bitacoras").insert(data);
    }

    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="border-t border-gray-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
      >
        <span>{bitacoraExistente ? "Editar bitácora" : "Llenar bitácora"}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-4">
          {/* Comió */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              ¿Comió hoy?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: true, label: "✅ Sí" },
                { value: false, label: "❌ No" },
                { value: null, label: "— N/A" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setComio(opt.value)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    comio === opt.value
                      ? "bg-orange-500 text-white"
                      : "bg-gray-50 text-gray-500 hover:bg-orange-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de ánimo */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Estado de ánimo
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ESTADOS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEstado(e.value)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                    estado === e.value
                      ? "bg-orange-500 text-white"
                      : "bg-gray-50 text-gray-500 hover:bg-orange-50"
                  }`}
                >
                  <span className="text-lg">{e.emoji}</span>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actividades */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Actividades del día
            </p>
            <input
              type="text"
              placeholder="Ej: Recorte de papel, pintura..."
              value={actividades}
              onChange={(e) => setActividades(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Observaciones */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Observaciones
            </p>
            <textarea
              placeholder="Algo que el papá deba saber..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <button
            onClick={handleGuardar}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3 rounded-xl transition-all active:scale-95"
          >
            {saving ? "Guardando..." : "✓ Guardar bitácora"}
          </button>
        </div>
      )}
    </div>
  );
}

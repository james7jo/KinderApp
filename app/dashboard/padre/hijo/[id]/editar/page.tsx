"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function EditarHijoPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tipo_sangre: "",
    alergias: "",
    enfermedades_cronicas: "",
    capacidades_diferentes: "",
    medicamentos: "",
    medico_cabecera: "",
    telefono_medico: "",
    tiene_seguro: false,
    nombre_seguro: "",
    numero_seguro: "",
    notas_especiales: "",
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!id || id === "undefined") return;
    async function cargar() {
      setLoading(true);
      const { data } = await supabase
        .from("alumnos")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setForm({
          tipo_sangre: data.tipo_sangre ?? "",
          alergias: data.alergias ?? "",
          enfermedades_cronicas: data.enfermedades_cronicas ?? "",
          capacidades_diferentes: data.capacidades_diferentes ?? "",
          medicamentos: data.medicamentos ?? "",
          medico_cabecera: data.medico_cabecera ?? "",
          telefono_medico: data.telefono_medico ?? "",
          tiene_seguro: data.tiene_seguro ?? false,
          nombre_seguro: data.nombre_seguro ?? "",
          numero_seguro: data.numero_seguro ?? "",
          notas_especiales: data.notas_especiales ?? "",
        });
      }
      setLoading(false);
    }
    cargar();
  }, [id]);

  function handleChange(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError("");

    const { error } = await supabase.from("alumnos").update(form).eq("id", id);

    if (error) {
      setError("Error al guardar");
      setSaving(false);
      return;
    }

    router.push(`/dashboard/padre/hijo/${id}`);
    router.refresh();
  }

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 font-bold">Cargando...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/padre/hijo/${id}`}
            className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <h1 className="text-lg font-black text-gray-900">Editar perfil</h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="px-5 pt-6 max-w-lg mx-auto">
        {/* MÉDICA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
            🩺 Información médica
          </h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Tipo de sangre
                </label>
                <select
                  value={form.tipo_sangre}
                  onChange={(e) => handleChange("tipo_sangre", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                >
                  <option value="">—</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Alergias
                </label>
                <input
                  type="text"
                  placeholder="Polen, maní..."
                  value={form.alergias}
                  onChange={(e) => handleChange("alergias", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                Enfermedades crónicas
              </label>
              <input
                type="text"
                placeholder="Asma, diabetes..."
                value={form.enfermedades_cronicas}
                onChange={(e) =>
                  handleChange("enfermedades_cronicas", e.target.value)
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                Capacidades diferentes
              </label>
              <input
                type="text"
                placeholder="Describe si aplica..."
                value={form.capacidades_diferentes}
                onChange={(e) =>
                  handleChange("capacidades_diferentes", e.target.value)
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                Medicamentos
              </label>
              <input
                type="text"
                placeholder="Nombre y dosis..."
                value={form.medicamentos}
                onChange={(e) => handleChange("medicamentos", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Médico / Pediatra
                </label>
                <input
                  type="text"
                  placeholder="Dr. Nombre..."
                  value={form.medico_cabecera}
                  onChange={(e) =>
                    handleChange("medico_cabecera", e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Teléfono médico
                </label>
                <input
                  type="tel"
                  placeholder="77700000"
                  value={form.telefono_medico}
                  onChange={(e) =>
                    handleChange("telefono_medico", e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SEGURO */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="font-black text-gray-900 mb-4">🏥 Seguro médico</h2>
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => handleChange("tiene_seguro", !form.tiene_seguro)}
              className={`w-12 h-6 rounded-full transition-all relative ${form.tiene_seguro ? "bg-orange-500" : "bg-gray-200"}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${form.tiene_seguro ? "left-6" : "left-0.5"}`}
              />
            </button>
            <span className="text-sm font-bold text-gray-700">
              Tiene seguro médico
            </span>
          </div>
          {form.tiene_seguro && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Nombre del seguro
                </label>
                <input
                  type="text"
                  placeholder="Caja Nacional..."
                  value={form.nombre_seguro}
                  onChange={(e) =>
                    handleChange("nombre_seguro", e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Número de póliza
                </label>
                <input
                  type="text"
                  placeholder="12345678"
                  value={form.numero_seguro}
                  onChange={(e) =>
                    handleChange("numero_seguro", e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* NOTAS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="font-black text-gray-900 mb-4">📝 Notas especiales</h2>
          <textarea
            placeholder="Cualquier información adicional importante..."
            value={form.notas_especiales}
            onChange={(e) => handleChange("notas_especiales", e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-500 text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-sm shadow-orange-200 flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

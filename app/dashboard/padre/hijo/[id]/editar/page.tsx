"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Heart,
  Shield,
  FileText,
  Loader2,
} from "lucide-react";

export default function EditarHijoPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tipo_sangre: "",
    alergias: "",
    enfermedades_cronicas: "",
    capacidades_diferentes: "",
    medicamentos: "",
    dosis_medicamento: "",
    horario_medicamento: "",
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
          dosis_medicamento: data.dosis_medicamento ?? "",
          horario_medicamento: data.horario_medicamento ?? "",
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

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError("");
    const { error } = await supabase.from("alumnos").update(form).eq("id", id);
    if (error) {
      setError("Error al guardar. Intentá de nuevo.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      router.push(`/dashboard/padre/hijo/${id}`);
      router.refresh();
    }, 700);
  }

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-nunito">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="font-bold">Cargando...</span>
        </div>
      </div>
    );

  const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-gray-50/50";
  const labelCls =
    "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block";

  return (
    <main className="min-w-0 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/padre/hijo/${id}`}
            className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Perfil del niño
            </p>
            <h1 className="text-lg font-black text-gray-900 leading-tight">
              Editar información
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 text-sm font-black px-4 py-2 rounded-xl transition-all active:scale-95 ${
            saved
              ? "bg-green-500 text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
          } disabled:opacity-40`}
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saved ? "Guardado" : saving ? "..." : "Guardar"}
        </button>
      </div>

      <form onSubmit={handleSave} className="px-4 lg:px-7 pt-5 pb-10">
        {/* PC: 2 columnas | Móvil: 1 columna */}
        <div className="max-w-4xl mx-auto lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
          {/* ── COLUMNA IZQUIERDA ── */}
          <div className="space-y-4">
            {/* Info médica */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 bg-red-50/50">
                <Heart size={15} className="text-red-400" />
                <h2 className="font-black text-gray-900 text-sm">
                  Información médica
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tipo de sangre</label>
                    <select
                      value={form.tipo_sangre}
                      onChange={(e) => set("tipo_sangre", e.target.value)}
                      className={inputCls}
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
                    <label className={labelCls}>Alergias</label>
                    <input
                      type="text"
                      placeholder="Polen, maní..."
                      value={form.alergias}
                      onChange={(e) => set("alergias", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Enfermedades crónicas</label>
                  <input
                    type="text"
                    placeholder="Asma, diabetes..."
                    value={form.enfermedades_cronicas}
                    onChange={(e) =>
                      set("enfermedades_cronicas", e.target.value)
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Capacidades diferentes</label>
                  <input
                    type="text"
                    placeholder="Describe si aplica..."
                    value={form.capacidades_diferentes}
                    onChange={(e) =>
                      set("capacidades_diferentes", e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Medicamentos */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 bg-violet-50/50">
                <Shield size={15} className="text-violet-400" />
                <h2 className="font-black text-gray-900 text-sm">
                  Medicamentos
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className={labelCls}>Nombre del medicamento</label>
                  <input
                    type="text"
                    placeholder="Ej: Amoxicilina, Paracetamol..."
                    value={form.medicamentos}
                    onChange={(e) => set("medicamentos", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Dosis</label>
                    <input
                      type="text"
                      placeholder="Ej: 250mg, 5ml..."
                      value={form.dosis_medicamento}
                      onChange={(e) => set("dosis_medicamento", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Horario</label>
                    <input
                      type="text"
                      placeholder="Ej: 8am y 4pm..."
                      value={form.horario_medicamento}
                      onChange={(e) =>
                        set("horario_medicamento", e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
                {(form.medicamentos ||
                  form.dosis_medicamento ||
                  form.horario_medicamento) && (
                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                    <p className="text-[10px] font-black text-violet-500 uppercase tracking-wide mb-1">
                      Resumen
                    </p>
                    <p className="text-sm font-bold text-gray-700">
                      {form.medicamentos || "—"}
                      {form.dosis_medicamento
                        ? ` · ${form.dosis_medicamento}`
                        : ""}
                      {form.horario_medicamento
                        ? ` · ${form.horario_medicamento}`
                        : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── COLUMNA DERECHA ── */}
          <div className="space-y-4">
            {/* Médico */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 bg-sky-50/50">
                <Heart size={15} className="text-sky-400" />
                <h2 className="font-black text-gray-900 text-sm">
                  Médico de cabecera
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className={labelCls}>
                    Nombre del médico / Pediatra
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. Nombre Apellido"
                    value={form.medico_cabecera}
                    onChange={(e) => set("medico_cabecera", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Teléfono de emergencia</label>
                  <input
                    type="tel"
                    placeholder="77700000"
                    value={form.telefono_medico}
                    onChange={(e) => set("telefono_medico", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Seguro médico */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={15} className="text-green-400" />
                  <h2 className="font-black text-gray-900 text-sm">
                    Seguro médico
                  </h2>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => set("tiene_seguro", !form.tiene_seguro)}
                  className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${form.tiene_seguro ? "bg-orange-500" : "bg-gray-200"}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${form.tiene_seguro ? "left-6" : "left-0.5"}`}
                  />
                </button>
              </div>
              {form.tiene_seguro && (
                <div className="p-5 grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nombre del seguro</label>
                    <input
                      type="text"
                      placeholder="Caja Nacional..."
                      value={form.nombre_seguro}
                      onChange={(e) => set("nombre_seguro", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Número de póliza</label>
                    <input
                      type="text"
                      placeholder="12345678"
                      value={form.numero_seguro}
                      onChange={(e) => set("numero_seguro", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
              {!form.tiene_seguro && (
                <div className="px-5 py-3">
                  <p className="text-sm text-gray-400 font-medium">
                    Sin seguro médico registrado
                  </p>
                </div>
              )}
            </div>

            {/* Notas especiales */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 bg-amber-50/50">
                <FileText size={15} className="text-amber-500" />
                <h2 className="font-black text-gray-900 text-sm">
                  Notas especiales
                </h2>
              </div>
              <div className="p-5">
                <textarea
                  placeholder="Información adicional importante para la maestra..."
                  value={form.notas_especiales}
                  onChange={(e) => set("notas_especiales", e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm font-bold">⚠ {error}</p>
          </div>
        )}

        {/* Botón móvil */}
        <div className="max-w-4xl mx-auto mt-5 lg:hidden">
          <button
            type="submit"
            disabled={saving}
            className={`w-full font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
              saved
                ? "bg-green-500 text-white"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
            } disabled:opacity-40`}
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saved ? "Guardado" : saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </main>
  );
}

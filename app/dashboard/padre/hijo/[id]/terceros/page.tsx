"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Edit2,
  X,
  Check,
  Shield,
  Phone,
} from "lucide-react";

type Tercero = {
  id: string;
  full_name: string;
  relacion: string;
  telefono: string | null;
  documento_identidad: string | null;
  notas: string | null;
};

export default function TercerosPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [alumnoNombre, setAlumnoNombre] = useState("");
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [fullName, setFullName] = useState("");
  const [relacion, setRelacion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [documento, setDocumento] = useState("");
  const [notas, setNotas] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const cargarData = useCallback(async () => {
    const { data: alumno } = await supabase
      .from("alumnos")
      .select("nombre, apellido")
      .eq("id", id)
      .single();
    setAlumnoNombre(`${alumno?.nombre} ${alumno?.apellido}`);

    const { data } = await supabase
      .from("terceros_autorizados")
      .select("*")
      .eq("alumno_id", id)
      .order("created_at", { ascending: true });
    setTerceros(data ?? []);
  }, [id]);

  useEffect(() => {
    if (id) cargarData();
  }, [id, cargarData]);

  function resetForm() {
    setFullName("");
    setRelacion("");
    setTelefono("");
    setDocumento("");
    setNotas("");
    setEditandoId(null);
  }

  function cargarParaEditar(t: Tercero) {
    setEditandoId(t.id);
    setFullName(t.full_name);
    setRelacion(t.relacion);
    setTelefono(t.telefono ?? "");
    setDocumento(t.documento_identidad ?? "");
    setNotas(t.notas ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      alumno_id: id,
      full_name: fullName,
      relacion,
      telefono: telefono || null,
      documento_identidad: documento || null,
      notas: notas || null,
    };

    if (editandoId) {
      await supabase
        .from("terceros_autorizados")
        .update(payload)
        .eq("id", editandoId);
      setSuccess("✅ Persona actualizada");
    } else {
      await supabase.from("terceros_autorizados").insert(payload);
      setSuccess("✅ Persona agregada");
    }

    resetForm();
    await cargarData();
    setLoading(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleEliminar(terceroId: string) {
    if (!confirm("¿Eliminar esta persona?")) return;
    await supabase.from("terceros_autorizados").delete().eq("id", terceroId);
    await cargarData();
  }

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center gap-4">
        <Link
          href={`/dashboard/padre/hijo/${id}`}
          className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">{alumnoNombre}</p>
          <h1 className="text-lg font-black text-gray-900">
            Autorizados para recoger
          </h1>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {/* FORMULARIO */}
        <form onSubmit={handleGuardar} className="flex flex-col gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
              {editandoId
                ? "✏️ Editando persona"
                : "Agregar persona autorizada"}
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Carlos López"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Relación *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "Tío/a",
                    "Abuelo/a",
                    "Hermano/a",
                    "Padrino/a",
                    "Vecino/a",
                    "Otro",
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRelacion(r)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        relacion === r
                          ? "bg-orange-500 text-white"
                          : "bg-gray-50 text-gray-500 hover:bg-orange-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="O escribí la relación..."
                  value={relacion}
                  onChange={(e) => setRelacion(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    placeholder="77700000"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    CI / Documento
                  </label>
                  <input
                    type="text"
                    placeholder="12345678"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Notas
                </label>
                <input
                  type="text"
                  placeholder="Ej: Solo puede recoger los viernes..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <p className="text-green-600 text-sm font-bold">{success}</p>
            </div>
          )}

          <div className="flex gap-3">
            {editandoId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-100 text-gray-600 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2"
              >
                <X size={18} /> Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !relacion}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 shadow-sm shadow-orange-200 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {loading
                ? "Guardando..."
                : editandoId
                  ? "Actualizar"
                  : "Agregar persona"}
            </button>
          </div>
        </form>

        {/* LISTA */}
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
          Autorizados ({terceros.length})
        </h2>

        {terceros.length > 0 ? (
          <div className="flex flex-col gap-3">
            {terceros.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
                      <Shield size={20} className="text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-900">{t.full_name}</p>
                      <p className="text-gray-400 text-xs font-medium capitalize">
                        {t.relacion}
                      </p>
                      {t.documento_identidad && (
                        <p className="text-gray-300 text-xs">
                          CI: {t.documento_identidad}
                        </p>
                      )}
                      {t.notas && (
                        <p className="text-orange-400 text-xs mt-1 font-medium">
                          📝 {t.notas}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {t.telefono && (
                      <a
                        href={`tel:${t.telefono}`}
                        className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center"
                      >
                        <Phone size={14} className="text-green-500" />
                      </a>
                    )}
                    <button
                      onClick={() => cargarParaEditar(t)}
                      className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all"
                    >
                      <Edit2 size={14} className="text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleEliminar(t.id)}
                      className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-4xl mb-3">🛡️</p>
            <p className="text-gray-400 text-sm font-medium">
              No hay personas autorizadas aún
            </p>
            <p className="text-gray-300 text-xs mt-1">
              Agregá familiares o conocidos de confianza
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

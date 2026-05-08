"use client";
import { useState, useEffect, useCallback, useRef } from "react";
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
  Camera,
  Loader2,
} from "lucide-react";

type Tercero = {
  id: string;
  full_name: string;
  relacion: string;
  telefono: string | null;
  documento_identidad: string | null;
  notas: string | null;
  foto_url: string | null;
};

export default function TercerosPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [alumnoNombre, setAlumnoNombre] = useState("");
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [fullName, setFullName] = useState("");
  const [relacion, setRelacion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [documento, setDocumento] = useState("");
  const [notas, setNotas] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cargar = useCallback(async () => {
    const [{ data: alumno }, { data }] = await Promise.all([
      supabase.from("alumnos").select("nombre, apellido").eq("id", id).single(),
      supabase
        .from("terceros_autorizados")
        .select("*")
        .eq("alumno_id", id)
        .order("created_at", { ascending: true }),
    ]);
    setAlumnoNombre(`${alumno?.nombre} ${alumno?.apellido}`);
    setTerceros(data ?? []);
  }, [id]);

  useEffect(() => {
    if (id) cargar();
  }, [id, cargar]);

  function resetForm() {
    setFullName("");
    setRelacion("");
    setTelefono("");
    setDocumento("");
    setNotas("");
    setFotoFile(null);
    setFotoPreview(null);
    setEditandoId(null);
  }

  function cargarParaEditar(t: Tercero) {
    setEditandoId(t.id);
    setFullName(t.full_name);
    setRelacion(t.relacion);
    setTelefono(t.telefono ?? "");
    setDocumento(t.documento_identidad ?? "");
    setNotas(t.notas ?? "");
    setFotoPreview(t.foto_url ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let foto_url: string | null = null;

    // Subir foto si hay una nueva
    if (fotoFile) {
      const ext = fotoFile.name.split(".").pop();
      const path = `terceros/${id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("terceros")
        .upload(path, fotoFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("terceros")
          .getPublicUrl(path);
        foto_url = urlData.publicUrl;
      }
    } else if (fotoPreview && fotoPreview.startsWith("http")) {
      foto_url = fotoPreview; // mantener foto existente
    }

    const payload = {
      alumno_id: id,
      full_name: fullName,
      relacion,
      telefono: telefono || null,
      documento_identidad: documento || null,
      notas: notas || null,
      ...(foto_url !== null ? { foto_url } : {}),
    };

    if (editandoId) {
      await supabase
        .from("terceros_autorizados")
        .update(payload)
        .eq("id", editandoId);
    } else {
      await supabase.from("terceros_autorizados").insert(payload);
    }

    resetForm();
    await cargar();
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleEliminar(terceroId: string) {
    if (!confirm("¿Eliminar esta persona?")) return;
    await supabase.from("terceros_autorizados").delete().eq("id", terceroId);
    await cargar();
  }

  const labelCls =
    "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block";
  const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50/50 transition-all";

  const RELACIONES = [
    "Tío/a",
    "Abuelo/a",
    "Hermano/a",
    "Padrino/a",
    "Vecino/a",
    "Otro",
  ];

  return (
    <main className="min-w-0 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href={`/dashboard/padre/hijo/${id}`}
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">
            {alumnoNombre}
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Autorizados para recoger
          </h1>
        </div>
        {terceros.length > 0 && (
          <span className="text-xs font-black text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full shrink-0">
            {terceros.length}
          </span>
        )}
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8">
        <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
          {/* ── FORMULARIO ── */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              {editandoId ? "Editando persona" : "Agregar persona autorizada"}
            </p>

            <form onSubmit={handleGuardar} className="space-y-4">
              {/* Foto */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <label className={labelCls}>
                  Foto de identificación{" "}
                  <span className="font-normal text-gray-300 normal-case">
                    (opcional)
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border-2 border-dashed border-gray-200">
                    {fotoPreview ? (
                      <img
                        src={fotoPreview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera size={24} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFoto}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-gray-600 hover:text-orange-600 font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Camera size={15} />
                      {fotoPreview ? "Cambiar foto" : "Subir foto"}
                    </button>
                    {fotoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setFotoFile(null);
                          setFotoPreview(null);
                        }}
                        className="w-full mt-2 text-xs font-bold text-red-400 hover:text-red-500 transition-colors"
                      >
                        Quitar foto
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                      La maestra podrá verificar la identidad
                    </p>
                  </div>
                </div>
              </div>

              {/* Datos */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <div>
                  <label className={labelCls}>Nombre completo *</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos López"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputCls}
                    required
                    autoFocus={!editandoId}
                  />
                </div>

                <div>
                  <label className={labelCls}>Relación *</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {RELACIONES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRelacion(r)}
                        className={`py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                          relacion === r
                            ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
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
                    className={inputCls}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Teléfono</label>
                    <input
                      type="tel"
                      placeholder="77700000"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>CI / Documento</label>
                    <input
                      type="text"
                      placeholder="12345678"
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Notas</label>
                  <input
                    type="text"
                    placeholder="Solo puede recoger los viernes..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Check size={15} className="text-green-500 shrink-0" />
                  <p className="text-green-600 text-sm font-bold">
                    {editandoId
                      ? "Persona actualizada"
                      : "Persona agregada correctamente"}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {editandoId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all"
                  >
                    <X size={17} /> Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || !relacion}
                  className="flex-[2] bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 shadow-sm shadow-orange-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Check size={17} />
                  )}
                  {loading
                    ? "Guardando..."
                    : editandoId
                      ? "Actualizar"
                      : "Agregar persona"}
                </button>
              </div>
            </form>
          </div>

          {/* ── LISTA ── */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Autorizados ({terceros.length})
            </p>

            {terceros.length > 0 ? (
              <div className="space-y-3">
                {terceros.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 transition-all overflow-hidden"
                  >
                    <div className="h-1 bg-green-400" />
                    <div className="p-4 flex items-start gap-3">
                      {/* Foto o inicial */}
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
                        {t.foto_url ? (
                          <img
                            src={t.foto_url}
                            alt={t.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Shield size={22} className="text-green-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-base leading-tight">
                          {t.full_name}
                        </p>
                        <p className="text-gray-500 text-xs font-medium capitalize mt-0.5">
                          {t.relacion}
                        </p>
                        {t.documento_identidad && (
                          <p className="text-gray-400 text-xs mt-0.5">
                            CI: {t.documento_identidad}
                          </p>
                        )}
                        {t.notas && (
                          <p className="text-orange-500 text-xs font-medium mt-1">
                            {t.notas}
                          </p>
                        )}
                        {!t.foto_url && (
                          <p className="text-[10px] text-amber-500 font-bold mt-1">
                            Sin foto de identificación
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        {t.telefono && (
                          <a
                            href={`tel:${t.telefono}`}
                            className="w-8 h-8 bg-green-50 hover:bg-green-100 rounded-xl flex items-center justify-center transition-all"
                          >
                            <Phone size={14} className="text-green-500" />
                          </a>
                        )}
                        <button
                          onClick={() => cargarParaEditar(t)}
                          className="w-8 h-8 bg-sky-50 hover:bg-sky-100 rounded-xl flex items-center justify-center transition-all"
                        >
                          <Edit2 size={14} className="text-sky-500" />
                        </button>
                        <button
                          onClick={() => handleEliminar(t.id)}
                          className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center transition-all"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center px-4">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield size={28} className="text-green-300" />
                </div>
                <p className="font-black text-gray-700 text-base mb-1">
                  Sin personas autorizadas
                </p>
                <p className="text-gray-400 text-sm">
                  Agregá familiares o conocidos de confianza
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

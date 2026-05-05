"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Edit2, X, Check } from "lucide-react";

type Aviso = {
  id: string;
  titulo: string;
  contenido: string;
  tipo: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
  created_at: string;
};

export default function AvisosPage() {
  const params = useParams();
  const cursoId = params.id as string;
  const supabase = createClient();

  const [cursoNombre, setCursoNombre] = useState("");
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [padres, setPadres] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [tipo, setTipo] = useState<"global" | "privado">("global");
  const [destinatarioId, setDestinatarioId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [lugar, setLugar] = useState("");
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const cargarData = useCallback(async () => {
    const { data: curso } = await supabase
      .from("cursos")
      .select("nombre")
      .eq("id", cursoId)
      .single();
    setCursoNombre(curso?.nombre ?? "");

    const { data } = await supabase
      .from("avisos")
      .select("*")
      .eq("curso_id", cursoId)
      .order("created_at", { ascending: false });
    setAvisos(data ?? []);

    const { data: alumnos } = await supabase
      .from("alumnos")
      .select("tutores(user_id, full_name)")
      .eq("curso_id", cursoId);
    const tutores =
      alumnos
        ?.flatMap((a: any) => a.tutores ?? [])
        .filter((t: any) => t.user_id) ?? [];
    const userIds = [...new Set(tutores.map((t: any) => t.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      setPadres(profiles ?? []);
    }
  }, [cursoId]);

  useEffect(() => {
    if (cursoId) cargarData();
  }, [cursoId, cargarData]);

  function resetForm() {
    setTitulo("");
    setContenido("");
    setTipo("global");
    setDestinatarioId("");
    setFecha("");
    setHora("");
    setLugar("");
    setEditandoId(null);
  }

  function cargarParaEditar(aviso: Aviso) {
    setEditandoId(aviso.id);
    setTitulo(aviso.titulo);
    setContenido(aviso.contenido);
    setTipo(aviso.tipo as "global" | "privado");
    setFecha(aviso.fecha ?? "");
    setHora(aviso.hora ?? "");
    setLugar(aviso.lugar ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePublicar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      curso_id: cursoId,
      maestra_id: user.id,
      titulo,
      contenido,
      tipo,
      destinatario_id: tipo === "privado" ? destinatarioId : null,
      fecha: fecha || null,
      hora: hora || null,
      lugar: lugar || null,
    };

    if (editandoId) {
      await supabase.from("avisos").update(payload).eq("id", editandoId);
      setSuccess("✅ Aviso actualizado correctamente");
    } else {
      await supabase.from("avisos").insert(payload);
      setSuccess("✅ Aviso publicado correctamente");
    }

    resetForm();
    await cargarData();
    setLoading(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este aviso?")) return;
    await supabase.from("avisos").delete().eq("id", id);
    await cargarData();
  }

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center gap-4">
        <Link
          href={`/dashboard/maestra/curso/${cursoId}`}
          className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">{cursoNombre}</p>
          <h1 className="text-lg font-black text-gray-900">Avisos</h1>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {/* FORMULARIO */}
        <form onSubmit={handlePublicar} className="flex flex-col gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              {editandoId ? "✏️ Editando aviso" : "Nuevo aviso"}
            </p>

            {/* Tipo */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setTipo("global")}
                className={`py-3 rounded-xl text-sm font-black transition-all ${
                  tipo === "global"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                📢 Global
                <p className="text-xs font-medium mt-0.5 opacity-70">
                  Todos los papás
                </p>
              </button>
              <button
                type="button"
                onClick={() => setTipo("privado")}
                className={`py-3 rounded-xl text-sm font-black transition-all ${
                  tipo === "privado"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                🔒 Privado
                <p className="text-xs font-medium mt-0.5 opacity-70">Un papá</p>
              </button>
            </div>

            {tipo === "privado" && (
              <select
                value={destinatarioId}
                onChange={(e) => setDestinatarioId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 mb-4"
                required={tipo === "privado"}
              >
                <option value="">Seleccionar papá...</option>
                {padres.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Título del aviso..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                required
              />

              <textarea
                placeholder="Mensaje para los papás..."
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                rows={3}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />

              {/* Fecha opcional */}
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">
                  📅 Fecha del evento{" "}
                  <span className="font-normal">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {fecha && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1.5 block">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1.5 block">
                      Lugar
                    </label>
                    <input
                      type="text"
                      placeholder="Aula 3, Casa..."
                      value={lugar}
                      onChange={(e) => setLugar(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
          )}
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
                className="flex-1 bg-gray-100 text-gray-600 font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <X size={18} /> Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 shadow-sm shadow-orange-200 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {loading
                ? "Guardando..."
                : editandoId
                  ? "Actualizar aviso"
                  : "Publicar aviso"}
            </button>
          </div>
        </form>

        {/* AVISOS PUBLICADOS */}
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
          Avisos publicados ({avisos.length})
        </h2>

        {avisos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {avisos.map((aviso) => (
              <div
                key={aviso.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div
                  className={`h-1.5 ${aviso.tipo === "global" ? "bg-gradient-to-r from-orange-400 to-orange-500" : "bg-gradient-to-r from-blue-400 to-blue-500"}`}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-lg ${aviso.tipo === "global" ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-500"}`}
                        >
                          {aviso.tipo === "global" ? "📢 Global" : "🔒 Privado"}
                        </span>
                        <p className="text-xs text-gray-400">
                          {new Date(aviso.created_at).toLocaleDateString(
                            "es-BO",
                            { day: "numeric", month: "short" },
                          )}
                        </p>
                      </div>
                      <h3 className="font-black text-gray-900">
                        {aviso.titulo}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        {aviso.contenido}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => cargarParaEditar(aviso)}
                        className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all"
                      >
                        <Edit2 size={14} className="text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleEliminar(aviso.id)}
                        className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  {aviso.fecha && (
                    <div className="mt-3 bg-orange-50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-white font-black text-sm">
                          {new Date(aviso.fecha + "T12:00:00").getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-sm capitalize">
                          {new Date(
                            aviso.fecha + "T12:00:00",
                          ).toLocaleDateString("es-BO", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {aviso.hora && (
                            <p className="text-orange-500 text-xs font-bold">
                              {aviso.hora.slice(0, 5)}
                            </p>
                          )}
                          {aviso.lugar && (
                            <p className="text-gray-400 text-xs">
                              📍 {aviso.lugar}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-4xl mb-3">📢</p>
            <p className="text-gray-400 text-sm font-medium">
              Aún no hay avisos publicados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

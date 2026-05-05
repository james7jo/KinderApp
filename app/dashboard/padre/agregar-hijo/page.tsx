"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Baby, ArrowLeft } from "lucide-react";

export default function AgregarHijoPage() {
  const [paso, setPaso] = useState<"codigo" | "datos">("codigo");
  const [codigo, setCodigo] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [colegioId, setColegioId] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [genero, setGenero] = useState("");
  const [relacion, setRelacion] = useState("padre");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function verificarCodigo() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("cursos")
      .select("id, colegio_id")
      .eq("codigo", codigo.trim().toLowerCase())
      .single();

    if (error || !data) {
      setError("Código de aula incorrecto");
      setLoading(false);
      return;
    }

    setCursoId(data.id);
    setColegioId(data.colegio_id);
    setPaso("datos");
    setLoading(false);
  }

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Crear alumno
    const { data: alumno, error: alumnoError } = await supabase
      .from("alumnos")
      .insert({
        nombre,
        apellido,
        fecha_nacimiento: fechaNac || null,
        genero: genero || null,
        curso_id: cursoId,
        colegio_id: colegioId,
      })
      .select("id")
      .single();

    if (alumnoError || !alumno) {
      setError("Error al crear el perfil del alumno");
      setLoading(false);
      return;
    }

    // Vincular tutor
    const { error: tutorError } = await supabase.from("tutores").insert({
      user_id: user.id,
      alumno_id: alumno.id,
      full_name:
        (
          await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single()
        ).data?.full_name ?? "",
      relacion,
      es_principal: true,
    });

    if (tutorError) {
      setError("Error al vincular el tutor");
      setLoading(false);
      return;
    }

    router.push("/dashboard/padre");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 font-nunito">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center gap-4">
        <Link
          href="/dashboard/padre"
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">PADRE</p>
          <h1 className="text-lg font-black text-gray-900">Agregar hijo</h1>
        </div>
      </div>

      <div className="px-5 pt-8 max-w-lg mx-auto">
        {paso === "codigo" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-5">
              <Baby size={26} className="text-orange-500" />
            </div>
            <h2 className="font-black text-gray-900 text-xl mb-1">
              Código del aula
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Pedile el código del aula a la maestra de tu hijo
            </p>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Ej: 823a0519"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-orange-400 text-center tracking-widest uppercase"
              />

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                onClick={verificarCodigo}
                disabled={!codigo || loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3.5 rounded-xl transition-all active:scale-95"
              >
                {loading ? "Verificando..." : "Verificar código →"}
              </button>
            </div>
          </div>
        )}

        {paso === "datos" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-5">
              <Baby size={26} className="text-orange-500" />
            </div>
            <h2 className="font-black text-gray-900 text-xl mb-1">
              Datos del niño
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Completá la información básica
            </p>

            <form onSubmit={handleAgregar} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    placeholder="Juan"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    placeholder="Pérez"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={fechaNac}
                  onChange={(e) => setFechaNac(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                  Género
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["masculino", "femenino", "otro"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenero(g)}
                      className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${
                        genero === g
                          ? "bg-orange-500 text-white"
                          : "bg-gray-50 text-gray-500 hover:bg-orange-50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                  Tu relación
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["padre", "madre", "tutor legal"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRelacion(r)}
                      className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${
                        relacion === r
                          ? "bg-orange-500 text-white"
                          : "bg-gray-50 text-gray-500 hover:bg-orange-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3.5 rounded-xl transition-all active:scale-95 mt-2"
              >
                {loading ? "Guardando..." : "Agregar hijo →"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

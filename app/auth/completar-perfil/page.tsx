"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CompletarPerfilPage() {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [colegioId, setColegioId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function cargarColegio() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("colegio_id")
        .eq("id", user.id)
        .single();

      if (profile?.colegio_id) setColegioId(profile.colegio_id);
    }
    cargarColegio();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase
      .from("colegios")
      .update({ nombre, direccion, telefono })
      .eq("id", colegioId);
    await supabase
      .from("profiles")
      .update({ perfil_completado: true })
      .eq("id", (await supabase.auth.getUser()).data.user!.id);

    if (error) {
      setError("Error al guardar: " + error.message);
      setLoading(false);
      return;
    }

    window.location.replace("/dashboard/director");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏫</div>
          <h1 className="text-2xl font-bold text-gray-800">
            Configurá tu colegio
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Completá los datos de tu institución
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Nombre del colegio *
              </label>
              <input
                type="text"
                placeholder="Ej: Kinder Arcoiris"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Dirección
              </label>
              <input
                type="text"
                placeholder="Ej: Av. Principal 123"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Teléfono
              </label>
              <input
                type="tel"
                placeholder="Ej: 77712345"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all"
            >
              {loading ? "Guardando..." : "Continuar →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

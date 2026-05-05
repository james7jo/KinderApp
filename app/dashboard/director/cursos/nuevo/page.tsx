"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NuevoCursoPage() {
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("colegio_id")
      .eq("id", user.id)
      .single();

    const { error } = await supabase
      .from("cursos")
      .insert({ nombre, colegio_id: profile?.colegio_id });

    if (error) {
      setError("Error al crear el curso");
      setLoading(false);
      return;
    }

    router.push("/dashboard/director/cursos");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 font-nunito">
      <div className="bg-white border-b border-gray-100 px-5 lg:px-8 py-4 sticky top-0 z-30 flex items-center gap-4">
        <Link
          href="/dashboard/director/cursos"
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">DIRECTOR</p>
          <h1 className="text-lg font-black text-gray-900">Nuevo curso</h1>
        </div>
      </div>

      <div className="px-5 lg:px-8 pt-8 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-5">
            <BookOpen size={26} className="text-orange-500" />
          </div>

          <h2 className="font-black text-gray-900 text-xl mb-1">
            Crear nuevo curso
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Se generará un código único automáticamente para que los padres
            puedan unirse.
          </p>

          <form onSubmit={handleCrear} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">
                Nombre del curso
              </label>
              <input
                type="text"
                placeholder="Ej: Primero A, Sala Amarilla..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent font-medium"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-orange-200 mt-2"
            >
              {loading ? "Creando..." : "Crear curso →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

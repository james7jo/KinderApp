"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { GraduationCap, Building2, MapPin, Phone, Check } from "lucide-react";

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

  const steps = [
    { icon: Building2, label: "Nombre", desc: "Cómo se llama tu institución" },
    { icon: MapPin, label: "Dirección", desc: "Dónde está ubicada" },
    { icon: Phone, label: "Contacto", desc: "Teléfono de la institución" },
  ];

  return (
    <main className="min-h-screen font-nunito bg-[#0F172A]">
      {/* ── DESKTOP ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen">
        {/* LEFT — branding */}
        <div className="w-[45%] flex flex-col p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3 mb-16">
            <div className="w-11 h-11 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <GraduationCap
                size={24}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <p className="text-white font-black text-xl">KinderApp</p>
              <p className="text-gray-500 text-xs">
                Sistema de gestión educativa
              </p>
            </div>
          </div>

          {/* Texto */}
          <div className="relative z-10 mb-12">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-orange-400 rounded-full" />
              <span className="text-orange-300 text-xs font-bold">
                Último paso
              </span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Configurá
              <br />
              <span className="text-orange-400">tu institución</span>
            </h1>
            <p className="text-gray-400 text-base leading-relaxed">
              Completá los datos de tu colegio para que las maestras y padres
              puedan encontrarte.
            </p>
          </div>

          {/* Steps visuales */}
          <div className="relative z-10 flex flex-col gap-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const done =
                i === 0
                  ? nombre.length > 0
                  : i === 1
                    ? direccion.length > 0
                    : telefono.length > 0;
              return (
                <div
                  key={s.label}
                  className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${done ? "bg-green-500" : "bg-orange-500/20"}`}
                  >
                    {done ? (
                      <Check size={18} className="text-white" />
                    ) : (
                      <Icon size={18} className="text-orange-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{s.label}</p>
                    <p className="text-gray-500 text-xs">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — formulario */}
        <div className="flex-1 flex items-center justify-center p-16 bg-gray-50">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                Tu colegio
              </h2>
              <p className="text-gray-400 font-medium text-sm">
                Completá los datos de tu institución educativa
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                  Nombre del colegio *
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                  />
                  <input
                    type="text"
                    placeholder="Ej: Kinder Arcoiris"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                  Dirección
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                  />
                  <input
                    type="text"
                    placeholder="Ej: Av. Principal 123, Cochabamba"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                  />
                  <input
                    type="tel"
                    placeholder="Ej: 77712345"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full shrink-0" />
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !nombre}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-200 mt-1"
              >
                {loading ? "Guardando..." : "Completar configuración →"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── MÓVIL ────────────────────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen flex flex-col">
        {/* Header oscuro */}
        <div className="bg-[#0F172A] px-6 pt-10 pb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <GraduationCap
                size={22}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <p className="text-white font-black text-lg">KinderApp</p>
              <p className="text-gray-500 text-xs">
                Sistema de gestión educativa
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5 mb-4">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
              <span className="text-orange-300 text-[11px] font-bold">
                Último paso
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mb-1">
              Configurá tu colegio
            </h1>
            <p className="text-gray-400 text-sm">
              Completá los datos de tu institución educativa
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="flex-1 bg-gray-50 px-6 pt-8 pb-10">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 max-w-lg mx-auto"
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                  Nombre del colegio *
                </label>
                <div className="relative">
                  <Building2
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
                  />
                  <input
                    type="text"
                    placeholder="Ej: Kinder Arcoiris"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                  Dirección
                </label>
                <div className="relative">
                  <MapPin
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
                  />
                  <input
                    type="text"
                    placeholder="Ej: Av. Principal 123"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
                  />
                  <input
                    type="tel"
                    placeholder="Ej: 77712345"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full shrink-0" />
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !nombre}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-200"
            >
              {loading ? "Guardando..." : "Completar configuración →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

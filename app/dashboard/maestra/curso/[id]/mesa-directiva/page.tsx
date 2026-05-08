"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Search, X, Crown, Users } from "lucide-react";

const ROLES_MESA = [
  {
    value: "presidente",
    label: "Presidente",
    color: "bg-amber-500",
    light: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  {
    value: "vicepresidente",
    label: "Vicepresidente",
    color: "bg-orange-400",
    light: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  {
    value: "secretaria_actas",
    label: "Stria. Actas",
    color: "bg-violet-500",
    light: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-200",
  },
  {
    value: "secretaria_hacienda",
    label: "Stria. Hacienda",
    color: "bg-green-500",
    light: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
  },
  {
    value: "secretaria_deportes",
    label: "Stria. Deportes",
    color: "bg-sky-500",
    light: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-200",
  },
  {
    value: "vocal",
    label: "Vocal",
    color: "bg-rose-400",
    light: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200",
  },
];

type Tutor = {
  id: string;
  full_name: string;
  relacion: string;
  user_id: string;
};

// ── MODAL SELECTOR ─────────────────────────────────────────────────────────────
function ModalSelector({
  rol,
  tutores,
  asignado,
  onSeleccionar,
  onClose,
}: {
  rol: (typeof ROLES_MESA)[0];
  tutores: Tutor[];
  asignado?: string;
  onSeleccionar: (tutorId: string | null) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtrados = tutores.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl shadow-2xl flex flex-col"
        style={{
          height: "calc(100dvh - 80px)",
          maxHeight: "calc(100dvh - 80px)",
        }}
      >
        <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-4 border-b border-gray-100 shrink-0">
          <div
            className={`w-9 h-9 ${rol.color} rounded-xl flex items-center justify-center shrink-0`}
          >
            <Crown size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-black text-gray-900 text-base">{rol.label}</h2>
            <p className="text-xs text-gray-400 font-medium">
              {tutores.length} papás disponibles
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Buscador */}
        <div className="px-4 py-3 border-b border-gray-50 shrink-0">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              type="text"
              placeholder="Buscar papá o mamá..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-gray-50 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400 transition-all"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Quitar asignación */}
          {asignado && (
            <button
              onClick={() => {
                onSeleccionar(null);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-red-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <X size={16} className="text-red-400" />
              </div>
              <p className="text-sm font-bold text-red-500">
                Quitar asignación
              </p>
            </button>
          )}

          {filtrados.length > 0 ? (
            filtrados.map((t) => {
              const seleccionado = t.id === asignado;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    onSeleccionar(t.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-all text-left ${
                    seleccionado ? `${rol.light}` : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      seleccionado ? rol.color : "bg-gray-100"
                    }`}
                  >
                    <span
                      className={`font-black text-sm ${seleccionado ? "text-white" : "text-gray-500"}`}
                    >
                      {t.full_name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-black text-sm ${seleccionado ? "text-gray-900" : "text-gray-800"}`}
                    >
                      {t.full_name}
                    </p>
                    <p className="text-gray-400 text-xs capitalize">
                      {t.relacion}
                    </p>
                  </div>
                  {seleccionado && <Check size={16} className={rol.text} />}
                </button>
              );
            })
          ) : (
            <div className="py-10 text-center">
              <p className="text-gray-400 text-sm font-bold">
                Sin resultados para "{search}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function MesaDirectivaPage() {
  const params = useParams();
  const cursoId = params.id as string;
  const supabase = createClient();

  const [cursoNombre, setCursoNombre] = useState("");
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [asignaciones, setAsignaciones] = useState<Record<string, string>>({});
  const [modalRol, setModalRol] = useState<(typeof ROLES_MESA)[0] | null>(null);

  const cargar = useCallback(async () => {
    const [{ data: curso }, { data: alumnos }, { data: mesaActual }] =
      await Promise.all([
        supabase.from("cursos").select("nombre").eq("id", cursoId).single(),
        supabase
          .from("alumnos")
          .select("tutores(id, full_name, relacion, user_id)")
          .eq("curso_id", cursoId),
        supabase
          .from("mesa_directiva")
          .select("*, tutores(full_name)")
          .eq("curso_id", cursoId),
      ]);

    setCursoNombre(curso?.nombre ?? "");

    const todos =
      alumnos
        ?.flatMap((a: any) => a.tutores ?? [])
        .filter((t: any) => t.user_id) ?? [];
    const unicos = todos.filter(
      (t: any, i: number, arr: any[]) =>
        arr.findIndex((x: any) => x.user_id === t.user_id) === i,
    );
    setTutores(unicos);

    const asig: Record<string, string> = {};
    mesaActual?.forEach((m: any) => {
      asig[m.rol] = m.tutor_id;
    });
    setAsignaciones(asig);
  }, [cursoId]);

  useEffect(() => {
    if (cursoId) cargar();
  }, [cursoId, cargar]);

  async function handleGuardar() {
    setLoading(true);
    await supabase.from("mesa_directiva").delete().eq("curso_id", cursoId);
    const inserts = Object.entries(asignaciones)
      .filter(([, v]) => v)
      .map(([rol, tutorId]) => ({ curso_id: cursoId, tutor_id: tutorId, rol }));
    if (inserts.length > 0)
      await supabase.from("mesa_directiva").insert(inserts);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    await cargar();
  }

  const asignados = Object.values(asignaciones).filter(Boolean).length;

  const getTutorNombre = (tutorId: string) =>
    tutores.find((t) => t.id === tutorId)?.full_name ?? null;

  return (
    <main className="min-w-0 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/maestra/curso/${cursoId}`}
            className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              {cursoNombre}
            </p>
            <h1 className="text-lg font-black text-gray-900 leading-tight">
              Mesa Directiva
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
            {asignados}/{ROLES_MESA.length}
          </span>
          <button
            onClick={handleGuardar}
            disabled={loading || asignados === 0}
            className={`flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl transition-all active:scale-95 ${
              success
                ? "bg-green-500 text-white"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
            } disabled:opacity-40`}
          >
            <Check size={14} />
            {success ? "Guardado" : loading ? "..." : "Guardar"}
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8 max-w-4xl mx-auto">
        {tutores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
              <Users size={40} className="text-gray-300" />
            </div>
            <h2 className="font-black text-gray-800 text-2xl mb-2">
              Sin padres registrados
            </h2>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              Los papás deben registrarse y agregar a sus hijos primero para
              poder formar la mesa directiva
            </p>
          </div>
        ) : (
          <>
            {/* Info */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-5 flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <Crown size={16} className="text-orange-500" />
              </div>
              <p className="text-sm font-bold text-orange-700">
                Tocá cada cargo para asignar un padre o madre. Tenés{" "}
                {tutores.length} papás disponibles.
              </p>
            </div>

            {/* Grid de cargos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {ROLES_MESA.map((rol) => {
                const tutorId = asignaciones[rol.value];
                const tutorNombre = tutorId ? getTutorNombre(tutorId) : null;
                const tutor = tutorId
                  ? tutores.find((t) => t.id === tutorId)
                  : null;

                return (
                  <button
                    key={rol.value}
                    onClick={() => setModalRol(rol)}
                    className={`text-left rounded-2xl border-2 overflow-hidden hover:shadow-md transition-all group ${
                      tutorNombre
                        ? rol.border
                        : "border-dashed border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {/* Barra color */}
                    <div
                      className={`h-1.5 ${tutorNombre ? rol.color : "bg-gray-200 group-hover:bg-orange-300 transition-colors"}`}
                    />
                    <div
                      className={`p-4 ${tutorNombre ? rol.light : "bg-white"}`}
                    >
                      {/* Cargo */}
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest mb-3 ${tutorNombre ? rol.text : "text-gray-400"}`}
                      >
                        {rol.label}
                      </p>

                      {tutorNombre && tutor ? (
                        /* Asignado */
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 ${rol.color} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}
                          >
                            <span className="text-white font-black text-base">
                              {tutor.full_name[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-gray-900 text-sm truncate">
                              {tutor.full_name}
                            </p>
                            <p className="text-gray-500 text-xs capitalize">
                              {tutor.relacion}
                            </p>
                          </div>
                          <Check size={16} className={`${rol.text} shrink-0`} />
                        </div>
                      ) : (
                        /* Sin asignar */
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                            <span className="text-gray-400 font-black text-lg group-hover:text-orange-400">
                              +
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-400 group-hover:text-orange-500 transition-colors">
                            Asignar persona
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Botón guardar móvil */}
            <button
              onClick={handleGuardar}
              disabled={loading || asignados === 0}
              className={`w-full lg:hidden font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                success
                  ? "bg-green-500 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
              } disabled:opacity-40`}
            >
              <Check size={18} />
              {success
                ? "Guardado"
                : loading
                  ? "Guardando..."
                  : `Guardar mesa (${asignados} cargos)`}
            </button>
          </>
        )}
      </div>

      {/* Modal selector */}
      {modalRol && (
        <ModalSelector
          rol={modalRol}
          tutores={tutores}
          asignado={asignaciones[modalRol.value]}
          onSeleccionar={(tutorId) => {
            setAsignaciones((prev) => {
              if (tutorId === null) {
                const next = { ...prev };
                delete next[modalRol.value];
                return next;
              }
              return { ...prev, [modalRol.value]: tutorId };
            });
          }}
          onClose={() => setModalRol(null)}
        />
      )}
    </main>
  );
}

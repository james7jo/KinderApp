"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  GraduationCap,
  Users,
  X,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronRight,
  Phone,
} from "lucide-react";

type Maestra = {
  id: string;
  full_name: string;
  foto_url?: string | null;
  telefono?: string | null;
};

type Curso = {
  id: string;
  nombre: string;
  maestra_curso: { maestra_id: string }[];
};

// ── MODAL MAESTRA ────────────────────────────────────────────────────────────
function ModalMaestra({
  maestra,
  cursos,
  onClose,
  onAsignar,
}: {
  maestra: Maestra;
  cursos: Curso[];
  onClose: () => void;
  onAsignar: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const cursoActual = cursos.find((c) =>
    c.maestra_curso.some((mc) => mc.maestra_id === maestra.id),
  );

  const cursosDisponibles = cursos.filter(
    (c) =>
      c.maestra_curso.length === 0 ||
      c.maestra_curso.some((mc) => mc.maestra_id === maestra.id),
  );

  const [cursoSel, setCursoSel] = useState(cursoActual?.id ?? "");

  const initials = maestra.full_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleAsignar() {
    if (!cursoSel) return;
    setLoading(true);
    setMsg("");

    const cursoElegido = cursos.find((c) => c.id === cursoSel);
    const otrasMaestras = cursoElegido?.maestra_curso.filter(
      (mc) => mc.maestra_id !== maestra.id,
    );
    if (otrasMaestras && otrasMaestras.length > 0) {
      setMsg("⚠ Ese curso ya tiene una maestra asignada.");
      setLoading(false);
      return;
    }

    await supabase.from("maestra_curso").delete().eq("maestra_id", maestra.id);
    await supabase.from("maestra_curso").insert({
      maestra_id: maestra.id,
      curso_id: cursoSel,
    });

    setMsg("✓ Asignada correctamente");
    setLoading(false);
    setTimeout(() => {
      onAsignar();
      onClose();
    }, 800);
  }

  async function handleDesasignar() {
    setLoading(true);
    await supabase.from("maestra_curso").delete().eq("maestra_id", maestra.id);
    setLoading(false);
    onAsignar();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl shadow-2xl flex flex-col"
        style={{
          height: "calc(100dvh - 48px)",
          maxHeight: "calc(100dvh - 48px)",
        }}
      >
        {/* Handle móvil */}
        <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header — fijo */}
        <div className="flex items-center gap-4 px-5 pt-4 pb-4 border-b border-gray-100 shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-violet-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-violet-200 overflow-hidden">
            {maestra.foto_url ? (
              <img
                src={maestra.foto_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-black text-xl">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-gray-900 text-xl leading-tight truncate">
              {maestra.full_name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {cursoActual ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black bg-green-100 text-green-600 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={11} />
                  {cursoActual.nombre}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full">
                  <AlertCircle size={11} />
                  Sin curso
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all shrink-0"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Cuerpo — scrolleable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4 overscroll-contain">
          {/* Contacto */}
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-3">
              Contacto
            </p>
            <div className="bg-white rounded-xl divide-y divide-gray-50">
              {maestra.telefono ? (
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                      Teléfono
                    </span>
                  </div>
                  <a
                    href={`tel:${maestra.telefono}`}
                    className="text-sm font-bold text-blue-500"
                  >
                    {maestra.telefono}
                  </a>
                </div>
              ) : (
                <p className="px-3 py-3 text-sm text-gray-400">
                  Sin teléfono registrado
                </p>
              )}
            </div>
          </div>

          {/* Asignación */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">
              Asignación de curso
            </p>
            {cursosDisponibles.length > 0 ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  {cursosDisponibles.map((c) => {
                    const esActual = c.id === cursoActual?.id;
                    const selected = cursoSel === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCursoSel(c.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                          selected
                            ? "border-orange-400 bg-orange-500 text-white"
                            : "border-gray-100 bg-white hover:border-orange-200"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-white/20" : "bg-orange-50"}`}
                        >
                          <BookOpen
                            size={15}
                            className={
                              selected ? "text-white" : "text-orange-500"
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-black text-sm ${selected ? "text-white" : "text-gray-900"}`}
                          >
                            {c.nombre}
                          </p>
                          {esActual && (
                            <p
                              className={`text-[10px] font-bold ${selected ? "text-orange-100" : "text-green-500"}`}
                            >
                              Curso actual
                            </p>
                          )}
                        </div>
                        {selected && (
                          <CheckCircle2
                            size={16}
                            className="text-white shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {msg && (
                  <p
                    className={`text-xs font-bold text-center py-1 ${msg.startsWith("✓") ? "text-green-600" : "text-amber-600"}`}
                  >
                    {msg}
                  </p>
                )}

                <button
                  onClick={handleAsignar}
                  disabled={
                    loading || !cursoSel || cursoSel === cursoActual?.id
                  }
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-orange-200"
                >
                  {loading
                    ? "Guardando..."
                    : cursoActual
                      ? "Cambiar asignación"
                      : "Asignar curso"}
                </button>

                {cursoActual && (
                  <button
                    onClick={handleDesasignar}
                    disabled={loading}
                    className="w-full bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-500 font-bold py-3 rounded-xl transition-all text-sm"
                  >
                    Quitar del curso actual
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-sm font-bold text-gray-400">
                  Todos los cursos tienen maestra asignada
                </p>
              </div>
            )}
          </div>

          {/* Padding final */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function MaestrasPageClient({
  maestras: initialMaestras,
  cursos: initialCursos,
  colegioId,
}: {
  maestras: Maestra[];
  cursos: Curso[];
  colegioId: string;
}) {
  const [maestras, setMaestras] = useState(initialMaestras);
  const [cursos, setCursos] = useState(initialCursos);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Maestra | null>(null);
  const supabase = createClient();

  // Recargar datos después de asignar
  async function refetch() {
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, foto_url, telefono")
        .eq("colegio_id", colegioId)
        .eq("role", "maestra"),
      supabase
        .from("cursos")
        .select("id, nombre, maestra_curso(maestra_id)")
        .eq("colegio_id", colegioId),
    ]);
    if (m) setMaestras(m);
    if (c) setCursos(c as Curso[]);
  }

  const filtered = maestras.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  const asignadas = maestras.filter((m) =>
    cursos.some((c) => c.maestra_curso.some((mc) => mc.maestra_id === m.id)),
  ).length;

  return (
    <>
      <div className="px-4 lg:px-7 pt-5 pb-8">
        {maestras.length > 0 ? (
          <>
            {/* STATS */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                  <GraduationCap size={17} className="text-violet-500" />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 leading-none">
                    {maestras.length}
                  </p>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                    Total
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 size={17} className="text-green-500" />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 leading-none">
                    {asignadas}
                  </p>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                    Con curso
                  </p>
                </div>
              </div>
              <div
                className={`rounded-2xl border p-4 flex items-center gap-3 ${maestras.length - asignadas > 0 ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100"}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${maestras.length - asignadas > 0 ? "bg-amber-100" : "bg-gray-50"}`}
                >
                  <AlertCircle
                    size={17}
                    className={
                      maestras.length - asignadas > 0
                        ? "text-amber-500"
                        : "text-gray-300"
                    }
                  />
                </div>
                <div>
                  <p
                    className={`text-xl font-black leading-none ${maestras.length - asignadas > 0 ? "text-amber-600" : "text-gray-900"}`}
                  >
                    {maestras.length - asignadas}
                  </p>
                  <p
                    className={`text-[11px] font-bold mt-0.5 ${maestras.length - asignadas > 0 ? "text-amber-400" : "text-gray-400"}`}
                  >
                    Sin curso
                  </p>
                </div>
              </div>
            </div>

            {/* BUSCADOR */}
            <div className="relative mb-5">
              <Search
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
              />
              <input
                type="text"
                placeholder="Buscar maestra..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              />
            </div>

            {/* GRID DE CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map((maestra) => {
                const cursoAsignado = cursos.find((c) =>
                  c.maestra_curso.some((mc) => mc.maestra_id === maestra.id),
                );
                const initials = maestra.full_name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <button
                    key={maestra.id}
                    onClick={() => setSelected(maestra)}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-3 hover:shadow-md hover:border-violet-200 transition-all group text-center"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-violet-600 rounded-2xl flex items-center justify-center overflow-hidden shadow-md shadow-violet-200">
                        {maestra.foto_url ? (
                          <img
                            src={maestra.foto_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-black text-xl">
                            {initials}
                          </span>
                        )}
                      </div>
                      {/* Dot estado */}
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${cursoAsignado ? "bg-green-400" : "bg-amber-400"}`}
                      />
                    </div>

                    {/* Nombre */}
                    <div className="w-full">
                      <p className="font-black text-gray-900 text-sm leading-tight line-clamp-2">
                        {maestra.full_name}
                      </p>
                      <p
                        className={`text-[10px] font-bold mt-1 truncate ${cursoAsignado ? "text-green-500" : "text-amber-500"}`}
                      >
                        {cursoAsignado ? cursoAsignado.nombre : "Sin curso"}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 group-hover:text-violet-500 transition-colors">
                      Ver perfil <ChevronRight size={11} />
                    </div>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <p className="text-gray-400 text-sm font-bold">
                    Sin resultados para "{search}"
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-24 h-24 bg-violet-50 rounded-3xl flex items-center justify-center mb-6">
              <Users size={40} className="text-violet-300" />
            </div>
            <h2 className="font-black text-gray-800 text-2xl mb-2">
              Sin maestras aún
            </h2>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              Compartí el código del colegio con las maestras para que se
              registren
            </p>
          </div>
        )}
      </div>

      {/* MODAL */}
      {selected && (
        <ModalMaestra
          maestra={selected}
          cursos={cursos}
          onClose={() => setSelected(null)}
          onAsignar={refetch}
        />
      )}
    </>
  );
}

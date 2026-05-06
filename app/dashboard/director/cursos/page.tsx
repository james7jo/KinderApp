import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Users,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";

export default async function CursosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("colegio_id")
    .eq("id", user.id)
    .single();

  const { data: cursos } = await supabase
    .from("cursos")
    .select(
      `id, nombre, codigo, maestra_curso ( profiles ( full_name ) ), alumnos ( id )`,
    )
    .eq("colegio_id", profile?.colegio_id)
    .order("nombre", { ascending: true });

  const ORDEN = [
    "Inicial",
    "Nursery",
    "Pre-Kinder",
    "Kinder",
    "Primero",
    "Segundo",
    "Tercero",
    "Cuarto",
    "Quinto",
    "Sexto",
  ];
  const COLORES = [
    "#F97316",
    "#7C3AED",
    "#0EA5E9",
    "#10B981",
    "#F43F5E",
    "#F59E0B",
  ];
  const COLORES_BG = [
    "#FFF7ED",
    "#F5F3FF",
    "#F0F9FF",
    "#ECFDF5",
    "#FFF1F2",
    "#FFFBEB",
  ];

  const grupos: Record<string, typeof cursos> = {};
  (cursos ?? []).forEach((c) => {
    const grado =
      ORDEN.find((g) => c.nombre.toLowerCase().startsWith(g.toLowerCase())) ??
      c.nombre.split(" ")[0];
    if (!grupos[grado]) grupos[grado] = [];
    grupos[grado]!.push(c);
  });
  const gradosOrdenados = Object.keys(grupos).sort((a, b) => {
    const ia = ORDEN.findIndex((g) => g.toLowerCase() === a.toLowerCase());
    const ib = ORDEN.findIndex((g) => g.toLowerCase() === b.toLowerCase());
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  const totalAlumnos = (cursos ?? []).reduce(
    (acc, c) => acc + ((c.alumnos as any)?.length ?? 0),
    0,
  );
  const sinMaestra = (cursos ?? []).filter(
    (c) => !(c.maestra_curso as any)?.[0]?.profiles?.full_name,
  ).length;

  return (
    <main className="min-w-0">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Director
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Cursos
          </h1>
        </div>
        <Link
          href="/dashboard/director/cursos/nuevo"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-orange-200"
        >
          <Plus size={17} />
          <span className="hidden sm:inline">Nuevo curso</span>
        </Link>
      </div>

      <div className="px-4 lg:px-7 pt-5">
        {cursos && cursos.length > 0 ? (
          <>
            {/* STATS */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen size={17} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 leading-none">
                    {cursos.length}
                  </p>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                    Cursos
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                  <Users size={17} className="text-sky-500" />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 leading-none">
                    {totalAlumnos}
                  </p>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                    Alumnos
                  </p>
                </div>
              </div>
              <div
                className={`rounded-2xl border p-4 flex items-center gap-3 ${sinMaestra > 0 ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100"}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sinMaestra > 0 ? "bg-amber-100" : "bg-emerald-50"}`}
                >
                  {sinMaestra > 0 ? (
                    <AlertCircle size={17} className="text-amber-500" />
                  ) : (
                    <CheckCircle2 size={17} className="text-emerald-500" />
                  )}
                </div>
                <div>
                  <p
                    className={`text-xl font-black leading-none ${sinMaestra > 0 ? "text-amber-600" : "text-gray-900"}`}
                  >
                    {sinMaestra}
                  </p>
                  <p
                    className={`text-[11px] font-bold mt-0.5 ${sinMaestra > 0 ? "text-amber-400" : "text-gray-400"}`}
                  >
                    Sin maestra
                  </p>
                </div>
              </div>
            </div>

            {/* GRUPOS POR GRADO */}
            <div className="space-y-5 pb-6">
              {gradosOrdenados.map((grado, gi) => {
                const color = COLORES[gi % COLORES.length];
                const colorBg = COLORES_BG[gi % COLORES_BG.length];
                return (
                  <div key={grado}>
                    {/* Header grupo */}
                    <div className="flex items-center gap-3 mb-2.5">
                      <div
                        className="w-1.5 h-5 rounded-full"
                        style={{ background: color }}
                      />
                      <h2 className="font-black text-gray-600 text-xs uppercase tracking-widest">
                        {grado}
                      </h2>
                      <span className="text-[11px] font-bold text-gray-300">
                        {grupos[grado]!.length}{" "}
                        {grupos[grado]!.length === 1 ? "curso" : "cursos"}
                      </span>
                      <span className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* TABLA PC */}
                    <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-50 bg-gray-50/50">
                            <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              Curso
                            </th>
                            <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              Maestra
                            </th>
                            <th className="text-center px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              Alumnos
                            </th>
                            <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              Código parental
                            </th>
                            <th className="px-5 py-3 w-24" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {grupos[grado]!.map((curso) => {
                            const maestra = (curso.maestra_curso as any)?.[0]
                              ?.profiles?.full_name;
                            const alumnos = (curso.alumnos as any)?.length ?? 0;
                            return (
                              <tr
                                key={curso.id}
                                className="hover:bg-gray-50/60 transition-colors group"
                              >
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                      style={{ background: colorBg }}
                                    >
                                      <BookOpen size={14} style={{ color }} />
                                    </div>
                                    <span className="font-black text-gray-900 text-sm">
                                      {curso.nombre}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  {maestra ? (
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                                        style={{ background: colorBg, color }}
                                      >
                                        {maestra
                                          .split(" ")
                                          .map((n: string) => n[0])
                                          .slice(0, 2)
                                          .join("")}
                                      </div>
                                      <span className="text-sm font-bold text-gray-600">
                                        {maestra}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg">
                                      <AlertCircle size={11} />
                                      Sin asignar
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className="text-sm font-black text-gray-900">
                                    {alumnos}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono font-black text-sm text-gray-700 tracking-widest bg-gray-50 px-3 py-1 rounded-lg">
                                      {curso.codigo}
                                    </span>
                                    <CopyButton text={curso.codigo} />
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <Link
                                    href={`/dashboard/director/cursos/${curso.id}`}
                                    className="flex items-center justify-end gap-1 text-[12px] font-bold text-gray-300 hover:text-orange-500 transition-colors"
                                  >
                                    Ver detalle <ChevronRight size={13} />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* LISTA MÓVIL */}
                    <div className="lg:hidden space-y-2">
                      {grupos[grado]!.map((curso) => {
                        const maestra = (curso.maestra_curso as any)?.[0]
                          ?.profiles?.full_name;
                        const alumnos = (curso.alumnos as any)?.length ?? 0;
                        return (
                          <div
                            key={curso.id}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                          >
                            <div className="flex items-center gap-3 px-4 py-3.5">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: colorBg }}
                              >
                                <BookOpen size={18} style={{ color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-gray-900 text-sm leading-tight">
                                  {curso.nombre}
                                </p>
                                {maestra ? (
                                  <p className="text-xs font-bold text-gray-400 truncate mt-0.5">
                                    {maestra}
                                  </p>
                                ) : (
                                  <p className="text-xs font-bold text-amber-400 mt-0.5">
                                    Sin maestra asignada
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-base font-black text-gray-900">
                                  {alumnos}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400">
                                  alumnos
                                </p>
                              </div>
                            </div>
                            <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                  Código:
                                </span>
                                <span className="font-mono font-black text-sm text-gray-700 tracking-wider">
                                  {curso.codigo}
                                </span>
                                <CopyButton text={curso.codigo} />
                              </div>
                              <Link
                                href={`/dashboard/director/cursos/${curso.id}`}
                                className="flex items-center gap-0.5 text-[11px] font-bold text-gray-400 hover:text-orange-500 transition-colors"
                              >
                                Ver <ChevronRight size={12} />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
              <BookOpen size={40} className="text-orange-300" />
            </div>
            <h2 className="font-black text-gray-800 text-2xl mb-2">
              Sin cursos aún
            </h2>
            <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
              Creá el primer curso para que las maestras y padres puedan unirse
              al colegio
            </p>
            <Link
              href="/dashboard/director/cursos/nuevo"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-orange-200"
            >
              <Plus size={20} />
              Crear primer curso
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

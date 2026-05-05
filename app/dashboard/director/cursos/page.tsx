import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Plus, Users, Copy } from "lucide-react";
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
      `
      id, nombre, codigo,
      maestra_curso (
        profiles ( full_name )
      ),
      alumnos ( id )
    `,
    )
    .eq("colegio_id", profile?.colegio_id)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28 lg:pb-10">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-5 lg:px-8 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-bold">DIRECTOR</p>
          <h1 className="text-lg font-black text-gray-900">Cursos</h1>
        </div>
        <Link
          href="/dashboard/director/cursos/nuevo"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-orange-200"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nuevo curso</span>
        </Link>
      </div>

      <div className="px-5 lg:px-8 pt-6">
        {cursos && cursos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cursos.map((curso) => {
              const maestra = (curso.maestra_curso as any)?.[0]?.profiles
                ?.full_name;
              const totalAlumnos = (curso.alumnos as any)?.length ?? 0;

              return (
                <div
                  key={curso.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  {/* Color bar */}
                  <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-500" />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <BookOpen size={20} className="text-orange-500" />
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        {totalAlumnos} alumnos
                      </span>
                    </div>

                    <h3 className="font-black text-gray-900 text-lg mb-1">
                      {curso.nombre}
                    </h3>

                    {maestra ? (
                      <div className="flex items-center gap-1.5 mb-4">
                        <Users size={13} className="text-gray-400" />
                        <p className="text-gray-400 text-xs font-medium">
                          {maestra}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mb-4">
                        <Users size={13} className="text-orange-300" />
                        <p className="text-orange-400 text-xs font-medium">
                          Sin maestra asignada
                        </p>
                      </div>
                    )}

                    {/* Código */}
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          Código parental
                        </p>
                        <p className="font-mono font-black text-gray-800 tracking-widest">
                          {curso.codigo}
                        </p>
                      </div>
                      <CopyButton text={curso.codigo} />
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <Link
                      href={`/dashboard/director/cursos/${curso.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 text-gray-500 text-sm font-bold py-2.5 rounded-xl transition-all"
                    >
                      Ver detalle →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-5">
              <BookOpen size={36} className="text-orange-300" />
            </div>
            <h2 className="font-black text-gray-800 text-xl mb-2">
              No hay cursos aún
            </h2>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              Creá el primer curso para que las maestras y padres puedan unirse
            </p>
            <Link
              href="/dashboard/director/cursos/nuevo"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-sm shadow-orange-200"
            >
              <Plus size={20} />
              Crear primer curso
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

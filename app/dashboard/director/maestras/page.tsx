import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GraduationCap, Users } from "lucide-react";
import AsignarMaestraButton from "@/components/ui/AsignarMaestraButton";

export default async function MaestrasPage() {
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

  const { data: maestras } = await supabase
    .from("profiles")
    .select("id, full_name, foto_url")
    .eq("colegio_id", profile?.colegio_id)
    .eq("role", "maestra");

  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, nombre, maestra_curso(maestra_id)")
    .eq("colegio_id", profile?.colegio_id);

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28 lg:pb-10">
      <div className="bg-white border-b border-gray-100 px-5 lg:px-8 py-4 sticky top-0 z-30">
        <p className="text-xs text-gray-400 font-bold">DIRECTOR</p>
        <h1 className="text-lg font-black text-gray-900">Maestras</h1>
      </div>

      <div className="px-5 lg:px-8 pt-6">
        {maestras && maestras.length > 0 ? (
          <div className="flex flex-col gap-4">
            {maestras.map((maestra) => {
              const cursoAsignado = cursos?.find((c: any) =>
                c.maestra_curso?.some(
                  (mc: any) => mc.maestra_id === maestra.id,
                ),
              );

              return (
                <div
                  key={maestra.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center">
                      <GraduationCap size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">
                        {maestra.full_name}
                      </p>
                      {cursoAsignado ? (
                        <span className="inline-block bg-green-100 text-green-600 text-xs font-bold px-2 py-0.5 rounded-full">
                          {cursoAsignado.nombre}
                        </span>
                      ) : (
                        <span className="inline-block bg-orange-100 text-orange-500 text-xs font-bold px-2 py-0.5 rounded-full">
                          Sin curso asignado
                        </span>
                      )}
                    </div>
                  </div>

                  <AsignarMaestraButton
                    maestraId={maestra.id}
                    maestraNombre={maestra.full_name}
                    cursos={cursos ?? []}
                    cursoActualId={cursoAsignado?.id}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-5">
              <Users size={36} className="text-orange-300" />
            </div>
            <h2 className="font-black text-gray-800 text-xl mb-2">
              No hay maestras aún
            </h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Compartí el código del colegio con las maestras para que se
              registren
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

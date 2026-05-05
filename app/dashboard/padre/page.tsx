import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Baby, Plus, ArrowRight, Bell, MapPin, Home } from "lucide-react";

export default async function PadrePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: hijos } = await supabase
    .from("tutores")
    .select(
      `
      id, relacion,
      alumnos (
        id, nombre, apellido, foto_url,
        cursos ( nombre )
      )
    `,
    )
    .eq("user_id", user.id);

  const today = new Date().toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-gray-50 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-bold capitalize">{today}</p>
          <h1 className="text-lg font-black text-gray-900">
            {profile?.full_name}
          </h1>
        </div>
        <Link
          href="/dashboard/padre/agregar-hijo"
          className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm shadow-orange-200"
        >
          <Plus size={20} className="text-white" />
        </Link>
      </div>

      <div className="px-5 pt-6">
        {hijos && hijos.length > 0 ? (
          <>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
              Mis hijos
            </h2>
            <div className="flex flex-col gap-4">
              {hijos.map((tutor: any) => {
                const alumno = tutor.alumnos;
                if (!alumno) return null;
                return (
                  <Link
                    key={tutor.id}
                    href={`/dashboard/padre/hijo/${alumno.id}`}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500" />
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
                          <span className="text-xl font-black text-orange-500">
                            {alumno.nombre[0]}
                            {alumno.apellido[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-lg">
                            {alumno.nombre} {alumno.apellido}
                          </p>
                          <p className="text-gray-400 text-xs font-medium">
                            {alumno.cursos?.nombre ?? "Sin curso"}
                          </p>
                          <span className="inline-block bg-orange-50 text-orange-500 text-xs font-bold px-2 py-0.5 rounded-full mt-1">
                            {tutor.relacion}
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        size={20}
                        className="text-gray-300 group-hover:text-orange-400 transition-colors"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* ACCESOS RÁPIDOS */}
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 mt-7">
              Accesos rápidos
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/padre/avisos"
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center mb-3">
                  <Bell size={18} className="text-sky-500" />
                </div>
                <p className="font-black text-gray-900 text-sm">Avisos</p>
                <p className="text-gray-400 text-xs mt-0.5">Comunicados</p>
              </Link>
              <Link
                href="/dashboard/padre/hijo"
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                  <MapPin size={18} className="text-orange-500" />
                </div>
                <p className="font-black text-gray-900 text-sm">GPS</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Ubicación en vivo
                </p>
              </Link>
            </div>
          </>
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-5">
              <Baby size={36} className="text-orange-300" />
            </div>
            <h2 className="font-black text-gray-800 text-xl mb-2">
              ¡Agregá a tu hijo!
            </h2>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              Usá el código del aula que te dio la maestra para registrar a tu
              hijo
            </p>
            <Link
              href="/dashboard/padre/agregar-hijo"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-sm shadow-orange-200"
            >
              <Plus size={20} />
              Agregar hijo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

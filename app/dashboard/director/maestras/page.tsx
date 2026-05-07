import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MaestrasClient from "./MaestrasClient";

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

  const [{ data: maestras }, { data: cursos }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, foto_url, telefono")
      .eq("colegio_id", profile?.colegio_id)
      .eq("role", "maestra"),
    supabase
      .from("cursos")
      .select("id, nombre, maestra_curso(maestra_id)")
      .eq("colegio_id", profile?.colegio_id),
  ]);

  return (
    <main className="min-w-0">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 sticky top-0 z-30">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
          Director
        </p>
        <h1 className="text-lg font-black text-gray-900 leading-tight">
          Maestras
        </h1>
      </div>

      <MaestrasClient
        maestras={maestras ?? []}
        cursos={(cursos ?? []) as any}
        colegioId={profile?.colegio_id ?? ""}
      />
    </main>
  );
}

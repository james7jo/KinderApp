import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hoyBolivia, fechaLabelBolivia } from "@/lib/fecha-bolivia";
import BitacoraPageClient from "./BitacoraPageClient";

export default async function BitacoraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: curso } = await supabase
    .from("cursos")
    .select("nombre")
    .eq("id", id)
    .single();

  const { data: alumnos } = await supabase
    .from("alumnos")
    .select("id, nombre, apellido, foto_url")
    .eq("curso_id", id)
    .order("nombre");

  // ✅ Fecha en horario boliviano (UTC-4)
  const today = hoyBolivia();
  const fechaLabel = fechaLabelBolivia();

  const { data: bitacorasHoy } = await supabase
    .from("bitacoras")
    .select("*")
    .eq("maestra_id", user.id)
    .eq("fecha", today);

  return (
    <BitacoraPageClient
      cursoId={id}
      cursoNombre={curso?.nombre ?? ""}
      maestraId={user.id}
      alumnos={alumnos ?? []}
      bitacorasHoy={bitacorasHoy ?? []}
      today={today}
      fechaLabel={fechaLabel}
    />
  );
}

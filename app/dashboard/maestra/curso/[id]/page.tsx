import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CursoHubClient from "./CursoHubClient";

export default async function CursoMaestraPage({
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
    .select("id, nombre, codigo")
    .eq("id", id)
    .single();

  // Traemos todos los datos del alumno para el modal
  const { data: alumnos } = await supabase
    .from("alumnos")
    .select(
      `
      id, nombre, apellido, foto_url, genero, fecha_nacimiento,
      tipo_sangre, alergias, enfermedades_cronicas, capacidades_diferentes,
      medicamentos, medico_cabecera, telefono_medico, tiene_seguro,
      notas_especiales,
      tutores ( id, full_name, relacion, telefono, es_principal ),
      terceros_autorizados ( id, full_name, relacion, telefono, documento_identidad ),
      plan_recogida ( id, responsable_nombre, responsable_relacion, fecha_inicio, fecha_fin )
    `,
    )
    .eq("curso_id", id)
    .order("nombre");

  const today = new Date().toISOString().split("T")[0];

  const { data: bitacorasHoy } = await supabase
    .from("bitacoras")
    .select("id, alumno_id, estado_animo, comio")
    .eq("maestra_id", user.id)
    .eq("fecha", today);

  const { data: avisosRecientes } = await supabase
    .from("avisos")
    .select("id, titulo, tipo, created_at")
    .eq("curso_id", id)
    .order("created_at", { ascending: false })
    .limit(2);

  const { data: actProximas } = await supabase
    .from("actividades")
    .select("id, titulo, fecha")
    .eq("curso_id", id)
    .gte("fecha", today)
    .order("fecha", { ascending: true })
    .limit(2);

  const totalAlumnos = alumnos?.length ?? 0;
  const asistenciaHoy = bitacorasHoy?.length ?? 0;
  const pendientes = totalAlumnos - asistenciaHoy;
  const pct =
    totalAlumnos > 0 ? Math.round((asistenciaHoy / totalAlumnos) * 100) : 0;

  return (
    <CursoHubClient
      cursoId={id}
      curso={curso}
      alumnos={(alumnos ?? []) as any}
      bitacorasHoy={bitacorasHoy ?? []}
      avisosRecientes={avisosRecientes ?? []}
      actProximas={actProximas ?? []}
      totalAlumnos={totalAlumnos}
      asistenciaHoy={asistenciaHoy}
      pendientes={pendientes}
      pct={pct}
      today={today}
    />
  );
}

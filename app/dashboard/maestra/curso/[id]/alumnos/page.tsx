import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AlumnosClient from "./AlumnosClient";

export default async function AlumnosPage({
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
    .select(
      `
      id, nombre, apellido, fecha_nacimiento, genero, foto_url,
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

  return (
    <AlumnosClient
      cursoId={id}
      cursoNombre={curso?.nombre ?? ""}
      alumnos={(alumnos ?? []) as any}
      today={today}
    />
  );
}

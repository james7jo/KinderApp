import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CursoDirectorClient from "./CursoDirectorClient";

export default async function CursoDirectorPage({
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

  const today = new Date().toISOString().split("T")[0];

  // Datos del curso
  const { data: curso } = await supabase
    .from("cursos")
    .select("nombre, codigo")
    .eq("id", id)
    .single();

  // Maestra(s) del curso — primero obtenemos los IDs
  const { data: maestraCursoRaw } = await supabase
    .from("maestra_curso")
    .select("maestra_id")
    .eq("curso_id", id);

  // Luego traemos los perfiles con los campos que existen en la tabla
  const maestraIds = (maestraCursoRaw ?? []).map((m: any) => m.maestra_id);
  const { data: maestrasProfiles } =
    maestraIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", maestraIds)
      : { data: [] };

  // Lo armamos en el formato que espera el Client Component
  const maestrasCurso = (maestrasProfiles ?? []).map((p: any) => ({
    profiles: p,
  }));

  // Alumnos completos
  const { data: alumnos } = await supabase
    .from("alumnos")
    .select(
      `
      id, nombre, apellido, genero, fecha_nacimiento, foto_url,
      tipo_sangre, alergias, medicamentos, enfermedades_cronicas,
      capacidades_diferentes, medico_cabecera, telefono_medico,
      tiene_seguro, nombre_seguro, numero_seguro
    `,
    )
    .eq("curso_id", id)
    .order("nombre");

  const alumnosIds = (alumnos ?? []).map((a) => a.id);

  // Bitácoras de hoy
  const { data: bitacorasHoy } = await supabase
    .from("bitacoras")
    .select("*")
    .in("alumno_id", alumnosIds.length > 0 ? alumnosIds : ["none"])
    .eq("fecha", today);

  // Tutores de todos los alumnos
  const { data: tutores } = await supabase
    .from("tutores")
    .select("*")
    .in("alumno_id", alumnosIds.length > 0 ? alumnosIds : ["none"]);

  // Terceros autorizados
  const { data: terceros } = await supabase
    .from("terceros_autorizados")
    .select("*")
    .in("alumno_id", alumnosIds.length > 0 ? alumnosIds : ["none"]);

  // Plan recogida — sin filtro de fecha en la query para evitar errores
  const { data: recogidasRaw } = await supabase
    .from("plan_recogida")
    .select("*")
    .in("alumno_id", alumnosIds.length > 0 ? alumnosIds : ["none"]);

  // Filtramos en memoria las vigentes hoy
  const recogidas = (recogidasRaw ?? []).filter((r: any) => {
    const inicio = r.fecha_inicio ? r.fecha_inicio <= today : true;
    const fin = r.fecha_fin ? r.fecha_fin >= today : true;
    return inicio && fin;
  });

  // Avisos del curso
  const { data: avisos } = await supabase
    .from("avisos")
    .select("id, titulo, contenido, tipo, fecha, hora, lugar, created_at")
    .eq("curso_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Actividades próximas
  const { data: actividades } = await supabase
    .from("actividades")
    .select("id, titulo, fecha, descripcion")
    .eq("curso_id", id)
    .gte("fecha", today)
    .order("fecha", { ascending: true })
    .limit(5);

  const totalAlumnos = alumnos?.length ?? 0;
  const presentesHoy = new Set(bitacorasHoy?.map((b) => b.alumno_id)).size;

  return (
    <main className="min-w-0">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href="/dashboard/director/cursos"
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Director · Cursos
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            {curso?.nombre}
          </h1>
        </div>
      </div>

      <CursoDirectorClient
        cursoId={id}
        curso={curso}
        maestrasCurso={maestrasCurso ?? []}
        alumnos={alumnos ?? []}
        bitacorasHoy={bitacorasHoy ?? []}
        tutores={tutores ?? []}
        terceros={terceros ?? []}
        recogidas={recogidas ?? []}
        avisos={avisos ?? []}
        actividades={actividades ?? []}
        totalAlumnos={totalAlumnos}
        presentesHoy={presentesHoy}
        today={today}
      />
    </main>
  );
}

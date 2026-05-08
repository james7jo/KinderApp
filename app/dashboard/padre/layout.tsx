import { createClient } from "@/lib/supabase/server";
import NavbarPadre from "@/components/navigation/NavbarPadre";

export default async function PadreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, colegio_id")
        .eq("id", user.id)
        .single()
    : { data: null };

  const { data: colegio } = profile?.colegio_id
    ? await supabase
        .from("colegios")
        .select("nombre")
        .eq("id", profile.colegio_id)
        .single()
    : { data: null };

  // Traer hijos para el sidebar
  const { data: tutores } = user
    ? await supabase
        .from("tutores")
        .select(
          `alumno_id, relacion, alumnos ( id, nombre, apellido, foto_url, cursos ( id, nombre ) )`,
        )
        .eq("user_id", user.id)
    : { data: null };

  const hijos =
    tutores
      ?.map((t: any) => ({
        id: t.alumnos?.id,
        nombre: t.alumnos?.nombre,
        apellido: t.alumnos?.apellido,
        foto_url: t.alumnos?.foto_url,
        cursoId: t.alumnos?.cursos?.id,
        cursoNombre: t.alumnos?.cursos?.nombre,
        relacion: t.relacion,
      }))
      .filter((h) => h.id) ?? [];

  return (
    <div className="min-h-screen bg-gray-50 font-nunito">
      <NavbarPadre
        nombrePadre={profile?.full_name}
        colegio={colegio?.nombre}
        hijos={hijos}
      />
      <div className="lg:ml-64 pb-28 lg:pb-0 min-w-0">{children}</div>
    </div>
  );
}

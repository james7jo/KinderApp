import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CamaraStream from "@/components/camaras/CamaraStream";

export default async function CamaraMaestraPage({
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
    .select("nombre, colegio_id")
    .eq("id", id)
    .single();

  const { data: camaras } = await supabase
    .from("camaras")
    .select("*")
    .eq("colegio_id", curso?.colegio_id)
    .eq("activa", true)
    .order("created_at");

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center gap-4">
        <Link
          href={`/dashboard/maestra/curso/${id}`}
          className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">{curso?.nombre}</p>
          <h1 className="text-lg font-black text-gray-900">Cámaras en vivo</h1>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {camaras && camaras.length > 0 ? (
          <div className="flex flex-col gap-4">
            {camaras.map((camara) => (
              <CamaraStream
                key={camara.id}
                camara={camara}
                showDelete={false}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-5">
              <span className="text-4xl">📸</span>
            </div>
            <h2 className="font-black text-gray-800 text-xl mb-2">
              Sin cámaras
            </h2>
            <p className="text-gray-400 text-sm">
              El director debe agregar cámaras al sistema
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

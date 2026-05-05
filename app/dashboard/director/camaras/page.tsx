import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import CamaraStream from "@/components/camaras/CamaraStream";
import NuevaCamaraButton from "@/components/camaras/NuevaCamaraButton";

export default async function CamarasDirectorPage() {
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

  const { data: camaras } = await supabase
    .from("camaras")
    .select("*")
    .eq("colegio_id", profile?.colegio_id)
    .eq("activa", true)
    .order("created_at");

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28 lg:pb-10">
      <div className="bg-white border-b border-gray-100 px-5 lg:px-8 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-bold">DIRECTOR</p>
          <h1 className="text-lg font-black text-gray-900">Cámaras en vivo</h1>
        </div>
        <NuevaCamaraButton colegioId={profile?.colegio_id ?? ""} />
      </div>

      <div className="px-5 lg:px-8 pt-6 max-w-4xl mx-auto">
        {camaras && camaras.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {camaras.map((camara) => (
              <CamaraStream key={camara.id} camara={camara} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-5">
              <span className="text-4xl">📸</span>
            </div>
            <h2 className="font-black text-gray-800 text-xl mb-2">
              Sin cámaras aún
            </h2>
            <p className="text-gray-400 text-sm max-w-xs mb-6">
              Agregá la URL de stream de tu cámara IP
            </p>
            <NuevaCamaraButton colegioId={profile?.colegio_id ?? ""} />
          </div>
        )}
      </div>
    </div>
  );
}

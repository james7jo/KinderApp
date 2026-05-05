import Link from "next/link";
import NavbarDirector from "@/components/navigation/NavbarDirector";

export default function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {children}
      <NavbarDirector />
    </div>
  );
}

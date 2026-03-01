import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PromoCupones - Comunidad de Ofertas y Descuentos",
  description: "Descubre y comparte las mejores ofertas, cupones y promociones en México.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#0f1012] text-white`}>
        <ClientLayout user={user}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

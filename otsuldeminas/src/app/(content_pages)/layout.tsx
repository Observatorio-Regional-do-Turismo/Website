import Header from "@/components/Header";

export default function RootLayout({children}: LayoutProps) {

  return <>
    <Header color="highlight" />
    <main className="px-12 py-8 flex flex-col gap-4 grow">
      {children}
    </main>
  </>
}

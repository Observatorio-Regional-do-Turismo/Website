export default function RootLayout({children}: AppLayoutProps) {

  return <>
    <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-4 grow">
      {children}
    </main>
  </>
}

import Header from "@/components/Header";

export default function RootLayout({children}: LayoutProps) {

  return <>
    <Header color="green" />
    <main
      className="px-12 py-8"
    >{children}</main>
  </>
}

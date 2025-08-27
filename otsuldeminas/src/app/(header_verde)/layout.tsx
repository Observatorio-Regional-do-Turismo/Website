import Header from "@/components/Header";

export default function RootLayout({children}: LayoutProps) {

  return <>
    <Header text_color="green" />
    {children}
  </>
}

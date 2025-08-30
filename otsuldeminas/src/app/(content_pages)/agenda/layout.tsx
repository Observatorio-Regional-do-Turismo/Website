import AgendaCities from "./AgendaCities";
import AgendaTitle from "./AgendaTitle";

export default async function AgendaLayout({children}: LayoutProps){
  return <>
    <AgendaTitle />
    {children}
    <AgendaCities />
  </>
}
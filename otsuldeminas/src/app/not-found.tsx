import Header from "@/components/Header"
import Link from "next/link"

export default function NotFound(){
  return <>
    <Header color="highlight" />
    <main className="flex flex-col grow items-center justify-center gap-3">
      <h1 className="text-2xl font-medium">Página não encontrada!</h1>
      <p 
        className="text-lg"
      >
        Pare, tome um café e continue sua navegação <Link 
          className="text-highlight underline font-medium underline-offset-2" 
          href={"/"}
        >clicando aqui!</Link>
      </p>
    </main>
  </>
}
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid"
import { JSX } from "react"

const NAV_ITEMS : {
  label: string | JSX.Element,
  ref: string
}[] = [
  {
    label: 'página inicial',
    ref: '/'
  },
  {
    label: 'dados do turismo',
    ref: '/dados'
  },
  {
    label: 'agenda de eventos',
    ref: '/agenda'
  },
  {
    label: 'cursos',
    ref: '/cursos'
  },
  {
    label: 'selo',
    ref: '/selo'
  },
  {
    label: <MagnifyingGlassIcon className="size-8" />,
    ref: '/buscar'
  },
]

interface HeaderProps {
  text_color?: "white" | "green"
}

export default function Header({text_color}:HeaderProps){
  return <header
    className="flex flex-row justify-between items-center px-8 py-2"
  >
    <img src="/assets/logo_ort_horizontal.png" />
    <nav
      className="flex flex-row gap-7"
    >
      {
        NAV_ITEMS.map(item => <p 
          key={item.ref} 
          className={`text-xl cursor-pointer capitalize font-medium underline-offset-8 hover:underline duration-200 ${text_color === "green" ? "hover:text-green-500" : "hover:text-white"}`}
        >{item.label}</p>)
      }
    </nav>
  </header>
}
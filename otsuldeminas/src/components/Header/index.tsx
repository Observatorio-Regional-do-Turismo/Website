import NavItem from "./NavItem"
import { NAV_ITEMS } from "./NavItems"

interface HeaderProps {
  color?: HeaderColorOptions
}

export default function Header({color}:HeaderProps){

  if(!color) color = 'white'

  return <header
    className="flex flex-row justify-between items-center px-8 py-2"
  >
    <img src="/assets/logo_ort_horizontal.png" />
    <nav
      className="flex flex-row gap-7"
    >
      {
        NAV_ITEMS.map((item) => <NavItem key={item.path} label={item.label} path={item.path} color={color} />)
      }
    </nav>
  </header>
}
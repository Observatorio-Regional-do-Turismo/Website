'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavItemProps {
  label: string,
  path: string,
  color: HeaderColorOptions
}

export default function NavItem(item:NavItemProps){
  const pathname = usePathname()

  const hover_color = item.color === "highlight" ? "hover:text-highlight" : "hover:text-background"

  let underline = "hover:underline"
  let text_color = 'text-foreground'
  if(item.path === pathname){ 
    text_color = item.color === "highlight"? "text-highlight" : "text-background"
    underline = "underline"
  };

  return <Link 
    key={item.path}
    href={item.path}
    className={`text-xl ${text_color} ${hover_color} cursor-pointer capitalize font-medium underline-offset-8 ${underline} duration-200`}
  >{item.label}</Link>
}
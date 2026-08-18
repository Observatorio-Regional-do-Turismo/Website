/* eslint-disable */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Map, 
  BarChart3, 
  FileText, 
  Settings, 
  Info, 
  Menu,
  ChevronRight,
  Landmark
} from "lucide-react";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  const navItems = [
    { name: "Visão Geral", icon: BarChart3, path: "/" },
    { name: "Mapa Interativo", icon: Map, path: "#" },
    { name: "Relatórios", icon: FileText, path: "#" },
    { name: "Indicadores", icon: Landmark, path: "#" },
    { name: "Sobre o Projeto", icon: Info, path: "#" },
    { name: "Configurações", icon: Settings, path: "#" },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out bg-sidebar border-r border-sidebar-border flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
        <Landmark className={`text-primary transition-all duration-300 ${collapsed ? 'h-6 w-6' : 'h-8 w-8'}`} />
        {!collapsed && (
          <span className="ml-3 text-lg font-bold text-sidebar-foreground tracking-wide truncate">
            Observatório
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.name}>
                <Link 
                  href={item.path}
                  className={`flex items-center rounded-md px-3 py-2.5 transition-colors ${
                    isActive 
                      ? "bg-primary/20 text-primary border border-primary/30" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                  title={collapsed ? item.name : ""}
                >
                  <item.icon className={`flex-shrink-0 ${isActive ? 'h-5 w-5' : 'h-5 w-5'}`} />
                  {!collapsed && (
                    <span className="ml-3 text-sm font-medium truncate">
                      {item.name}
                    </span>
                  )}
                  {!collapsed && isActive && (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="bg-sidebar-accent rounded-lg p-3 text-xs text-sidebar-accent-foreground">
            <p className="font-semibold mb-1">Instituto Federal</p>
            <p>Sul de Minas Gerais</p>
            <p className="mt-2 text-primary opacity-80">v1.0-preliminar</p>
          </div>
        </div>
      )}
    </aside>
  );
}

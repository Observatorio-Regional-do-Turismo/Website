"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/assets/Logo_otsuldeminas.png";
import { 
  Map, 
  BarChart3, 
  FileText, 
  Menu,
  X,
  Landmark,
  CalendarDays,
  GraduationCap,
  Award
} from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Home", icon: Landmark, path: "/" },
    { name: "Visão Geral", icon: BarChart3, path: "/dashboard" },
    { name: "Mapa", icon: Map, path: "/mapa" },
    { name: "Agenda", icon: CalendarDays, path: "/agenda" },
    { name: "Cursos", icon: GraduationCap, path: "/cursos" },
    { name: "Selos", icon: Award, path: "/selos" },
    { name: "Relatórios", icon: FileText, path: "/relatorios" },
    { name: "Cidades", icon: Landmark, path: "/cidades" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary bg-primary shadow-lg shadow-primary/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="shrink-0 transition-opacity group-hover:opacity-90">
                <img
                  src={logo.src}
                  alt="Logo do Observatório de Turismo Suldeminas"
                  width={900}
                  height={650}
                  className="h-12 w-auto"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 lg:space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-secondary hover:text-white"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-white/70"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white/80 hover:text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Abrir menu principal</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-secondary bg-primary">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-secondary hover:text-white"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-white/70"}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

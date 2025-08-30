"use client"

import { useParams } from "next/navigation";

export default function AgendaTitle(){

  const params = useParams();
  const slug = params?.city
  let city_name = ""
  switch(slug){
    case "pocos_de_caldas": city_name = "Poços de Caldas"
      break
  }

  return <h1 className="font-semibold text-7xl">Agenda de Eventos{city_name != "" && ` - ${city_name}`}</h1>
}
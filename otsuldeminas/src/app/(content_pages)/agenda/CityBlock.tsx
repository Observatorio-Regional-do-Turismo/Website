import Link from "next/link";

export default function CityBlock(){
  return <Link
    href={"/agenda/pocos_de_caldas"}
    className="cursor-pointer bg-[url('assets/pocos_de_caldas.jpg')] basis-1/3 max-w-[calc(33.333%-1.5rem)] h-[220px] bg-cover bg-center"
  >
  <div className="flex justify-center items-center w-full h-full bg-highlight/45">
    <p className="font-bold text-background text-2xl">Poços de Caldas</p>
  </div>
</Link>
}
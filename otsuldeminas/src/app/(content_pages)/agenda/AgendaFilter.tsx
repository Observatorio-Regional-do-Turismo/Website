import { MagnifyingGlassIcon, ChevronDownIcon, CalendarIcon } from "@heroicons/react/16/solid";

export default function AgendaFilter(){
  return <div className="bg-background2 py-6 px-4 flex flex-row gap-4 rounded-md">
    <FilterSection title="Pesquisa" inputs={[
      {Icon:MagnifyingGlassIcon, label:"evento"},
    ]} />
    <FilterSection title="Filtros" inputs={[
      {Icon:ChevronDownIcon, label:"cidade"},
      {Icon:CalendarIcon, label:"data"},
    ]} />
  </div>
}


interface FilterSectionProps{
  title: string,
  inputs: FilterInputProps[]
}
function FilterSection({title, inputs}:FilterSectionProps){
  return <section className="w-full flex flex-col gap-1">
    <p className="text-2xl font-medium capitalize">{title}:</p>
    <div className="flex flex-row gap-4">
      {
        inputs.map((v) => <FilterInput key={v.label} {...v} />)
      }
    </div>
  </section>
}


interface FilterInputProps {
  label: string,
  Icon: HeroiconsIcon,
}
function FilterInput({label, Icon}:FilterInputProps){
  return <div className="flex flex-col w-full">
    <label 
      className="capitalize text-base font-medium text-foreground"
    >{label}:</label>
    <div className="flex flex-row items-center gap-1.5 p-1.5 bg-background rounded-md">
      <Icon className="size-5" />
      <input
        type="text"
        className="outline-none border-none w-full"
      />
    </div>
  </div>
}
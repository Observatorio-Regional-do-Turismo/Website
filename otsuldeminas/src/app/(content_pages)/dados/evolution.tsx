"use client"

import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import DataEvolution from "data/evolucao.json"
import NomeCidades from "data/municipios.json"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface ChartData {
  mes: string,
  total: number
}

export default function EvolutionGraph() {
  const [allMunicipios, ] = useState<string[]>(NomeCidades)
  const [selectedMunicipios, setSelectedMunicipios] = useState<string[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    const municipiosSelecionados = DataEvolution.filter(m => selectedMunicipios.includes(m.municipio))
    const todosMeses = new Set<string>()
    municipiosSelecionados.forEach(municipio => 
      municipio.evolucao_funcionarios.forEach((e) => todosMeses.add(e.mes))
    )
    const mesesOrdenados = Array.from(todosMeses).sort()
    const dadosGrafico = mesesOrdenados.map((mes: string) => {
      let totalFuncionarios = 0
      municipiosSelecionados.forEach((municipio) => {
        const dado = municipio.evolucao_funcionarios.find((e) => e.mes === mes)
        if (dado) totalFuncionarios += dado.funcionarios || 0
      })
      return {mes: mes.split('-').reverse().join('/'), total: totalFuncionarios}
    })
    setChartData(dadosGrafico)
  }, [selectedMunicipios])

  useEffect(() => selectAll(), [])

  const toggleMunicipio = (name: string) => {
    setSelectedMunicipios(prev => prev.includes(name)? prev.filter(m => m !== name): [...prev, name])
  }

  const selectAll = () => setSelectedMunicipios(allMunicipios)
  const selectNone = () => setSelectedMunicipios([])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="font-semibold text-3xl">Evolução total de funcionários</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filtrar Municípios ({selectedMunicipios.length}/{allMunicipios.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
            <div className="p-2 border-b">
              <Button variant="ghost" size="sm" onClick={selectAll} className="w-full justify-start">
                Selecionar Todos
              </Button>
              <Button variant="ghost" size="sm" onClick={selectNone} className="w-full justify-start">
                Desselecionar Todos
              </Button>
            </div>
            {allMunicipios.map((municipio) => (
              <DropdownMenuCheckboxItem
                key={municipio}
                checked={selectedMunicipios.includes(municipio)}
                onCheckedChange={() => toggleMunicipio(municipio)}
              >
                {municipio}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <ChartContainer 
          config={{
            total: {
              label: "Total de Funcionários",
            },
          }}
          className="w-full h-60"
        >
          <LineChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey="total"
              type="monotone"
              stroke="var(--color-highlight)"
              strokeWidth={3}
              dot={{ fill: "var(--color-highlight)", r: 2 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground leading-none">
          Mostrando soma de {selectedMunicipios.length} municípios selecionados
        </p>
      </CardFooter>
    </Card>
  )
}

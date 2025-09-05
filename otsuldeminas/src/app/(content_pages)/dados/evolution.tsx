"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Check } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
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

export const description = "Evolução de funcionários por município"

const chartConfig = {
  total: {
    label: "Total de Funcionários",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function EvolutionGraph() {
  const [chartData, setChartData] = useState<any[]>([])
  const [allMunicipios, setAllMunicipios] = useState<string[]>([])
  const [selectedMunicipios, setSelectedMunicipios] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<any[]>([])

  useEffect(() => {
    import("../../../data/evolucao.json")
      .then((data) => {
        const evolucaoData = data.default

        // Filtra municípios que têm dados
        const municipiosComDados = evolucaoData.filter(
          (m: any) => m.municipio && m.evolucao_funcionarios && m.evolucao_funcionarios.length > 0
        )

        if (municipiosComDados.length === 0) {
          setError("Nenhum município com dados encontrado")
          setLoading(false)
          return
        }

        setRawData(municipiosComDados)
        const nomesMunicipios = municipiosComDados.map((m: any) => m.municipio)
        setAllMunicipios(nomesMunicipios)
        setSelectedMunicipios(nomesMunicipios) // Inicialmente todos selecionados

        setLoading(false)
      })
      .catch((error) => {
        console.error("Erro ao carregar evolucao.json:", error)
        setError("Erro ao carregar dados")
        setLoading(false)
      })
  }, [])

  // Recalcula dados quando municípios selecionados mudam
  useEffect(() => {
    if (rawData.length === 0 || selectedMunicipios.length === 0) {
      setChartData([])
      return
    }

    // Filtra apenas os municípios selecionados
    const municipiosSelecionados = rawData.filter(m => 
      selectedMunicipios.includes(m.municipio)
    )

    // Pega todos os meses disponíveis
    const todosMeses = new Set<string>()
    municipiosSelecionados.forEach(municipio => {
      municipio.evolucao_funcionarios.forEach((e: any) => {
        todosMeses.add(e.mes)
      })
    })

    const mesesOrdenados = Array.from(todosMeses).sort()

    // Soma funcionários por mês
    const dadosGrafico = mesesOrdenados.map((mes: string) => {
      let totalFuncionarios = 0

      municipiosSelecionados.forEach((municipio: any) => {
        const dado = municipio.evolucao_funcionarios.find((e: any) => e.mes === mes)
        if (dado) {
          totalFuncionarios += dado.funcionarios || 0
        }
      })

      return {
        mes: mes.slice(5), // Remove "2024-" ou "2025-"
        total: totalFuncionarios
      }
    })

    setChartData(dadosGrafico)
  }, [rawData, selectedMunicipios])

  const toggleMunicipio = (municipio: string) => {
    setSelectedMunicipios(prev => 
      prev.includes(municipio)
        ? prev.filter(m => m !== municipio)
        : [...prev, municipio]
    )
  }

  const selectAll = () => setSelectedMunicipios(allMunicipios)
  const selectNone = () => setSelectedMunicipios([])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Carregando dados...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Verifique se o arquivo evolucao.json contém dados válidos
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução Total de Funcionários</CardTitle>
        <CardDescription>Janeiro 2024 - Julho 2025</CardDescription>
        <div className="flex gap-2">
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
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            data={chartData}
            margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
            width={800}
            height={400}
          >
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
              stroke="var(--chart-1)"
              strokeWidth={3}
              dot={{ fill: "var(--chart-1)", r: 4 }}
              activeDot={{ r: 8 }}
              name="Total de Funcionários"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Evolução do turismo na região <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Mostrando soma de {selectedMunicipios.length} municípios selecionados
        </div>
      </CardFooter>
    </Card>
  )
}

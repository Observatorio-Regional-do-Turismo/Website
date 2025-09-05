"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import DataFuncionarios from "data/funcionarios_ultimo.json"
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


export function Funcionarios() {
  const sortedData = [...DataFuncionarios].sort((a, b) => b.funcionarios - a.funcionarios);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-3xl">Funcionários por município</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{
          funcionarios: {
            label: "Funcionários",
          }
        }} className="w-full h-60">
          <BarChart accessibilityLayer data={sortedData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="municipio"
              tickLine={false}
              tick={false}
              axisLine={false}
            />
            <YAxis
              dataKey="funcionarios"
              tickFormatter={(value) => value.toLocaleString()}
              domain={[0, 'dataMax']}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <Bar dataKey="funcionarios" fill="var(--color-highlight)"/>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground leading-none">
          Dados de {new Date(sortedData[0]['data']).toLocaleDateString('pt-BR')}
        </p>
      </CardFooter>
    </Card>
  )
}

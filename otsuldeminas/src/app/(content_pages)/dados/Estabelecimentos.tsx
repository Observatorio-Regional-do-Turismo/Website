"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import DataEstabelecimentos from "data/estabelecimentos.json"
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


export function Estabelecimentos() {
  const sortedData = [...DataEstabelecimentos].sort((a, b) => b.estabelecimentos - a.estabelecimentos);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-3xl">Estabelecimentos por município</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer 
          config={{
            estabelecimentos: {
              label: "Estabelecimentos",
            }
          }} 
          className="w-full h-60"
        >
          <BarChart accessibilityLayer data={sortedData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="municipio"
              tickLine={false}
              tick={false}
              axisLine={false}
            />
            <YAxis
              dataKey="estabelecimentos"
              tickFormatter={(value) => value.toLocaleString()}
              domain={[0, 'dataMax']}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <Bar dataKey="estabelecimentos" fill="var(--color-highlight)"/>
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

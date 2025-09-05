import EvolutionGraph from "./Evolution"
import { Estabelecimentos } from "./Estabelecimentos";
import { Funcionarios } from "./Funcionarios";

export default function Dados() {
  return <>
    <h1 className="font-semibold text-7xl">Dados do Turismo</h1>
    <Estabelecimentos />
    <Funcionarios />
    <EvolutionGraph />
  </>
}

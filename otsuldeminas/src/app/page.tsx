import Header from "@/components/Header";

export default function Home() {
  return <main>
    <section className="
      bg-[url('assets/home_background.png')] min-h-screen bg-cover bg-center
      flex flex-col justify-between
    ">
      <Header />
      <div className="flex justify-center items-center mb-48">
        <img src="assets/logo_ort_horizontal_grande.png" className="h-48" />
      </div>
      <div className="
        min-h-[40vh] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.5),rgba(255,255,255,1))]
        font-semibold text-2xl text-center items-center
        flex px-36 justify-center
      ">
        <p>Observatório tem como principais objetivos o monitoramento em rede da atividade turística na região, o incentivo à inovação, à inteligência de mercado e o fomento à pesquisa acadêmica em turismo. Isso será feito por meio do levantamento de pesquisas, dados, números e elaboração de indicadores, entre outras ações que visam o desenvolvimento sustentável do setor. O Observatório também conta com o Programa de Capacitação Regional, voltado para a qualificação dos profissionais do turismo, e a criação de um Selo de Qualidade, que reconhecerá as melhores práticas no setor.</p>
      </div>
    </section>
    <section className="bg-background h-64">

    </section>
  </main>
}

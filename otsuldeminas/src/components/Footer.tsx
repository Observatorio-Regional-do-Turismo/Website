export default function Footer(){
  return <footer className="flex flex-col items-center gap-3 bg-[#F4F4F4] py-3">
    <p className="
      border-t-2 border-black text-2xl font-medium text-center w-[70vw] p-3
    ">Desenvolvido por</p>
    <div className="flex gap-8 justify-center items-center">
      <img src="/assets/logo_cg_horizontal.png" />
      <img src="/assets/logo_if_horizontal.png" />
    </div>
  </footer>
}
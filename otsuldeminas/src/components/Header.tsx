const NAV_ITEMS : Object = {
  "página inicial": "adasd",
  "dados do turismo": "",
  "agenda de eventos": "",
  "cursos": "",
  "selo": "",
}

export default function Header(){
  return <header>
    <img src="/assets/logo_ort_horizontal.png" />
    <nav>
      {
        Object.keys(NAV_ITEMS).map((key) => <a>{key} - {NAV_ITEMS[key]} </a>)
      }
    </nav>
  </header>
}
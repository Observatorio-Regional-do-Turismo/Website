import { FileText } from "lucide-react";

export default function RelatoriosPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <FileText className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-4xl font-bold text-slate-800 mb-4">Relatórios</h1>
      <p className="text-lg text-slate-600 max-w-lg">
        Esta funcionalidade está em desenvolvimento. Em breve você poderá baixar estudos detalhados e cruzamento de dados sobre o turismo do Sul de Minas.
      </p>
    </div>
  );
}

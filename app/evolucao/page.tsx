import Link from "next/link";

export default function EvolucaoPage() {
  return (
    <main>
      <Link href="/" className="back-link">
        ← Voltar
      </Link>
      <div className="eyebrow">Calistenia</div>
      <h2>Evolução</h2>
      <p className="muted">
        Os gráficos de evolução por exercício ainda não estão feitos. É o
        próximo passo, a seguir ao registo e ao histórico.
      </p>
    </main>
  );
}

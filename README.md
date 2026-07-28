# Tudo Nosso — Plataforma de Treino de Calistenia

Plataforma para registo e acompanhamento de treinos de calistenia (rua e casa),
construída para o treino que o Diogo desenhou.

## Arquitetura

- **Next.js 14 (App Router, TypeScript)** — frontend e rotas.
- **Supabase** — base de dados Postgres. Sem autenticação, acesso aberto
  (papel `anon`), pensado para um pequeno grupo de utilizadores de confiança
  (o Diogo e o amigo), não para uso público.
- **Vercel** — deploy e hosting.

### Modelo de dados

- `exercises` — tabela de referência com o plano de exercícios (rua, casa ou
  ambos), séries e repetições alvo.
- `sessions` — uma sessão de treino por dia (rua, casa ou descanso), com
  avaliação geral e notas. Único por data (não há separação por utilizador).
- `session_exercises` — o registo de cada exercício dentro de uma sessão
  (repetições por série, avaliação individual).

### Sem login

Decisão: sem autenticação, por pedido explícito. Isto simplifica tudo, mas tem
um custo real a saber: os dados ficam abertos a quem tiver o link do site
(não há separação por conta nem proteção de escrita). Aceitável para um
projeto pessoal entre duas pessoas de confiança, mas se um dia isto crescer
para mais gente, a autenticação (que já esteve implementada numa versão
anterior) tem de voltar.

## Estrutura de páginas

- `/` — ecrã inicial: treinar, marcar descanso, ver registos, ver evolução.
- `/registar` — registar o treino do dia (rua ou casa).
- `/historico` — lista de treinos anteriores, com detalhe por exercício.
- `/evolucao` — reservado para os gráficos de evolução (ainda por construir).

## Como correr localmente

```bash
npm install
npm run dev
```

O `lib/supabaseClient.ts` já tem o URL e a chave pública do projeto Supabase
como valores por omissão (são seguros para expor, não são segredos). Se
quiseres apontar para outro projeto Supabase, cria um `.env.local` a partir de
`.env.local.example`.

## Como testar a funcionalidade principal

1. Corre `npm run dev` e abre `http://localhost:3000`.
2. No ecrã inicial, clica em "Vou treinar", escolhe rua ou casa, preenche as
   repetições por série de cada exercício e guarda. Ou clica em "Hoje é
   descanso" para marcar o dia diretamente.
3. Em "Ver registos", confirma que a sessão aparece e que os detalhes por
   exercício abrem ao clicar.

## Próximos passos possíveis

- Gráficos de evolução por exercício (página `/evolucao` já existe como
  placeholder).
- Vista de calendário no histórico (mês a mês, com média por dia).

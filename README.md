# Tudo Nosso — Plataforma de Treino de Calistenia

Plataforma para registo e acompanhamento de treinos de calistenia (rua e casa),
construída para o treino que o Diogo desenhou.

## Arquitetura

- **Next.js 14 (App Router, TypeScript)** — frontend e rotas.
- **Supabase** — base de dados Postgres, autenticação (magic link por email) e
  Row Level Security (cada pessoa só vê os seus próprios dados).
- **Vercel** — deploy e hosting.

### Modelo de dados

- `profiles` — um registo por utilizador autenticado.
- `exercises` — tabela de referência com o plano de exercícios (rua, casa ou
  ambos), séries e repetições alvo.
- `sessions` — uma sessão de treino por dia (rua, casa ou descanso), com
  avaliação geral e notas. Único por (utilizador, data).
- `session_exercises` — o registo de cada exercício dentro de uma sessão
  (repetições por série, avaliação individual).

### Autenticação

Decisão: autenticação real desde o início (magic link, sem passwords), mas sem
ecrãs de gestão de conta. Isto evita ter de reescrever a estrutura da base de
dados se mais pessoas vierem a usar a plataforma, sem gastar tempo em
funcionalidades que não são precisas agora (registo, recuperação de password).

## Estrutura de páginas

- `/login` — pedir o link de acesso por email.
- `/auth/callback` — troca o link mágico pela sessão e garante que existe um
  perfil.
- `/registar` — registar o treino do dia (rua, casa ou descanso).
- `/historico` — lista de treinos anteriores, com detalhe por exercício.

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
2. Entra com o teu email (vais receber um link mágico).
3. Em "Registar", escolhe o modo (rua, casa ou descanso), preenche as
   repetições por série de cada exercício e guarda.
4. Em "Histórico", confirma que a sessão aparece e que os detalhes por
   exercício abrem ao clicar.

## Próximos passos possíveis

- Vista de calendário no histórico (mês a mês, com média por dia).
- Gráfico de evolução por exercício ao longo do tempo.
- Convite explícito de um segundo utilizador (o amigo), já suportado pela
  estrutura de dados, falta só o fluxo de convite.

# 🎂 Confirmação de Presença (RSVP) — Aniversário Gustavo & Michele 🎉

Aplicação Web completa, moderna e responsiva para confirmação de presença (RSVP) do aniversário de **Gustavo (36 anos)** e **Michele (34 anos)** no dia **06/09/2026 às 13h30**, integrada diretamente ao banco de dados **Neon PostgreSQL** na AWS São Paulo (`sa-east-1`).

---

## ✨ Funcionalidades Principais

### 1. 💌 Página do Convidado (Mobile-First)
- **Visual Sofisticado**: Estilo Dark Luxury inspirado no convite oficial do WhatsApp com efeitos de vidro (*glassmorphism*), detalhes em ouro/âmbar e tipografia elegante.
- **Contagem Regressiva em Tempo Real** até o dia 06/09/2026 às 13h30.
- **Localização e Navegação 1-Clique**:
  - Link direto para abrir rota no **Google Maps**, **Waze** ou pedir **Uber**.
  - Endereço: *Salão de Festas — Rua Cajuru 89, Belenzinho, São Paulo - SP*.
- **Adicionar à Agenda**:
  - Botão de 1 clique para salvar no **Google Agenda**.
  - Download de arquivo `.ics` para **Apple iCal / iPhone / Outlook**.
- **Busca e Seleção Inteligente**:
  - Todos os **57 convidados** da lista original cadastrados no Neon.
  - Nomes repetidos e homônimos são diferenciados pelo número do convite (#1 a #57).
- **Formulário de Confirmação**:
  - Escolha entre *"Sim, vou com certeza! 🎉"* ou *"Infelizmente não poderei ir 😢"*.
  - Quantidade de adultos e crianças (para cálculo exato da comida).
  - Nomes dos acompanhantes.
  - Telefone / WhatsApp.
  - Restrições alimentares (ex: vegetariano, celíaco, intolerante).
  - Mural de recados para deixar mensagens carinhosas aos aniversariantes.
  - **Efeito de Confetes (Canvas Confetti)** comemorativo na tela ao confirmar!
  - Botão para compartilhar confirmação no WhatsApp.

---

### 2. 🥩📊 Painel dos Aniversariantes (`/admin`)
- **Acesso com PIN**: Protegido por PIN (`3634` — idade do Gustavo + Michele).
- **Métricas em Tempo Real**:
  - Total de Confirmados (Adultos + Crianças).
  - Total de Pendentes (que ainda não responderam).
  - Total de Recusados.
  - Taxa de confirmação da lista (%).
- **Calculadora Automática de Churrasco & Compras**:
  - **Carnes**: Total em kg, Carne Bovina (Picanha/Alcatra/Fraldinha), Linguiça e Frango (cálculo balanceado 400g/adulto e 200g/criança).
  - **Acompanhamentos**: Pão de alho (unidades), Queijo coalho (espetos), Arroz cru (kg), Farofa (kg), Vinagrete (kg).
  - **Bebidas Não Alcoólicas**: Refrigerantes/sucos (L) e Água mineral (L).
  - **Estrutura & Carvão**: Sacos de Carvão 10kg, Sacos de Gelo 5kg (para coolers), descartáveis (pratos, copos, kits de talheres, guardanapos).
  - **Modo Projeção**: Alternância com 1 clique para ver a estimativa considerando 80% dos pendentes.
- **Gestão de Convidados**:
  - Filtros por status (*Todos*, *Confirmados*, *Pendentes*, *Recusados*).
  - **Botão "Cobrar no WhatsApp"**: Gera mensagem personalizada no WhatsApp com link direto de confirmação para os convidados pendentes.
  - **Adicionar Convidado**: Cadastro rápido de convidados extras.
  - **Exportar CSV**: Download de planilha pronta para envio a fornecedores.
  - **Mural de Recados**: Visualização de todas as mensagens de parabéns deixadas.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend & Backend**: [Next.js 14](https://nextjs.org/) (App Router, React 18, Server Routes)
- **Estilização**: [Tailwind CSS v3](https://tailwindcss.com/) com paleta dark customizada
- **Banco de Dados**: [Neon Serverless PostgreSQL](https://neon.tech/) (Projeto `convite aniversario`, Região `aws-sa-east-1`)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Animações**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 🚀 Como Executar Localmente

1. Certifique-se de que o arquivo `.env.local` contém:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_1kQWRyBezOJ6@ep-winter-hill-ac1yl0lp-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
   ADMIN_PIN="3634"
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abra no navegador:
   - **Página do Convite (RSVP)**: `http://localhost:3000`
   - **Painel de Gestão**: `http://localhost:3000/admin` (PIN: `3634`)

---

## 🌐 Como Publicar na Vercel

O projeto está 100% pronto para deploy na [Vercel](https://vercel.com/):
1. Suba o projeto para seu repositório no GitHub ou use o Vercel CLI (`npx vercel`).
2. Adicione as variáveis de ambiente na Vercel:
   - `DATABASE_URL`: A string de conexão do Neon.
   - `ADMIN_PIN`: `3634` (ou o PIN que preferir).
3. O deploy será concluído em menos de 1 minuto!

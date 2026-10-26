# 🏛️ SGC-SEMPI — Sistema de Gestão de Contratos e Atas de Registro de Preços
**Secretaria de Estado da Mulher e de Políticas Inclusivas do Estado do Rio de Janeiro (SEMPI-RJ)**

Sistema web de alta densidade informacional para controle ponta a ponta de Contratos Administrativos, Contratações Diretas por Nota de Empenho (Art. 95 da Lei nº 14.133/2021), Termos Aditivos, Apostilamentos, Comissões de Fiscalização (DOERJ), Atas de Registro de Preços (Gerenciadoras e Participantes) e Execução Orçamentária/Financeira integrada logicamente ao **SEI-RJ**, **SIGA-RJ** e **SIAFE-Rio**.

---

## ✨ Diferenciais Arquiteturais

*   **Cruzamento Automático Chave SIGA / Empenho x Vigência:** Motor em PL/pgSQL que identifica automaticamente se uma Nota de Empenho pertence ao Contrato Inicial ou a determinado Termo Aditivo com base nas janelas temporais de vigência, alertando anomalias fora de período.
*   **Árvore Genealógica de Empenhos (SIAFE-Rio):** Suporte nativo a Empenho Original (`NE`), múltiplos Eventos de **Reforço** e **Anulação Parcial/Total** (cada um com seu próprio número de `NE` no SIAFE) e múltiplas **Liquidações (`NL` / Notas Fiscais)**.
*   **Suporte ao Art. 95 da Lei 14.133/2021:** Gestão unificada tanto de **Contratos Formais** quanto de **Notas de Empenho com Força de Contrato** (entrega imediata/dispensas), com trava jurídica no banco impedindo Termos Aditivos em contratações sem instrumento formal.
*   **Gestão de Atas (Órgão Gerenciador vs. Órgão Participante):** Controle estrito da cota da SEMPI por item do catálogo SIGA, com abate automático de saldo a cada empenho vinculado.
*   **Auditoria Forense Imutável (`JSONB Diff`):** Triggers nativas no PostgreSQL que capturam `OLD` e `NEW` payloads em qualquer mutação, exibidas na interface através de um inspetor visual estilo *Git Diff*.
*   **UI "Swiss Ledger":** Interface desenhada sob medida para análise governamental e financeira, utilizando grades de `1px`, tipografia tabular monoespaçada para códigos e valores monetários, e chips de cópia rápida (*One-Click Copy*).

---

## 🚀 Stack Tecnológica

*   **Framework:** [Next.js 15+](https://nextjs.org/) (App Router, React Server Components, Server Actions)
*   **Linguagem:** [TypeScript 5+](https://www.typescriptlang.org/) (Strict Mode)
*   **Banco de Dados & Autenticação:** [Supabase](https://supabase.com/) (PostgreSQL 16+, Row Level Security, PL/pgSQL Triggers)
*   **Estilização & UI:** [Tailwind CSS](https://tailwindcss.com/) + Componentes Headless ([Radix UI](https://www.radix-ui.com/)) + [Lucide Icons](https://lucide.dev/)
*   **Validação de Dados:** [Zod](https://zod.dev/) + React Hook Form

---

## 📂 Estrutura de Diretórios

```text
├── agents.md                           # Orquestração para Agentes IA (Fullstack, UI, QA, Security)
├── contexto.md                         # Documentação de Domínio, Regras da Lei 14.133 e Schema
├── supabase/
│   └── migrations/
│       └── 0001_init_sgc_sempi.sql     # DDL Completo, ENUMs, Constraints, Triggers e RLS
└── src/
    ├── app/
    │   ├── (auth)/login/               # Autenticação institucional
    │   └── (dashboard)/
    │       ├── page.tsx                # Matriz de Conformidade, Alertas 60d e Contratos Acéfalos
    │       ├── contratos/
    │       │   ├── page.tsx            # DataGrid de Contratos e Empenhos Substitutivos (Art. 95)
    │       │   └── [id]/page.tsx       # Dossiê 360º: Régua Vigência x SIGA, Aditivos, Empenhos e Fiscais
    │       ├── atas/
    │       │   └── page.tsx            # Split-View: Atas Gerenciadas vs. Participantes + Consumo SIGA
    │       ├── fiscais/
    │       │   └── page.tsx            # Quadro de Comissões, Portarias DOERJ e Carga por Servidor
    │       └── auditoria/
    │           └── page.tsx            # Inspetor de Logs Imutáveis com JSONB Diff Viewer
    ├── actions/                        # Server Actions validadas com Zod e protegidas por RBAC
    ├── components/
    │   ├── ui-ledger/                  # Design System Swiss Ledger (CodeBadge, HairlineCard, Gauges)
    │   ├── contratos/                  # Régua Temporal, Árvore de Empenhos e Drawers de Mutações
    │   ├── atas/                       # Medidores de Cota SEMPI e Abate de Itens
    │   └── auditoria/                  # Visualizador Lado a Lado (Antes vs. Depois)
    └── lib/
        ├── supabase/                   # Clientes SSR (Server, Client, Middleware)
        ├── types/                      # Tipos gerados a partir do Schema SQL
        └── validators/                 # Schemas Zod e Máscaras SEI-RJ / SIAFE-Rio / SIGA
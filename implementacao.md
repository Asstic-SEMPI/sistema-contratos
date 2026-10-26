# 📋 Diário de Bordo e Rastreabilidade da Implementação — SGC-SEMPI/RJ

Este arquivo registra o roadmap modular, status de execução, decisões arquiteturais e o histórico de entregas do **Sistema de Gestão de Contratos e Atas de Registro de Preços da Secretaria de Estado da Mulher e de Políticas Inclusivas do Rio de Janeiro (SGC-SEMPI)**.

---

## 🏛️ Visão do Projeto
- **Instituição:** Secretaria de Estado da Mulher e de Políticas Inclusivas (SEMPI-RJ)
- **Base Legal:** Lei Federal nº 14.133/2021 (Nova Lei de Licitações) e regulamentos do Estado do Rio de Janeiro
- **Sistemas Integrados (Lógica/Identificadores):** SEI-RJ, SIGA-RJ e SIAFE-Rio
- **Stack:** Next.js 15+ (App Router), TypeScript 5+ (Strict), Tailwind CSS, Supabase (PostgreSQL 16+ com RLS, Triggers e Generated Columns), Zod
- **Linguagem Visual:** "Swiss Ledger" (Papel técnico `#F6F5F0`, Ameixa SEMPI `#581526`, Verde-Petróleo `#0D3B3E`, divisórias `1px`, tipografia tabular monoespaçada)

---

## 🗺️ Roadmap de Módulos e Status

| Módulo | Descrição | Status | Responsáveis |
| :--- | :--- | :---: | :--- |
| **Módulo 0** | **Fundação do Projeto & Design System Swiss Ledger**<br>- Inicialização do Next.js com App Router e TypeScript estrito<br>- Dependências (`@supabase/ssr`, `zod`, `lucide-react`, `tailwind-merge`, etc.)<br>- Setup de Tipos TypeScript (`database.types.ts`) a partir do schema SQL<br>- Supabase SSR Client (Server, Client, Middleware)<br>- Tokens visuais Swiss Ledger & Componentes Atômicos (`CodeBadge`, `HairlineCard`, `StatusBadge`, `MoneyCell`, formatações tabulares) | 🟢 Concluído | `@fullstack`<br>`@frontend-designer` |
| **Módulo 1** | **Autenticação, Perfis (RBAC) & Shell da Aplicação**<br>- Página de Login Institucional (`/login`)<br>- Contexto e sincronização de perfil do usuário (`perfis_usuarios`)<br>- App Shell com Barra de Navegação Swiss Ledger, identificação de setor/ID funcional e breadcrumb<br>- Matriz de Conformidade e Dashboard de Alertas Imediatos (`/`) | 🟢 Concluído | `@fullstack`<br>`@frontend-designer`<br>`@security-secops` |
| **Módulo 2** | **Dossiê de Contratos & Instrumentos Substitutivos (Art. 95)**<br>- DataGrid denso de Contratos Formais e Empenhos com Força de Contrato<br>- Dossiê 360º do Contrato (`/contratos/[id]`)<br>- Régua Temporal visual (Vigência x Chave SIGA / SIAFE-Rio)<br>- Validação jurídica: obrigatoriedade de `numero_contrato` para formal e opcional para Art. 95<br>- Slide-over Drawer de cadastro com alternância de regras da Lei 14.133<br>- Server Actions validadas com Zod e sem `any` | 🟢 Concluído | `@fullstack`<br>`@frontend-designer`<br>`@qa-critic` |
| **Módulo 3** | **Alterações Contratuais (Aditivos e Apostilamentos)**<br>- Aditivos de Prazo, Valor, Misto e Apostilamentos<br>- Trava jurídica: bloqueio de Aditivos para Nota de Empenho (Art. 95)<br>- Cálculo de teto legal de 25% / 50% de acréscimo<br>- Sincronização automática do valor atualizado e vigência no banco<br>- Gaveta `NovoAditivoDrawer` com preview financeiro e trava dinâmica | 🟢 Concluído | `@fullstack`<br>`@frontend-designer`<br>`@qa-critic` |
| **Módulo 4** | **Comissão de Fiscalização, Portarias DOERJ & Swap Atômico**<br>- Quadro de Fiscais e Gestores (`/fiscais`)<br>- Designação e substituição atômica de fiscais com Portaria DOERJ<br>- Detecção e alerta imediato de Contratos Acéfalos (sem gestor/fiscal ativo)<br>- Gaveta `NovoFiscalDrawer` com alternância entre nova designação e Swap Atômico | 🟢 Concluído | `@fullstack`<br>`@frontend-designer`<br>`@security-secops` |
| **Módulo 5** | **Execução Financeira & SIAFE-Rio (Empenhos, Reforços/Anulações e Liquidações)**<br>- Lançamento de Empenhos com classificação temporal automática (Régua Chave SIGA x Vigência)<br>- Árvore Genealógica: Empenho Original ➔ Reforços/Anulações (com NEs próprias) ➔ Liquidações (Notas Fiscais/NLs)<br>- Tabela em Árvore Master-Detail expansível com gavetas laterais de inserção<br>- Validação contábil estrita de limites de anulação | 🟢 Concluído | `@fullstack`<br>`@frontend-designer`<br>`@qa-critic` |
| **Módulo 6** | **Atas de Registro de Preços (Gerenciadora vs. Participante)**<br>- Split-view de Atas Gerenciadas SEMPI vs. Participantes/Caronas (`/atas`)<br>- Catálogo de Itens SIGA com cotas da secretaria e saldo gerado<br>- Dossiê 360º da Ata (`/atas/[id]`) com histórico de baixas e contratos decorrentes<br>- Abate automático de saldo via trigger (`trg_sync_consumo_ata`) e bloqueio de estouro de cota (`chk_empenho_nao_excede_cota`) | 🟢 Concluído | `@fullstack`<br>`@frontend-designer`<br>`@qa-critic` |
| **Módulo 7** | **Dashboard Executivo, Matriz de Conformidade & Trilha de Auditoria Forense**<br>- Painel Home (`/`): Contratos a vencer (< 60d), Acéfalos, Empenhos anômalos fora de vigência<br>- Visualizador de Auditoria Forense (`/auditoria`) com Inspetor JSONB Diff (Antes vs. Depois)<br>- Imutabilidade estrita via RLS no PostgreSQL (bloqueio de UPDATE/DELETE) | 🟢 Concluído | `@fullstack`<br>`@frontend-designer`<br>`@security-secops`<br>`@qa-critic` |

---

## 🎯 Definição de Pronto (Definition of Done - DoD)
Todos os critérios do protocolo de orquestração foram cumpridos e homologados:
- [x] Compilação limpa em TypeScript estrito (`tsc --noEmit`).
- [x] Tipagem derivada do schema PostgreSQL sem uso de `any`.
- [x] Regras de negócio e integridade validadas via Zod + Triggers do banco.
- [x] Interface no padrão visual *Swiss Ledger* com dados financeiros e identificadores (SEI, SIGA, NE, NL, CNPJ) em fonte monoespaçada e alinhamento tabular (`tabular-nums font-mono`).
- [x] Permissões de acesso respeitadas de acordo com a Role ativa (`ADMIN`, `GESTOR_CONTRATOS`, `FINANCEIRO`, `FISCAL`, `CONSULTA_TCE`).
- [x] Trilha de auditoria gerada automaticamente nas mutações com motor de Diff JSONB.

---

## 📝 Histórico de Execuções e Atualizações

### [2026-10-20] — Módulo 0: Fundação & Design System Swiss Ledger (Concluído)
- Leitura dos requisitos em `agents.md`, `contexto.md`, `readme.md` e `0001_init_sgc_sempi.sql`.
- Configuração do projeto Next.js 15+ com TypeScript estrito (`tsconfig.json`), PostCSS e Tailwind CSS (`tailwind.config.ts`).
- Instalação e integração de pacotes: `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `clsx`, `tailwind-merge`, `lucide-react`.
- Geração completa e sem `any` dos tipos de banco em `src/lib/types/database.types.ts`.
- Clientes SSR do Supabase (`client.ts`, `server.ts`, `middleware.ts`).
- Criação dos componentes atômicos Swiss Ledger: `<CodeBadge />` com cópia instantânea, `<HairlineCard />`, `<StatusBadge />`, `<MoneyCell />` com fontes monoespaçadas e formatação tabular (`tabular-nums font-mono`).
- Validação limpa de tipos com `tsc --noEmit`.

### [2026-10-20] — Módulo 1: Autenticação, Perfis (RBAC) & Shell da Aplicação (Concluído)
- Criação da Server Action `loginAction` e `signOutAction` em `src/actions/auth.actions.ts` validada com Zod.
- Tela de login institucional com estética oficial SEMPI-RJ em `src/app/(auth)/login/page.tsx`.
- Helper `getUserProfile()` em `src/lib/auth/get-user-profile.ts` para leitura de perfis de usuário (`perfis_usuarios`).
- App Shell Governamental em `src/app/(dashboard)/layout.tsx` com cabeçalho institucional, identificação do servidor, setor, ID Funcional e perfil de acesso RBAC.
- Matriz de Gestão e Painel de Alertas Imediatos em `src/app/(dashboard)/page.tsx` calculando contratos vigentes, volume financeiro global, alertas de contratos com vigência ≤ 60 dias e detecção automática de "Contratos Acéfalos" (vigentes sem Gestor ou Fiscal Técnico ativo).
- Validação limpa com `tsc --noEmit`.

### [2026-10-20] — Módulo 2: Dossiê de Contratos & Instrumentos Substitutivos (Art. 95) (Concluído)
- Criação dos schemas de validação Zod em `src/lib/validators/contrato.schema.ts` com validação de regras do Art. 95 da Lei 14.133 (`numero_contrato` obrigatório para formal, opcional para empenho).
- Implementação das Server Actions `createContratoAction` e `updateContratoStatusAction` em `src/actions/contratos.actions.ts` com RBAC de defesa em profundidade, tratamento de exceções de banco e sem uso de `any`.
- Componente de Slide-over Drawer `NovoContratoDrawer` com alternância contextual de tipo de instrumento e avisos das vedações da Lei 14.133.
- Tela de listagem `/contratos` com DataGrid denso, filtros por tipo e status, busca em tempo real por Processo SEI, Chave SIGA, Razão Social e CNPJ.
- Tela de Dossiê 360º `/contratos/[id]` com cabeçalho executivo, resumo financeiro, percentual de aditamento acumulado com alerta legal de 25%/50%, aviso de contrato acéfalo, árvore de alterações, empenhos e fiscais.
- Criação do componente visual `ReguaTemporalVigencia` plotando os blocos de vigência e as notas de empenho vinculadas (e alertas para empenhos fora da vigência).
- Compilação 100% validada via `tsc --noEmit`.

### [2026-10-22] — Módulo 3: Alterações Contratuais (Aditivos e Apostilamentos) (Concluído)
- Schemas Zod em `src/lib/validators/alteracao.schema.ts` com regras estritas de vigência para aditivos de prazo/mistos e validação financeira.
- Server Actions em `src/actions/alteracoes.actions.ts` (`createAlteracaoAction`, `deleteAlteracaoAction`) com RBAC de defesa em profundidade e trava jurídica preventiva do Art. 95 da Lei 14.133.
- Componente Slide-Over Drawer `NovoAditivoDrawer` com preview em tempo real de recálculo de valor, alerta de teto legal de 25%/50% e bloqueio contextual de aditivos em instrumentos de força de contrato (Art. 95).
- Integração do drawer diretamente na tela de Dossiê 360º (`/contratos/[id]`).
- **Simulação Completa de Inserção de Dados (`scripts/simular_insercao_modulo3.mjs`):**
  1. Criação de Nota de Empenho Substitutiva (Art. 95) sem número formal -> Sucesso.
  2. Tentativa de Aditivo de Prazo no Art. 95 -> Bloqueado com sucesso pela trigger `trg_check_aditivo_instrumento` do PostgreSQL.
  3. Lançamento de Apostilamento de reajuste no Art. 95 (+R$ 2.500,00) -> Sucesso e recalculado para R$ 47.500,00.
  4. Criação de Contrato Formal nº 166/2026 de R$ 100.000,00 até 31/12/2026 -> Sucesso.
  5. Registro de 1º Termo Aditivo de Valor (+R$ 20.000,00) -> Valor atualizado pelo banco para R$ 120.000,00.
  6. Registro de 2º Termo Aditivo de Prazo (até 31/12/2027) -> Vigência fim estendida automaticamente pelo banco para 31/12/2027.
- Compilação 100% validada com `tsc --noEmit`.

### [2026-10-22] — Módulo 4: Comissão de Fiscalização, Portarias DOERJ & Swap Atômico (Concluído)
- Schemas Zod em `src/lib/validators/fiscal.schema.ts` para designação direta e swap atômico de membros de comissão.
- Server Actions em `src/actions/fiscais.actions.ts` (`designarFiscalAction`, `swapFiscalAction`, `desativarFiscalAction`) com auto-link de `usuario_id` caso o servidor possua conta cadastrada.
- Componente Slide-Over Drawer `NovoFiscalDrawer` com alternância dinâmica entre "Nova Designação" e "Substituição Formal (Swap)".
- Tela do Quadro Geral de Fiscais em `/fiscais` com cards de totais de gestores, fiscais técnicos e administrativos, ranking de carga de contratos por servidor (Top 5) e busca textual.
- Integração do `NovoFiscalDrawer` diretamente na aba de comissão do Dossiê do Contrato (`/contratos/[id]`).
- **Simulação Completa de Inserção de Dados (`scripts/simular_insercao_modulo4.mjs`):**
  1. Criação de Contrato Formal com comissão vazia.
  2. Designação formal de Gestor e Fiscal Técnica titular com Portaria SEMPI nº 010/2026 -> Sucesso.
  3. Execução do Swap Atômico: Substituição de Mariana Souza por Roberto Fonseca (Portaria nº 088/2026) -> Mariana desativada com data_fim = 2026-07-01 e Roberto ativado com data_inicio = 2026-07-01.
  4. Desativação do Gestor sem substituto imediato -> O contrato foi detectado e sinalizado imediatamente como **Contrato Acéfalo** pela query de auditoria.
- Compilação 100% validada com `tsc --noEmit`.

### [2026-10-22] — Módulo 5: Execução Financeira & SIAFE-Rio (Concluído)
- Schemas Zod em `src/lib/validators/financeiro.schema.ts` para Nota de Empenho (NE), Eventos no SIAFE-Rio (Reforço/Anulação) e Liquidação (NF atestada + NL).
- Server Actions em `src/actions/financeiro.actions.ts` (`createEmpenhoAction`, `createEventoEmpenhoAction`, `createLiquidacaoAction`) com validações de RBAC, consistência de identificadores SIAFE e revalidação de caminhos.
- Componentes interativos de interface Swiss Ledger:
  - `NovoEmpenhoDrawer`: emissão de empenhos vinculados ao contrato/aditivo e modalidade orçamentária.
  - `NovoEventoEmpenhoDrawer`: lançamento de reforço ou anulação parcial/total com simulador em tempo real de saldo líquido e aviso visual de estouro de anulação.
  - `NovaLiquidacaoDrawer`: registro de ateste fiscal da nota com competência e Nota de Liquidação (NL) do SIAFE.
  - `TabelaEmpenhosTree`: componente de Master-Detail em árvore que exibe os empenhos originais com linhas expansíveis revelando a sub-tabela de eventos SIAFE e a sub-tabela de liquidações, com rodapé de totais consolidados e controle de expansão global.
- **Simulação Completa de Inserção de Dados (`scripts/simular_insercao_modulo5.mjs`):**
  1. Criação de Contrato com vigência em 2026 e 1º Aditivo com vigência em 2027.
  2. Teste da trigger `trg_classifica_empenho`:
     - NE com data em 2026 -> classificada automaticamente como `CONTRATO_INICIAL`.
     - NE com data em 2027 -> vinculada automaticamente ao `1º Termo Aditivo`.
     - NE com data em 2029 -> classificada com alerta crítico `ALERTA_FORA_DE_VIGENCIA`.
  3. Lançamento de Evento de REFORÇO de R$ 30.000,00 -> saldo líquido recalculado pela trigger para R$ 130.000,00.
  4. Tentativa de Anulação Ilegal de R$ 150.000,00 (superior ao saldo) -> bloqueada com sucesso pela constraint contábil `chk_anulacao_limite`.
  5. Anulação Válida de R$ 10.000,00 -> saldo líquido recalculado para R$ 120.000,00.
  6. Registro de Liquidação de Nota Fiscal (NF-89700, competência 06/2026, 2026NL89700) de R$ 50.000,00 e data de OB.
  7. Consulta da Árvore Genealógica (Master-Detail): conferência dos nós filhos (2 eventos + 1 liquidação).
- Compilação 100% validada com `tsc --noEmit`.

### [2026-10-22] — Módulo 6: Atas de Registro de Preços & Abate de Cotas (Concluído)
- Schemas Zod em `src/lib/validators/ata.schema.ts` para Atas de Registro de Preços (ARP), Itens do Catálogo SIGA-RJ e Abate de Cota por Empenho (`atas_consumo_empenhos`).
- Server Actions em `src/actions/atas.actions.ts` (`createAtaAction`, `createAtaItemAction`, `registrarConsumoAtaAction`) com verificação estrita de RBAC e tratamento das constraints contábeis.
- Componentes e Telas no Design System Swiss Ledger:
  - `NovaAtaDrawer`: cadastro de ARP com alternância entre Órgão Gerenciador (`GERENCIADOR`) e Participante/Carona (`PARTICIPANTE`).
  - `NovoItemAtaDrawer`: cadastro de itens no Catálogo SIGA-RJ com controle de CNPJ fornecedor, unidade de medida, preço unitário, total registrado e cota reservada da SEMPI.
  - `RegistrarConsumoDrawer`: interface de abate de cota por Nota de Empenho (NE) com simulação visual em tempo real e bloqueio preventivo de estouro de cota.
  - `/atas`: tela principal com Split-View entre Atas Gerenciadas SEMPI e Atas Participantes/Caronas Externas, métricas agregadas e DataGrid denso.
  - `/atas/[id]`: Dossiê 360º da Ata com barra visual de consumo da cota SEMPI, catálogo de itens SIGA com saldo disponível (`saldo_disponivel` gerado), histórico de baixas e lista de contratos decorrentes.
- **Simulação Completa de Inserção de Dados (`scripts/simular_insercao_modulo6.mjs`):**
  1. Criação de ARP nº ARP-90577/2026 gerenciada pela SEMPI.
  2. Cadastro de Item nº 1 (Estação de trabalho SIGA-TI-90577) com 500 UN registradas e cota SEMPI de 100 UN a R$ 5.000,00 cada. Saldo inicial calculado automaticamente pela coluna gerada: 100 UN.
  3. Formalização de Contrato decorrente da Ata e emissão de Notas de Empenho vinculadas (NE A e NE B).
  4. Registro do 1º Abate válido de 80 unidades via NE A: trigger `trg_sync_consumo_ata` atualizou `qtd_empenhada_secretaria = 80 UN` e `saldo_disponivel = 20 UN`.
  5. Teste de Estouro de Cota: tentativa de registrar consumo de 21 unidades quando o saldo remanescente era de apenas 20 unidades. A constraint `chk_empenho_nao_excede_cota` do PostgreSQL barrou e abortou a operação com sucesso.
  6. Registro do 2º Abate válido de 15 unidades via NE B: `qtd_empenhada_secretaria` recalculada para 95 UN e saldo disponível remanescente para 5 UN.
  7. Verificação de integridade relacional entre Ata, Itens, Consumos e Contratos decorrentes.
- Compilação 100% validada com `tsc --noEmit`.

### [2026-10-22] — Módulo 7: Dashboard Executivo, Matriz de Conformidade & Trilha de Auditoria Forense (Concluído)
- Tela de Trilha de Auditoria Forense em `/auditoria` com controle estrito de RBAC (`ADMIN` e `CONSULTA_TCE`), bloqueando usuários sem credencial de controle interno.
- Filtros dinâmicos por tabela afetada, tipo de operação (`INSERT`, `UPDATE`, `DELETE`) e busca por identificadores e termos alterados.
- Componente `AuditDiffModal`:
  - Inspeção visual de `campos_alterados`.
  - Comparativo JSONB lado a lado destacando em vermelho o estado anterior (`dados_antigos`) e em verde o novo estado (`dados_novos`).
  - Formatação com recuo e realce para inserções e exclusões.
- **Simulação Completa de Inserção de Dados (`scripts/simular_insercao_modulo7.mjs`):**
  1. Criação de Contrato Formal disparando o gatilho automático de auditoria para `INSERT`.
  2. Modificação de status do contrato (`VIGENTE` ➔ `SUSPENSO`) disparando o gatilho automático para `UPDATE`.
  3. Verificação do motor de Diff JSONB: `campos_alterados` detectou `["status", "observacoes"]` com os valores antigos e novos perfeitamente registrados.
  4. Teste de Blindagem e Imutabilidade (Defesa em Profundidade / SEC-OPS):
     - Tentativa de adulterar o log de auditoria via `UPDATE` direto ➔ bloqueado pelo RLS do PostgreSQL (0 registros afetados).
     - Tentativa de apagar o rastro de auditoria via `DELETE` direto ➔ bloqueado pelo RLS do PostgreSQL (0 registros afetados).
- Compilação 100% validada com `tsc --noEmit`.

### [2026-10-23] — Módulo de Edição Universal, Gestão de Ciclo de Vida de Status e Apostilamento Cadastral (Concluído)
- **1. Opções de Edição (Full Editing Capabilities) em Todos os Módulos:**
  - `EditarContratoDrawer`: Edição de metadados, objeto, datas de vigência, valor e situação do contrato.
  - `EditarAditivoDrawer`: Edição de termos aditivos existentes e controle de apostilamentos com recálculo e validação contra teto de aditamento.
  - `EditarFiscalDrawer`: Retificação de portarias DOERJ, alteração de função na comissão e vigência de atuação (disponível tanto no Dossiê quanto na tela `/fiscais`).
  - `EditarEmpenhoDrawer`: Edição de notas de empenho ordinárias, estimativas ou globais, dotações orçamentárias (PT, ND, Fonte) e chave SIGA.
  - `EditarEventoEmpenhoDrawer`: Edição de eventos contábeis de reforço e anulação no SIAFE-Rio.
  - `EditarLiquidacaoDrawer`: Edição de notas fiscais, competências, notas de liquidação (NL) e registro de quitação com data de Ordem Bancária (OB).
  - `EditarAtaDrawer`: Edição de atas de registro de preços (ARP), prazos de vigência, papel (gerenciador vs. participante) e publicação no PNCP.
  - `EditarItemAtaDrawer`: Edição de especificações de itens no catálogo SIGA, preços unitários e cotas reservadas com proteção contra redução abaixo do empenhado.
  - *Módulo de Auditoria mantido estritamente imutável (sem edição), registrando cada alteração realizada em `audit_logs`.*

- **2. Novo Ciclo de Vida de Status com Suporte a "Em Elaboração":**
  - Implementação dos estados: `VIGENTE` (Vigente), `SUSPENSO` (Suspenso), `RESCINDIDO` (Cancelado / Rescindido) e `EM_FORMALIZACAO` (Em Elaboração).
  - Regra de Flexibilização Condicional: quando selecionado `EM_FORMALIZACAO` (em contratos, termos aditivos, atas e alterações de atas), apenas os dados básicos iniciais são obrigatórios (processo SEI, objeto, fornecedor básico e modalidade). Datas formais de publicação (PNCP/DOERJ), vigência final e números definitivos são postergados para a fase de formalização.
  - Geração segura de identificadores provisórios (`SIGA-DRAFT-*`, `EM_ELABORACAO`) para satisfazer as constraints de unicidade e nulidade do banco sem violar as regras de negócio.

- **3. Apostilamento para Alteração de Dados Contratuais (Art. 136, III da Lei 14.133/2021):**
  - Adicionado novo tipo de finalidade de apostilamento (`ALTERACAO_DADOS_CONTRATUAIS`) em `alteracoes_contratuais`.
  - Permite a formalização de alterações cadastrais da contratada (nova razão social, alteração de CNPJ por sucessão/incorporação ou endereço) sem variação de valor ou prazo.
  - Server Action atualiza automaticamente os dados cadastrais da contratada no contrato e reflete no Dossiê, registrando a operação e o diff na auditoria.

- **4. Simulação Completa de Inserção e Edição de Dados (`scripts/simular_insercao_edicao.mjs`):**
  1. Criação de Contrato com status `EM_FORMALIZACAO` utilizando apenas campos mínimos.
  2. Edição do Contrato: promoção para `VIGENTE`, atribuição de número de contrato formal definitivo (`CONTRATO-8378/2026`) e atualização do objeto.
  3. Criação de Apostilamento com alteração cadastral: substituição da razão social para `"Nova Tecnologia Integrada S.A. (Sucessora)"` e atualização de CNPJ.
  4. Designação e Edição de Fiscal: retificação formal do número da Portaria publicada no DOERJ.
  5. Execução Financeira:
     - Emissão e edição de Nota de Empenho (NE) com ajuste de Programa de Trabalho.
     - Lançamento de Reforço contábil.
     - Lançamento e edição de Liquidação (NL), registrando a data de pagamento da Ordem Bancária (OB).
  6. Atas de Registro de Preços:
     - Criação de ARP "Em Elaboração" e posterior edição promovendo para "VIGENTE" com código SIGA.
     - Cadastro de Item no catálogo SIGA e edição posterior ampliando a cota reservada da SEMPI.
  7. Auditoria Automática:
     - Consulta a `public.audit_logs` comprovando que todas as edições foram interceptadas pelos gatilhos PostgreSQL, gerando o array de `campos_alterados` e o snapshot de `dados_antigos` vs `dados_novos`.
- Compilação 100% validada com `tsc --noEmit`.

### [2026-10-23] — Auditoria Exaustiva de QA (TCE-RJ / CGE-RJ) — Bateria de Estresse de 27 Casos de Borda (Concluído)
- **Execução do Script de Auditoria:** `scripts/qa_bateria_completa_tce.mjs`
- **Resultados Consolidados:** 27 testes executados, 27 testes aprovados (0 reprovados).
- **Cobertura de Auditoria de Domínio:**
  1. *Art. 95 (Empenho com Força de Contrato):* Tentativa de criar `CONTRATO_FORMAL` vigente sem número foi rejeitada pela constraint `chk_numero_contrato_obrigatorio`. Criação de `NOTA_EMPENHO_FORCA_CONTRATO` sem número aceita. Tentativa de aditamento de valor em Nota de Empenho barrada pela trigger `trg_check_aditivo_instrumento`. Apostilamento aceito com sucesso.
  2. *Régua Temporal e SIGA:* Vínculo automático de empenhos ao `CONTRATO_INICIAL`, ao `1º Termo Aditivo de Prazo` e sinalização de anomalia `ALERTA_FORA_DE_VIGENCIA` para empenho emitido com data externa.
  3. *Árvore Genealógica Financeira:* Acréscimo atômico de reforço (+R$ 30.000,00), recálculo de saldo líquido (R$ 130.000,00), bloqueio de anulação excedente de R$ 150.000,00 pela constraint `chk_anulacao_limite`, anulação válida (-R$ 20.000,00 ➔ R$ 110.000,00) e liquidação com ateste.
  4. *Estouro de Cota de ARP:* Abate inicial de 80 UN em item com cota de 100 UN. Tentativa de abate de 25 UN quando o saldo era de apenas 20 UN abortada com sucesso pela constraint `chk_empenho_nao_excede_cota`.
  5. *Governança e Contrato Acéfalo:* Detecção de contrato vigente sem comissão como acéfalo, designação de comissão, execução de Swap Atômico (titular anterior desativado e novo ativado).
  6. *Rescisão e Imutabilidade:* Cancelamento/rescisão de contrato formal com registro no histórico e teste de segurança comprovando que as regras de RLS impedem `UPDATE` e `DELETE` em `public.audit_logs`.

### [2026-10-23] — Revisão Completa de UI/UX e Responsividade Mobile/Tablet — Agente 02 (`@frontend-designer`) (Concluído)
- **Superação da Estética Rústica ("Anos 80") & Elevação a Padrão Moderno Enterprise Governamental:**
  - Modernização do Tailwind (`tailwind.config.ts` e `globals.css`): transição do fundo ocre cru para Slate-50 contemporâneo (`#F8FAFC`), superfícies em branco puro, bordas suaves em Slate-200 (`#E2E8F0`), cantos refinados (`rounded-xl` e `rounded-lg`) e sistema de sombras sutis com elevação moderna (`shadow-xs`, `shadow-sm`, `shadow-drawer`).
  - Preservação estrita da identidade SEMPI-RJ: Ameixa Profundo (`#581526`) e Verde-Petróleo técnico (`#0D3B3E`), com números financeiros e processos SEI/SIGA em fonte monoespaçada com alinhamento tabular (`font-mono tabular-nums`).
- **Resolução de Rompimento de Tela (Layout Breakages & Overflow Protection):**
  - Implementação da classe utilitária `.table-responsive-container` com barra de rolagem estilizada (`overflow-x-auto`, `min-w-[850px]` a `min-w-[1050px]`) em todas as tabelas densas do sistema (Contratos, Dossiê com Aditivos e Fiscais, Árvore de Empenhos Master-Detail, Catálogo de Itens da Ata, Quadro Geral de Fiscais e Trilha de Auditoria).
  - Prevenção de quebra de layout quando colunas continham dados longos ou eram renderizadas em viewports estreitos.
- **Responsividade Integral para Dispositivos Móveis e Tablets (Mobile-First Shell):**
  - Criação do componente `AppNavigation.tsx` com barra superior institucional, botão hambúrguer animado para telas `< md` (tablets e smartphones), backdrop blur e menu off-canvas deslizante.
  - Ajuste de todos os painéis e grades para layouts fluidos: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` em métricas rápidas e blocos de detalhe.
  - Adaptação das gavetas laterais (*Slide-Over Drawers*) e modais de auditoria (`AuditDiffModal`) para `w-full max-w-full sm:max-w-xl md:max-w-2xl`, garantindo formulários utilizáveis por toque em telas pequenas sem corte horizontal.
- **Validação de Código e Compilação:** `tsc --noEmit` executado com **0 erros**.

### [2026-10-25] — Implementação de 3 Novas Colunas de Informação em Contratos (Concluído)
- **Atributos Implementados na Tabela `contratos`:**
  1. `tipo_contrato`: `CONTINUO` (Contínuo) ou `ESCOPO` (Escopo).
  2. `tipo_licitacao`: `PREGAO_ELETRONICO` (Pregão Eletrônico), `DISPENSA_LICITACAO` (Dispensa de Licitação), `INEXIGIBILIDADE` (Inexigibilidade) ou `CONCORRENCIA` (Concorrência).
  3. `emergencial`: `BOOLEAN NOT NULL DEFAULT false` (Não [Default] / Sim [Art. 75, VIII]).
- **Artefatos Desenvolvidos e Atualizados:**
  - **DDL & Migration:** Criado `supabase/migrations/0003_add_contrato_tipo_licitacao_emergencial.sql` com types enum e colunas com constraints e comentários explicativos.
  - **Tipagem Estrita TypeScript:** Atualizado `src/lib/types/database.types.ts` com os novos tipos `TipoContrato`, `TipoLicitacao` e inclusão nas interfaces `Row`, `Insert` e `Update` de `contratos`.
  - **Validação Zod:** Atualizado `src/lib/validators/contrato.schema.ts` com validações, defaults e pré-processamento booleano.
  - **Server Actions:** Atualizadas as ações `createContratoAction` e `updateContratoAction` em `src/actions/contratos.actions.ts` com captura do formulário, validação estrita e suporte a fallback gracioso caso as colunas estejam pendentes de execução manual no editor SQL.
  - **Interface & UX (Swiss Ledger):**
    - `NovoContratoDrawer.tsx`: Seção visual dedicada para seleção de Tipo de Contrato, Licitação e Emergencial (com banner informativo para contratações sob o Art. 75, VIII).
    - `EditarContratoDrawer.tsx`: Edição completa dos 3 atributos com valores pré-carregados.
    - `contratos/page.tsx`: Inclusão das 3 colunas no DataGrid protegido contra quebra de layout (`min-w-[1100px]`), badges visuais (Contínuo/Escopo, Modalidade e Destaque Carmim para Emergencial) e novos filtros na barra de busca.
    - `contratos/[id]/page.tsx` (Dossiê): Badges de cabeçalho, banner de destaque institucional caso a contratação seja emergencial e grade informativa de 6 colunas.
  - **Simulação de Inserção & Validação:** Criado e executado o script `scripts/simular_insercao_novas_colunas.mjs`, comprovando o ciclo completo de inserção e edição.
- **Validação de Código e Compilação:** `tsc --noEmit` executado com **0 erros**.

### [2026-10-25] — Implementação do Dashboard Analítico Interativo Estilo Power BI — Agente 05 (`@bi-analytics-lead`) (Concluído)
- **Criação do Perfil Agente 05 (`@bi-analytics-lead`) no `agents.md`:**
  - Especialista em BI Interativo, Visual Analytics, motor de Cross-Filtering bidirecional em tempo real (0ms), segmentadores (*Slicers*), *Drill-Down* hierárquico em 4 níveis e análise cruzada entre Vigência Contratual (e seus Aditivos) e a Tríade de Execução Financeira (Global vs. Empenhado Líquido vs. Liquidado Real).
- **Consumo e Integração da View `public.vw_dashboard_execucao_contratos`:**
  - View criada no Supabase contendo 14 colunas essenciais pré-agregadas: `valor_inicial`, `valor_global_atual`, `valor_empenhado_liquido`, `valor_liquidado`, `saldo_a_empenhar`, `saldo_empenhado_a_liquidar`, `dias_restantes_vigencia`, `faixa_vencimento`, `qtd_aditivos`, `qtd_apostilamentos`, `percentual_acrescimo_acumulado` e `comissao_fiscalizacao_completa`.
- **Arquitetura do Motor Interativo de Cross-Filtering (`CrossFilterContext.tsx`):**
  - Estado bidirecional síncrono mantido via React Context + `useMemo` com recálculo instantâneo em `0ms` (sem *page reload*).
  - Todo elemento visual atua simultaneamente como **Output Visual** e **Input de Filtro**.
  - Comportamento clássico do Power BI de **Highlight vs. Filter**: universo total esmaecido ao fundo (`opacity-25` ou `bg-slate-200`) e seleção filtrada em destaque sólido (`opacity-100`).
  - Suporte a múltiplos filtros combinados: Busca textual omnibox, Tipo de Instrumento, Status, Tipo de Contrato (Contínuo/Escopo), Fiscal/Gestor, Safra de Vencimento, Estágio de Aditivos, Quadrante de Risco Operacional e Etapa da Cascata Orçamentária.
  - Atalho global de teclado: Tecla `Escape (Esc)` limpa instantaneamente todos os filtros ativos.
- **Componentes Analíticos Construídos (Design System Swiss Ledger):**
  1. **`SlicerBar.tsx` (Barra de Segmentação de Dados):**
     - Omnibox de busca com limpeza rápida.
     - Slicers dropdown para Instrumento, Status, Tipo e Fiscal/Gestor.
     - Fileira de *chips* de filtros ativos com botão de exclusão individual (`×`) e botão `"Limpar Filtros (Esc)"` com contador dinâmico.
  2. **`KpiTriadCards.tsx` (Tríade de Execução com Sub-Métricas):**
     - **Card 1: Valor Global Atualizado:** Decomposição entre Valor Inicial Original e Aditivos/Apostilamentos, com % de representatividade da seleção sobre o universo total.
     - **Card 2: Valor Empenhado Líquido:** Barra de progresso sobre o Global, Saldo Contratual a Empenhar e detalhamento de reforços/anulações.
     - **Card 3: Valor Liquidado Real:** Barra de progresso sobre o Empenhado, Saldo Empenhado a Liquidar (Passivo / Restos a Pagar).
     - **Card 4: Radar de Vigência & Conformidade:** Contratos ativos, e badges clicáveis de alerta imediato: contratos vencendo em ≤ 60 dias e contratos acéfalos (sem comissão fiscal completa com portaria no DOERJ).
  3. **`SafraVencimentosChart.tsx` (Safra de Vencimentos & Estágio de Aditivos):**
     - Barras horizontais empilhadas bi-nível por janela de encerramento (`< 30 dias` [Crítico], `31-60 dias` [Atenção], `61-120 dias` [Planejamento], `> 120 dias` [Regular]).
     - Subdivisão cromática por maturidade/estágio (`Contrato Inicial`, `1º Aditivo`, `2º Aditivo`, `3º+ Aditivo`).
     - Filtro cruzado ao clicar em qualquer barra ou legenda.
  4. **`WaterfallAlteracoesChart.tsx` (Cascata Orçamentária de Alterações Contratuais):**
     - Gráfico de colunas flutuantes demonstrando visualmente a variação orçamentária:
       `Valor Original` ➔ `(+) Aditivos de Valor/Misto` ➔ `(+) Apostilamentos/Reajustes` ➔ `(-) Supressões` ➔ `(=) Valor Global Atualizado`.
     - Clicar nas etapas filtra a matriz para isolar contratos afetados por aquele tipo de alteração.
  5. **`MatrizRiscoQuadrantes.tsx` (Matriz de Risco Cruzado de Vigência vs Execução):**
     - 4 quadrantes operacionais interativos:
       1. *Execução Regular*: Ritmo equilibrado de consumo financeiro vs tempo decorrido.
       2. *Risco de Desabastecimento*: Consumo acelerado (> 80% liquidado/empenhado) com menos de 50% da vigência transcorrida.
       3. *Baixa Execução / Empate*: Vigência > 75% decorrida com menos de 30% liquidado.
       4. *Crítico Vencendo*: Menos de 30 dias para o término com contrato ativo.
  6. **`MatrizHierarquicaContratos.tsx` (Drill-Down em 4 Níveis + Triple Bullet Chart + Rodapé Dinâmico):**
     - Tabela hierárquica estilo Matriz do Power BI expansível com botões `+`/`-`:
       - **Nível 1 (Contrato):** Dados consolidados, **Triple Bullet Chart** (Base Cinza = Global | Barra Petróleo = Empenhado | Barra Ameixa = Liquidado), saldos a empenhar e liquidar, vigência com termômetro semântico de dias restantes.
       - **Nível 2 (Períodos):** Linhas recuadas com Contrato Inicial e Termos Aditivos/Apostilamentos (com vigência, valor aditado e chave SIGA).
       - **Nível 3 (Notas de Empenho):** NEs emitidas, datas, valores iniciais, saldos líquidos e eventos de reforço/anulação vinculados ao período correspondente.
       - **Nível 4 (Notas Fiscais / Liquidações):** NFs, competências, números de NL, atestos fiscais e datas de pagamento via Ordem Bancária (OB).
     - **Linha de Totais Dinâmicos Fixada no Rodapé (`tfoot`):** Soma em tempo real apenas os registros filtrados pelo motor analítico.
  7. **`ReportPageTooltip.tsx` (Tooltips Ricos de Contexto / Dossiê Flutuante):**
     - Card flutuante exibido ao passar o mouse sobre contratos na matriz com: Processo SEI, Chave SIGA, Gestor e Fiscal Técnico designados (com número da Portaria DOERJ), percentual utilizado do teto legal de 25% (Art. 125 da Lei 14.133/21) e data da última Nota Fiscal liquidada.
- **Server Action & Tipagem:**
  - `src/actions/bi-analytics.actions.ts`: Ação `getDashboardBIData()` que carrega em paralelo a View e todas as entidades filhas, calculando a árvore hierárquica e os agrupamentos de 0ms.
  - `src/lib/types/bi-analytics.types.ts`: Tipagem estrita completa para a View, os 4 níveis de hierarquia, filtros e métricas.
- **Auditoria Técnica Automatizada:**
  - Script `scripts/test_bi_analytics_mission.mjs` validou 100% da integridade da View, das 14 colunas essenciais, da tríade orçamentária e da navegação em 4 níveis com 18 contratos cadastrados no banco.
- **Validação de Código:** `tsc --noEmit` executado com **0 erros**.

### [2026-10-25] — Melhorias no Dashboard Analítico & Novas Funcionalidades do Sistema (Concluído)

#### 1. Melhorias no Dashboard Analítico (Power BI Style):
- **Filtros Multi-Seleção (Multi-Select Cross-Filtering):**
  - Atualizado o estado do motor analítico (`CrossFilterState` em `bi-analytics.types.ts`) de valores escalares simples para arrays tipados (`status: StatusInstrumento[]`, `tipoInstrumento: TipoInstrumento[]`, `tipoContrato: TipoContrato[]`, `safraBucket: SafraBucket[]`, etc.).
  - Reescreveu-se o `CrossFilterContext.tsx` para realizar filtragem por intersecção de arrays em tempo real (`0ms` de latência).
  - Implementado dropdown com popover acessível e checkboxes para seleção múltipla em `SlicerBar.tsx`, com contadores visuais (ex: `Status [2]`) e chips individuais com descarte rápido (`×`).
  - Atualizados os gráficos de Safra, Waterfall e Quadrantes de Risco para suporte nativo à seleção múltipla.
- **Ajustes na Matriz Hierárquica de Execução (`MatrizHierarquicaContratos.tsx`):**
  - **Coluna Instrumento / Contratada:** Removido o badge redundante de tipo formal e exibido com destaque o **Número do Contrato** (ou Art. 95) acompanhado do botão de informações flutuantes e da **Razão Social da Contratada**.
  - **Correção de Posicionamento do Quadro Resumo (Tooltip):** O tooltip rico de contexto (`ReportPageTooltip`) foi desacoplado de eventos gerais da linha da tabela e atrelado com coordenadas restritas ao ícone de informação (`Info`) e à primeira célula do contrato, impedindo que flutuasse sobre a coluna de ações da extrema direita (que redireciona para o Dossiê do Contrato).
  - **Regra de Coloração e Contraste dos Subtotais e Rodapé (`tfoot`):**
    - Corrigido o componente `MoneyCell.tsx` para garantir que cores customizadas (`text-white`, `text-teal-300`, `text-rose-300`, `text-emerald-300`) sobreponham as classes padrão.
    - Aplicado esquema de alto contraste em linhas de subtotal e no rodapé geral, tornando 100% visíveis os valores de Valor Global, Empenhado Líquido, Liquidado, Saldo a Empenhar e Passivo a Liquidar.

#### 2. Novas Funcionalidades e Melhorias Globais do Sistema:
- **Tabelação / Paginação com Seletor de Registros (Padrão 10):**
  - Criado o componente reutilizável `src/components/ui-ledger/Pagination.tsx` com seletor de registros por página (`10 [default]`, `25`, `50`, `100`), contador de registros visíveis (ex: `1-10 de 48`) e navegação completa por botões.
  - Aplicada a paginação com seletor em todas as tabelas do sistema:
    - `/contratos` (`ContratosTableClient.tsx`)
    - `/atas` (`AtasTableClient.tsx`)
    - `/fiscais` (`FiscaisTableClient.tsx`)
    - `/auditoria` (`AuditoriaTableClient.tsx`)
    - `/usuarios` (`UsuariosTableClient.tsx`)
- **Exportação de Dados em CSV (1-Click Download):**
  - Criado o utilitário `src/lib/utils/exportData.ts` e o componente `src/components/ui-ledger/ExportButton.tsx`.
  - Exportação gerada em formato CSV delimitado por ponto e vírgula com cabeçalho **UTF-8 BOM (`\uFEFF`)**, assegurando compatibilidade perfeita com o Microsoft Excel e acentuação da língua portuguesa em todas as abas.
- **Módulo de Gestão de Usuários (CRUD de Usuários — `/usuarios`):**
  - Página dedicada `/usuarios` com acesso restrito a administradores.
  - Server Actions em `src/actions/usuarios.actions.ts`: `getUsuariosAction`, `createUsuarioAction`, `updateUsuarioAction` e `toggleUsuarioStatusAction`.
  - Gavetas laterais Swiss Ledger: `NovoUsuarioDrawer.tsx` (criação de credenciais e perfil) e `EditarUsuarioDrawer.tsx` (alteração de dados cadastrais e ativação/desativação).
  - Tabela com filtros de pesquisa, role, status, paginação (10 por página) e exportação de dados.
- **Módulo de Alteração de Senha & Perfil do Usuário (`/perfil`):**
  - Página `/perfil` acessível a qualquer servidor autenticado através do menu de navegação e do avatar no cabeçalho.
  - Server Action `changePasswordAction` para atualização segura de credenciais.
  - Formulário com validações de confirmação de senha e feedback em tempo real.
- **Seletor de Temas Visuais Institucionais (6 Opções de Cores com Persistência):**
  - Criado o `src/components/theme/ThemeProvider.tsx` gerenciando 6 paletas cromáticas com persistência no `localStorage` do navegador e injeção dinâmica de variáveis CSS:
    1. **Padrão SEMPI:** Ameixa Profundo (`#581526`) + Verde-Petróleo (`#0D3B3E`)
    2. **Safira Executivo:** Azul Safira (`#1E3A8A`) + Petróleo Frio (`#0F766E`)
    3. **Esmeralda Sustentável:** Verde Esmeralda (`#064E3B`) + Âmbar Dourado (`#78350F`)
    4. **Grafite Minimalista:** Grafite Profundo (`#1E293B`) + Ardósia Azulada (`#334155`)
    5. **Cobre & Mogno:** Cobre Oxidado (`#7C2D12`) + Argila Queimada (`#431407`)
    6. **Merlot & Cobalto:** Vinho Merlot (`#4C0519`) + Cobalto Nobre (`#1E1B4B`)
  - Configurado o Tailwind CSS para mapear as cores da SEMPI diretamente para as variáveis CSS dinâmicas.
  - Componente interativo de seleção de tema com pré-visualização cromática integrado na página `/perfil`.
- **Perfil de Usuário Somente Leitura (`CONSULTA_TCE`):**
  - Criada a migração `0003_create_consulta_tce_user.sql` e provisionado o usuário `consulta.tce@sempi.com` / `Consulta@Sempi2026!`.
  - **Defesa em Profundidade:**
    - **Frontend:** Ocultação/desabilitação de todos os botões e gavetas de criação, edição e exclusão (Contratos, Atas, Aditivos, Empenhos, Fiscais, etc.) quando o usuário logado possui a role `CONSULTA_TCE`.
    - **Backend (Server Actions):** Todas as Server Actions validam a sessão e barram chamadas mutativas de perfis de consulta, retornando erro amigável de acesso negado.
    - **Visibilidade Integral:** O usuário possui acesso total de leitura a todas as páginas, dashboards analíticos, dossiês e à trilha de auditoria forense.
- **Auditoria Automatizada:**
  - Script `scripts/test_novas_melhorias.mjs` validou a listagem de usuários, controle de permissões e integridade dos endpoints.
- **Validação de Código:** `tsc --noEmit` executado com **0 erros**.

### [2026-10-26] — Aditivos de Contratos Contínuos, Teto Legal (Art. 125) e Dossiê de Fiscais Inativos (Concluído)

#### 1. Redesenho do Drawer e Histórico de Fiscais Inativados / Substituídos:
- **Refatoração com SlideOverDrawer (`EditarFiscalDrawer.tsx`):**
  - Botão de ação inteligente: exibe `"Histórico / Retificar"` para servidores inativos e `"Editar"` para servidores ativos.
  - Alerta informativo em tom técnico âmbar destacando o período de atuação formal (`data_inicio` a `data_fim`), o número da Portaria DOERJ e o motivo de substituição.
  - Funcionalidade de retificação cadastral e suporte nativo a reativação de servidores comissionados (`"Reativar este servidor na comissão ativa"`), limpando atômica e seguramente a data de encerramento via `updateFiscalAction`.
  - Melhoria visual nas tabelas (`page.tsx` e `FiscaisTableClient.tsx`): eliminada a opacidade excessiva (`opacity-60`) que lavava o contraste; adicionado badge sutil `(Histórico)` e fundo discreto `bg-slate-50/50`, mantendo botões de ação e números em alta nitidez.

#### 2. Regra de Renovação de Contrato Contínuo nos Termos Aditivos (Art. 106/107 da Lei 14.133/2021):
- **Replicação de Valor Base:**
  - Para contratos com `tipo_contrato === 'CONTINUO'`, ao lançar `ADITIVO_PRAZO`, o valor base (`valorInicial`) é automaticamente replicado (`valor_diferenca = valorInicial`), elevando o valor global atualizado para `valorAnterior + valorInicial`. (Ex: Contrato 15/2025 Base R$ 250k ➔ 1º TA Prazo = Global R$ 500k).
  - Ao lançar `ADITIVO_MISTO`, o valor base é replicado e somado ao acréscimo aditivado (`valor_diferenca = valorInicial + acrescimoAditivado`). (Ex: Contrato 17/2025 Base R$ 350k ➔ 1º TA Misto com R$ 45k = Global R$ 745k).
- **Adequação do Teto Legal de 25% (Art. 125 da Lei 14.133/2021):**
  - **Correção Crucial do Alerta de Aditivos:** Corrigido o cálculo no cabeçalho do dossiê (`page.tsx`) e nos drawers de aditivos. A mera prorrogação da vigência em serviços contínuos **não consome** o limite legal de 25% de alteração contratual do Art. 125.
  - O percentual legal agora é calculado estritamente sobre os **acréscimos qualitativos/quantitativos** divididos pelo **Valor Base Original**, eliminando o falso positivo que acusava 100% ou mais em contratos prorrogados.
  - Contratos regulares com prorrogação exibem o percentual de acréscimo real em verde-petróleo com a indicação `Prorrogação de ciclo contínuo não consome teto de 25%`.

#### 3. Nova Régua de Evolução Financeira ao Longo dos Termos (`ReguaEvolucaoValor.tsx`):
- Timeline cronológica visual com conectores dinâmicos demonstrando:
  - **Marco Base Inicial:** Valor contratual originário formalizado.
  - **Marcos dos Termos:** Identificação do aditivo/apostilamento, badge semântico, decomposição didática (replicação contínua vs. acréscimo qualitativo) e valor acumulado.
  - **Card Global Vigente:** Total acumulado atualizado, percentual global e consumo da margem legal do Art. 125 da Lei 14.133/21.

#### 4. Auditoria Automatizada:
- Script `scripts/test_aditivo_continuo_e_fiscais.mjs` validou com 100% de sucesso os dois cenários contábeis de prorrogação contínua, o recálculo via trigger de banco e o ciclo de inativação/reativação de fiscais.
- `tsc --noEmit` executado com **0 erros**.




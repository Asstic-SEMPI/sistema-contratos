# Contexto de Domínio e Arquitetura — SGC-SEMPI/RJ

## 1. Visão Geral e Propósito Institucional
O **SGC-SEMPI** é o sistema oficial de Gestão de Contratos Administrativos, Termos Aditivos, Apostilamentos, Execução Financeira e Atas de Registro de Preços da **Secretaria de Estado da Mulher e de Políticas Inclusivas do Estado do Rio de Janeiro (SEMPI-RJ)**.

O sistema foi projetado para operar em total aderência à **Lei Federal nº 14.133/2021** (Nova Lei de Licitações e Contratos) e à rotina administrativa do Poder Executivo do Estado do Rio de Janeiro, espelhando os identificadores e fluxos dos três sistemas estruturantes estaduais:
1.  **SEI-RJ (Sistema Eletrônico de Informações):** Onde tramitam os processos administrativos (`processo_sei`, ex: `SEI-150001/000432/2026`).
2.  **SIGA-RJ (Sistema Integrado de Gestão de Aquisições):** Onde são geradas as Atas de Registro de Preços, os códigos de catálogo de itens (`codigo_item_siga`) e as **Chaves SIGA** (`chave_siga_contrato` e `chave_siga` de execução).
3.  **SIAFE-Rio (Sistema Integrado de Gestão Orçamentária, Financeira e Contábil do Rio de Janeiro):** Onde são emitidas as Notas de Empenho (`2026NE...`), seus Reforços/Anulações e as Notas de Liquidação (`2026NL...`).

---

## 2. Regras de Negócio Críticas e Amarrações do Sistema

### 2.1. Contratos Formais vs. Notas de Empenho com Força de Contrato (Art. 95 da Lei 14.133/2021)
Nem toda contratação pública gera um instrumento de "Contrato Formal" assinado. Em compras com entrega imediata e integral (até 30 dias, sem obrigações futuras) ou dispensas por valor, o instrumento contratual é substituído pela própria **Nota de Empenho**.
*   **Como o banco modela:** A tabela `contratos` possui a coluna `tipo_formalizacao` (`'CONTRATO_FORMAL'` ou `'NOTA_EMPENHO_FORCA_CONTRATO'`).
*   **Regra 1 (Numeração):** Se for `'CONTRATO_FORMAL'`, o campo `numero_contrato` (ex: `012/2026`) é obrigatório via *Check Constraint*. Se for `'NOTA_EMPENHO_FORCA_CONTRATO'`, `numero_contrato` pode ser nulo (ou receber o número da Ordem de Fornecimento).
*   **Regra 2 (Vedação Jurídica de Aditivos):** Registros do tipo `'NOTA_EMPENHO_FORCA_CONTRATO'` **não admitem Termos Aditivos** (`ADITIVO_PRAZO`, `ADITIVO_VALOR`, `ADITIVO_MISTO`), permitindo apenas `APOSTILAMENTO` se necessário. O banco bloqueia qualquer tentativa via Trigger (`trg_check_aditivo_instrumento`) e a UI deve desabilitar o botão preventivamente.
*   **Vantagem Arquitetural:** Ambos os tipos permitem designar Fiscais (`contrato_fiscais`), vincular a uma Ata de origem (`ata_origem_id`) e controlar Empenhos e Liquidações de forma unificada.

### 2.1.1. Classificação do Contrato, Modalidade Licitatória e Caráter Emergencial
A tabela `contratos` contempla 3 atributos informativos essenciais para a instrução processual e governança:
1.  **Tipo de Contrato (`tipo_contrato`):**
    *   `CONTINUO`: Serviços e fornecimentos essenciais e continuados (Art. 106 da Lei nº 14.133/2021).
    *   `ESCOPO`: Obras, fornecimentos ou serviços pontuais com entrega pré-fixada (Art. 111 da Lei nº 14.133/2021).
2.  **Tipo de Licitação (`tipo_licitacao`):**
    *   `PREGAO_ELETRONICO`: Aquisição de bens e serviços comuns.
    *   `DISPENSA_LICITACAO`: Hipóteses de dispensa por valor ou situação emergencial/calamidade pública (Art. 75).
    *   `INEXIGIBILIDADE`: Inviabilidade de competição (Art. 74 - fornecedor exclusivo, notória especialização, etc.).
    *   `CONCORRENCIA`: Bens e serviços especiais e obras de engenharia de maior complexidade.
3.  **Emergencial (`emergencial`):**
    *   Booleano (`true` / `false` [Default]): Sinaliza contratações formalizadas sob o Art. 75, VIII da Lei nº 14.133/2021, disparando alertas de vigência estrita e improrrogável de até 1 (um) ano.


### 2.2. Termos Aditivos, Apostilamentos e Atualização Automática do Contrato
A tabela `alteracoes_contratuais` registra quatro tipos de eventos:
1.  `ADITIVO_PRAZO`: Prorroga a vigência do contrato (exige `vigencia_termo_inicio` e `vigencia_termo_fim`).
2.  `ADITIVO_VALOR`: Acréscimo ou supressão quantitativa/qualitativa (Art. 124/125 da Lei 14.133). Não cria nova janela de prazo (`vigencia_termo_inicio/fim` ficam `NULL`).
3.  `ADITIVO_MISTO`: Prorroga o prazo e altera o valor simultaneamente (exige datas de vigência e `valor_diferenca`).
4.  `APOSTILAMENTO`: Reajuste por índice contratual (IPCA/IGP-M), repactuação ou alteração de dotação orçamentária (Art. 136 da Lei 14.133). Não exige nova janela de vigência.
*   **Automação no Banco (`trg_sync_contrato_aditivos`):** Sempre que uma alteração contratual é inserida, editada ou removida, o banco recalcula automaticamente na tabela `contratos`:
    *   `valor_atualizado = valor_inicial + SUM(valor_diferenca)`
    *   `data_vigencia_fim_atual = MAX(vigencia_termo_fim)` (ou retorna para `data_vigencia_fim_original` se não houver aditivos de prazo).
*   **Alerta Legal de 25% / 50%:** A interface deve calcular e exibir o percentual acumulado de acréscimos sobre o valor inicial atualizado, alertando visualmente quando se aproximar ou atingir o limite legal de **25%** (compras e serviços) ou **50%** (reforma de edifício/equipamento).

### 2.3. Cruzamento Temporal: Chave SIGA / Empenho vs. Janela de Vigência
Um dos maiores desafios das prestações de contas ao TCE-RJ é comprovar se determinada Nota de Empenho (`numero_nota_empenho`) e sua respectiva `chave_siga` referem-se ao **Contrato Inicial** ou a um **Termo Aditivo específico**.
*   **Como funciona:** Na tabela `financeiro_empenhos`, existe o campo `data_referencia_vigencia`.
*   **Trigger `trg_classifica_empenho`:** Ao salvar um empenho:
    1. Se o usuário não tiver forçado manualmente um `alteracao_id`, a trigger verifica se `data_referencia_vigencia` cai dentro da janela (`vigencia_termo_inicio` até `vigencia_termo_fim`) de algum `ADITIVO_PRAZO` ou `ADITIVO_MISTO` daquele contrato.
    2. Se encontrar, preenche automaticamente `alteracao_id` e grava o nome do termo (ex: `'1º Termo Aditivo'`) em `vinculo_automatico_detectado`.
    3. Se não cair em nenhum aditivo, verifica se está entre `data_vigencia_inicio_original` e `data_vigencia_fim_original` do contrato. Se sim, grava `'CONTRATO_INICIAL'`.
    4. Caso esteja fora de todas as janelas válidas, grava `'ALERTA_FORA_DE_VIGENCIA'`, destacando a anomalia na UI.

### 2.4. Ciclo Completo do Empenho no SIAFE-Rio: Original ➔ Reforços/Anulações ➔ Liquidações
No SIAFE-Rio, uma Nota de Empenho original (ex: `2026NE00100`) não tem seu valor editado diretamente; quando há um **Reforço** ou uma **Anulação**, o SIAFE emite uma **nova Nota de Empenho** (ex: `2026NE00245`) referenciando a original.
*   **Empenho Pai (`financeiro_empenhos`):** Guarda o `valor_empenhado_inicial`, `valor_reforcado`, `valor_anulado` e a coluna calculada automaticamente `saldo_empenho_liquido = valor_empenhado_inicial + valor_reforcado - valor_anulado`.
*   **Eventos Filhos (`financeiro_empenhos_eventos`):** Registra cada `REFORCO`, `ANULACAO_PARCIAL`, `ANULACAO_TOTAL` ou `CANCELAMENTO_RP` com seu próprio `numero_ne_evento`, `processo_sei` e `valor_evento`. A trigger `trg_sync_eventos_empenho` atualiza os totais no Empenho Pai instantaneamente. Uma constraint impede que `valor_anulado` supere `(valor_empenhado_inicial + valor_reforcado)`.
*   **Liquidações (`financeiro_liquidacoes`):** Relacionamento `1:N` com o Empenho Pai. Registra cada Nota Fiscal atestada (`numero_nota_fiscal`), a competência (`MM/AAAA`), a Nota de Liquidação gerada no SIAFE (`2026NL...`), o `valor_liquidado` e a data de pagamento da Ordem Bancária (`data_pagamento_ob`).

### 2.5. Atas de Registro de Preços (Gerenciadora vs. Participante) e Abate de Saldo
A SEMPI atua em dois cenários principais nas Atas (`papel_ata`):
1.  `GERENCIADOR`: A própria SEMPI licitou e gerencia a Ata.
2.  `PARTICIPANTE` (ou `CARONA`): A Ata pertence a outro órgão (ex: SEPLAG-RJ, PRODERJ), e a SEMPI possui uma cota específica registrada no SIGA.
*   **Controle de Saldo por Item (`atas_itens`):**
    *   `qtd_total_registrada`: Quantidade global da ata.
    *   `qtd_cota_secretaria`: Quantidade pertencente à SEMPI (`<= qtd_total_registrada`).
    *   `qtd_empenhada_secretaria`: Soma automática de tudo que a SEMPI já consumiu daquele item.
    *   `saldo_disponivel`: Coluna gerada (`qtd_cota_secretaria - qtd_empenhada_secretaria`).
*   **Abate Automático (`atas_consumo_empenhos` + `trg_sync_consumo_ata`):** Quando um empenho consome itens de uma ata, insere-se o vínculo em `atas_consumo_empenhos`. A trigger recalcula `qtd_empenhada_secretaria`. Se o consumo ultrapassar a cota da SEMPI, a constraint `chk_empenho_nao_excede_cota` aborta a transação imediatamente.

### 2.6. Gestão de Fiscais e Gestores de Contrato
Todo instrumento vigente exige acompanhamento formal designado em Portaria publicada no Diário Oficial do Estado do Rio de Janeiro (**DOERJ**).
*   A tabela `contrato_fiscais` armazena `nome`, `id_funcional` (identificador único do servidor no RJ), `funcao` (`GESTOR`, `FISCAL_TECNICO`, `FISCAL_ADMINISTRATIVO`, `SUPLENTE`), `portaria_designacao`, `data_publicacao_doerj`, `data_inicio`, `data_fim`, `ativo` e `usuario_id` (opcional, permitindo cadastrar o servidor da portaria mesmo antes de ele criar login no sistema; quando criar, o cruzamento por `usuario_id` ou `id_funcional` habilita o RLS dele).

---

## 3. Matriz de Controle de Acesso (RBAC & RLS)

| Role (`user_role`) | Permissões de Negócio | Regra de RLS no Banco |
| :--- | :--- | :--- |
| **`ADMIN`** | Acesso irrestrito a todos os módulos, gestão de usuários e leitura da trilha de auditoria. | `fn_get_my_role() = 'ADMIN'` |
| **`GESTOR_CONTRATOS`** | Cria e edita Atas, Contratos, Termos Aditivos, Apostilamentos e designa/substitui Fiscais. Visualiza módulo financeiro. | Escrita em `atas_*`, `contratos`, `alteracoes_contratuais`, `contrato_fiscais`. Leitura em `financeiro_*`. |
| **`FINANCEIRO`** | Lança Notas de Empenho, Chaves SIGA, Eventos de Reforço/Anulação, Liquidações e Consumo de Atas. | Escrita em `financeiro_*` e `atas_consumo_empenhos`. Leitura nas demais tabelas operacionais. |
| **`FISCAL`** | Visualiza **exclusivamente** os contratos em que está designado e ativo, podendo registrar Liquidações/Atestos de Notas Fiscais. | `fn_is_fiscal_do_contrato(contrato_id)` valida `usuario_id = auth.uid()` ou `id_funcional` igual ao do perfil logado. |
| **`CONSULTA_TCE`** | Acesso de leitura universal (Contratos, Atas, Financeiro, Fiscais e **Trilha de Auditoria `audit_logs`**) com foco em fiscalização e exportação. | Apenas `SELECT` em todas as tabelas, incluindo `public.audit_logs`. |

---

## 4. Auditoria Imutável (`audit_logs`)
*   Qualquer `INSERT`, `UPDATE` ou `DELETE` nas 10 tabelas operacionais dispara a trigger `fn_process_audit_log()`.
*   Em operações de `UPDATE`, a trigger compara chave por chave o JSON antigo (`OLD`) com o novo (`NEW`), ignorando `updated_at`, e grava o array `campos_alterados` junto aos objetos completos `dados_antigos` e `dados_novos` em formato `JSONB`.
*   A tabela `audit_logs` não possui políticas de `UPDATE` ou `DELETE` para nenhum usuário, garantindo integridade forense.
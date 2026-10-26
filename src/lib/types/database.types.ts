export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'ADMIN' | 'GESTOR_CONTRATOS' | 'FINANCEIRO' | 'FISCAL' | 'CONSULTA_TCE';
export type TipoInstrumento = 'CONTRATO_FORMAL' | 'NOTA_EMPENHO_FORCA_CONTRATO';
export type TipoAlteracao = 'ADITIVO_PRAZO' | 'ADITIVO_VALOR' | 'ADITIVO_MISTO' | 'APOSTILAMENTO';
export type PapelAta = 'GERENCIADOR' | 'PARTICIPANTE' | 'CARONA';
export type FuncaoFiscal = 'GESTOR' | 'FISCAL_TECNICO' | 'FISCAL_ADMINISTRATIVO' | 'SUPLENTE';
export type StatusInstrumento = 'VIGENTE' | 'ENCERRADO' | 'RESCINDIDO' | 'SUSPENSO' | 'EM_FORMALIZACAO';
export type TipoEventoEmpenho = 'REFORCO' | 'ANULACAO_PARCIAL' | 'ANULACAO_TOTAL' | 'CANCELAMENTO_RP';
export type TipoContrato = 'CONTINUO' | 'ESCOPO';
export type TipoLicitacao = 'PREGAO_ELETRONICO' | 'DISPENSA_LICITACAO' | 'INEXIGIBILIDADE' | 'CONCORRENCIA';

export interface Database {
  public: {
    Tables: {
      perfis_usuarios: {
        Row: {
          id: string;
          nome_completo: string;
          id_funcional: string;
          cpf: string;
          setor: string;
          role: UserRole;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nome_completo: string;
          id_funcional: string;
          cpf: string;
          setor: string;
          role?: UserRole;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome_completo?: string;
          id_funcional?: string;
          cpf?: string;
          setor?: string;
          role?: UserRole;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      atas_registro_preco: {
        Row: {
          id: string;
          numero_ata: string;
          processo_sei: string;
          codigo_siga_arp: string | null;
          papel_secretaria: PapelAta;
          orgao_gerenciador: string;
          objeto: string;
          data_publicacao_pncp: string;
          data_vigencia_inicio: string;
          data_vigencia_fim: string;
          prorrogavel: boolean;
          status: StatusInstrumento;
          observacoes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero_ata: string;
          processo_sei: string;
          codigo_siga_arp?: string | null;
          papel_secretaria: PapelAta;
          orgao_gerenciador?: string;
          objeto: string;
          data_publicacao_pncp: string;
          data_vigencia_inicio: string;
          data_vigencia_fim: string;
          prorrogavel?: boolean;
          status?: StatusInstrumento;
          observacoes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero_ata?: string;
          processo_sei?: string;
          codigo_siga_arp?: string | null;
          papel_secretaria?: PapelAta;
          orgao_gerenciador?: string;
          objeto?: string;
          data_publicacao_pncp?: string;
          data_vigencia_inicio?: string;
          data_vigencia_fim?: string;
          prorrogavel?: boolean;
          status?: StatusInstrumento;
          observacoes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "atas_registro_preco_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "perfis_usuarios";
            referencedColumns: ["id"];
          }
        ];
      };
      atas_itens: {
        Row: {
          id: string;
          ata_id: string;
          item_numero: number;
          codigo_item_siga: string;
          descricao: string;
          fornecedor_cnpj: string;
          fornecedor_razao_social: string;
          unidade_medida: string;
          valor_unitario: number;
          qtd_total_registrada: number;
          qtd_cota_secretaria: number;
          qtd_empenhada_secretaria: number;
          saldo_disponivel: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ata_id: string;
          item_numero: number;
          codigo_item_siga: string;
          descricao: string;
          fornecedor_cnpj: string;
          fornecedor_razao_social: string;
          unidade_medida: string;
          valor_unitario: number;
          qtd_total_registrada: number;
          qtd_cota_secretaria: number;
          qtd_empenhada_secretaria?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ata_id?: string;
          item_numero?: number;
          codigo_item_siga?: string;
          descricao?: string;
          fornecedor_cnpj?: string;
          fornecedor_razao_social?: string;
          unidade_medida?: string;
          valor_unitario?: number;
          qtd_total_registrada?: number;
          qtd_cota_secretaria?: number;
          qtd_empenhada_secretaria?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "atas_itens_ata_id_fkey";
            columns: ["ata_id"];
            isOneToOne: false;
            referencedRelation: "atas_registro_preco";
            referencedColumns: ["id"];
          }
        ];
      };
      contratos: {
        Row: {
          id: string;
          ata_origem_id: string | null;
          tipo_formalizacao: TipoInstrumento;
          tipo_contrato: TipoContrato;
          tipo_licitacao: TipoLicitacao;
          emergencial: boolean;
          numero_contrato: string | null;
          processo_sei: string;
          chave_siga_contrato: string;
          contratada_cnpj: string;
          contratada_razao_social: string;
          objeto: string;
          valor_inicial: number;
          valor_atualizado: number;
          data_publicacao_pncp: string;
          data_vigencia_inicio_original: string;
          data_vigencia_fim_original: string;
          data_vigencia_fim_atual: string;
          observacoes: string | null;
          status: StatusInstrumento;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ata_origem_id?: string | null;
          tipo_formalizacao?: TipoInstrumento;
          tipo_contrato?: TipoContrato;
          tipo_licitacao?: TipoLicitacao;
          emergencial?: boolean;
          numero_contrato?: string | null;
          processo_sei: string;
          chave_siga_contrato: string;
          contratada_cnpj: string;
          contratada_razao_social: string;
          objeto: string;
          valor_inicial: number;
          valor_atualizado?: number;
          data_publicacao_pncp: string;
          data_vigencia_inicio_original: string;
          data_vigencia_fim_original: string;
          data_vigencia_fim_atual?: string;
          observacoes?: string | null;
          status?: StatusInstrumento;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ata_origem_id?: string | null;
          tipo_formalizacao?: TipoInstrumento;
          tipo_contrato?: TipoContrato;
          tipo_licitacao?: TipoLicitacao;
          emergencial?: boolean;
          numero_contrato?: string | null;
          processo_sei?: string;
          chave_siga_contrato?: string;
          contratada_cnpj?: string;
          contratada_razao_social?: string;
          objeto?: string;
          valor_inicial?: number;
          valor_atualizado?: number;
          data_publicacao_pncp?: string;
          data_vigencia_inicio_original?: string;
          data_vigencia_fim_original?: string;
          data_vigencia_fim_atual?: string;
          observacoes?: string | null;
          status?: StatusInstrumento;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contratos_ata_origem_id_fkey";
            columns: ["ata_origem_id"];
            isOneToOne: false;
            referencedRelation: "atas_registro_preco";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contratos_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "perfis_usuarios";
            referencedColumns: ["id"];
          }
        ];
      };
      alteracoes_contratuais: {
        Row: {
          id: string;
          contrato_id: string;
          procedimento: string;
          processo_sei: string;
          chave_siga_termo: string | null;
          tipo: TipoAlteracao;
          justificativa_resumo: string;
          valor_diferenca: number;
          data_assinatura: string;
          vigencia_termo_inicio: string | null;
          vigencia_termo_fim: string | null;
          publicacao_doerj_data: string | null;
          publicacao_doerj_pagina: string | null;
          publicacao_pncp_data: string | null;
          observacoes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contrato_id: string;
          procedimento: string;
          processo_sei: string;
          chave_siga_termo?: string | null;
          tipo: TipoAlteracao;
          justificativa_resumo: string;
          valor_diferenca?: number;
          data_assinatura: string;
          vigencia_termo_inicio?: string | null;
          vigencia_termo_fim?: string | null;
          publicacao_doerj_data?: string | null;
          publicacao_doerj_pagina?: string | null;
          publicacao_pncp_data?: string | null;
          observacoes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contrato_id?: string;
          procedimento?: string;
          processo_sei?: string;
          chave_siga_termo?: string | null;
          tipo?: TipoAlteracao;
          justificativa_resumo?: string;
          valor_diferenca?: number;
          data_assinatura?: string;
          vigencia_termo_inicio?: string | null;
          vigencia_termo_fim?: string | null;
          publicacao_doerj_data?: string | null;
          publicacao_doerj_pagina?: string | null;
          publicacao_pncp_data?: string | null;
          observacoes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alteracoes_contratuais_contrato_id_fkey";
            columns: ["contrato_id"];
            isOneToOne: false;
            referencedRelation: "contratos";
            referencedColumns: ["id"];
          }
        ];
      };
      financeiro_empenhos: {
        Row: {
          id: string;
          contrato_id: string;
          alteracao_id: string | null;
          processo_sei: string;
          chave_siga: string;
          numero_nota_empenho: string;
          tipo_empenho: 'ORDINARIO' | 'ESTIMATIVO' | 'GLOBAL';
          data_emissao: string;
          data_referencia_vigencia: string;
          programa_trabalho: string;
          natureza_despesa: string;
          fonte_recurso: string;
          valor_empenhado_inicial: number;
          valor_reforcado: number;
          valor_anulado: number;
          saldo_empenho_liquido: number;
          vinculo_automatico_detectado: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contrato_id: string;
          alteracao_id?: string | null;
          processo_sei: string;
          chave_siga: string;
          numero_nota_empenho: string;
          tipo_empenho?: 'ORDINARIO' | 'ESTIMATIVO' | 'GLOBAL';
          data_emissao: string;
          data_referencia_vigencia?: string;
          programa_trabalho: string;
          natureza_despesa: string;
          fonte_recurso: string;
          valor_empenhado_inicial: number;
          valor_reforcado?: number;
          valor_anulado?: number;
          vinculo_automatico_detectado?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contrato_id?: string;
          alteracao_id?: string | null;
          processo_sei?: string;
          chave_siga?: string;
          numero_nota_empenho?: string;
          tipo_empenho?: 'ORDINARIO' | 'ESTIMATIVO' | 'GLOBAL';
          data_emissao?: string;
          data_referencia_vigencia?: string;
          programa_trabalho?: string;
          natureza_despesa?: string;
          fonte_recurso?: string;
          valor_empenhado_inicial?: number;
          valor_reforcado?: number;
          valor_anulado?: number;
          vinculo_automatico_detectado?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financeiro_empenhos_contrato_id_fkey";
            columns: ["contrato_id"];
            isOneToOne: false;
            referencedRelation: "contratos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financeiro_empenhos_alteracao_id_fkey";
            columns: ["alteracao_id"];
            isOneToOne: false;
            referencedRelation: "alteracoes_contratuais";
            referencedColumns: ["id"];
          }
        ];
      };
      financeiro_empenhos_eventos: {
        Row: {
          id: string;
          empenho_original_id: string;
          tipo_evento: TipoEventoEmpenho;
          numero_ne_evento: string;
          processo_sei: string;
          chave_siga: string | null;
          data_evento: string;
          valor_evento: number;
          motivo: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empenho_original_id: string;
          tipo_evento: TipoEventoEmpenho;
          numero_ne_evento: string;
          processo_sei: string;
          chave_siga?: string | null;
          data_evento: string;
          valor_evento: number;
          motivo: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          empenho_original_id?: string;
          tipo_evento?: TipoEventoEmpenho;
          numero_ne_evento?: string;
          processo_sei?: string;
          chave_siga?: string | null;
          data_evento?: string;
          valor_evento?: number;
          motivo?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financeiro_empenhos_eventos_empenho_original_id_fkey";
            columns: ["empenho_original_id"];
            isOneToOne: false;
            referencedRelation: "financeiro_empenhos";
            referencedColumns: ["id"];
          }
        ];
      };
      financeiro_liquidacoes: {
        Row: {
          id: string;
          empenho_id: string;
          processo_sei: string;
          numero_nota_fiscal: string;
          data_emissao_nota_fiscal: string;
          competencia_mes_ano: string;
          numero_nota_liquidacao: string;
          data_emissao_nl: string;
          valor_liquidado: number;
          data_pagamento_ob: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empenho_id: string;
          processo_sei: string;
          numero_nota_fiscal: string;
          data_emissao_nota_fiscal: string;
          competencia_mes_ano: string;
          numero_nota_liquidacao: string;
          data_emissao_nl: string;
          valor_liquidado: number;
          data_pagamento_ob?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          empenho_id?: string;
          processo_sei?: string;
          numero_nota_fiscal?: string;
          data_emissao_nota_fiscal?: string;
          competencia_mes_ano?: string;
          numero_nota_liquidacao?: string;
          data_emissao_nl?: string;
          valor_liquidado?: number;
          data_pagamento_ob?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financeiro_liquidacoes_empenho_id_fkey";
            columns: ["empenho_id"];
            isOneToOne: false;
            referencedRelation: "financeiro_empenhos";
            referencedColumns: ["id"];
          }
        ];
      };
      atas_consumo_empenhos: {
        Row: {
          id: string;
          ata_item_id: string;
          empenho_id: string;
          quantidade_consumida: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ata_item_id: string;
          empenho_id: string;
          quantidade_consumida: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ata_item_id?: string;
          empenho_id?: string;
          quantidade_consumida?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "atas_consumo_empenhos_ata_item_id_fkey";
            columns: ["ata_item_id"];
            isOneToOne: false;
            referencedRelation: "atas_itens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "atas_consumo_empenhos_empenho_id_fkey";
            columns: ["empenho_id"];
            isOneToOne: false;
            referencedRelation: "financeiro_empenhos";
            referencedColumns: ["id"];
          }
        ];
      };
      contrato_fiscais: {
        Row: {
          id: string;
          contrato_id: string;
          usuario_id: string | null;
          nome: string;
          id_funcional: string;
          funcao: FuncaoFiscal;
          portaria_designacao: string;
          data_publicacao_doerj: string;
          data_inicio: string;
          data_fim: string | null;
          ativo: boolean;
          data_substituicao: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contrato_id: string;
          usuario_id?: string | null;
          nome: string;
          id_funcional: string;
          funcao: FuncaoFiscal;
          portaria_designacao: string;
          data_publicacao_doerj: string;
          data_inicio: string;
          data_fim?: string | null;
          ativo?: boolean;
          data_substituicao?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contrato_id?: string;
          usuario_id?: string | null;
          nome?: string;
          id_funcional?: string;
          funcao?: FuncaoFiscal;
          portaria_designacao?: string;
          data_publicacao_doerj?: string;
          data_inicio?: string;
          data_fim?: string | null;
          ativo?: boolean;
          data_substituicao?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contrato_fiscais_contrato_id_fkey";
            columns: ["contrato_id"];
            isOneToOne: false;
            referencedRelation: "contratos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contrato_fiscais_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "perfis_usuarios";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: number;
          tabela_afetada: string;
          registro_id: string;
          acao: 'INSERT' | 'UPDATE' | 'DELETE';
          usuario_id: string | null;
          dados_antigos: Json | null;
          dados_novos: Json | null;
          campos_alterados: string[] | null;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "audit_logs_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "perfis_usuarios";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      fn_get_my_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      fn_is_fiscal_do_contrato: {
        Args: {
          p_contrato_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      tipo_instrumento: TipoInstrumento;
      tipo_alteracao: TipoAlteracao;
      papel_ata: PapelAta;
      funcao_fiscal: FuncaoFiscal;
      status_instrumento: StatusInstrumento;
      tipo_evento_empenho: TipoEventoEmpenho;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TipoUsuario = "admin" | "operador";
export type StatusCampanha = "RASCUNHO" | "ATIVA" | "PAUSADA" | "CONCLUIDA" | "CANCELADA";
export type StatusDoacao = "PENDENTE" | "PAGA" | "CANCELADA" | "REEMBOLSADA";
export type StatusContato = "RECEBIDA" | "EM_ANALISE" | "RESPONDIDA" | "ARQUIVADA";
export type TipoMensagem = "CONTATO" | "SUGESTAO";

export type CampanhaRow = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  localidade: string | null;
  status: StatusCampanha;
  valor_meta: number;
  valor_arrecadado: number;
  data_inicio: string | null;
  data_termino: string | null;
  mensal: boolean;
  destaque: boolean;
  visivel: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type SubmetaRow = {
  id: string;
  campanha_id: string;
  titulo: string;
  descricao: string | null;
  valor: number;
  ordem: number;
  criado_em: string;
};

export type AtualizacaoRow = {
  id: string;
  campanha_id: string;
  titulo: string;
  texto: string;
  tag: string | null;
  data_publicacao: string;
  privado: boolean;
  criado_em: string;
};

export type ImagemRow = {
  id: string;
  campanha_id: string;
  url: string;
  descricao: string | null;
  papel: string;
  ordem: number;
  criado_em: string;
};

export type DoacaoRow = {
  id: string;
  campanha_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  anonimo: boolean;
  valor: number;
  status: StatusDoacao;
  txid: string;
  assinatura_id: string | null;
  payment_provider: string | null;
  payment_id: string | null;
  payment_preference_id: string | null;
  token_publico: string;
  criado_em: string;
  atualizado_em: string;
  pago_em: string | null;
};

export type UsuarioRow = {
  id: string;
  nome: string;
  email: string;
  login: string;
  senha: string;
  tipo: TipoUsuario;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type ParceiroRow = {
  id: string;
  nome: string;
  sigla: string | null;
  tipo: string | null;
  area: string | null;
  localidade: string | null;
  descricao: string | null;
  logo_url: string | null;
  desde: string | null;
  destaque: boolean;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type ContatoRow = {
  id: string;
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  tipo: TipoMensagem;
  status: StatusContato;
  criado_em: string;
  atualizado_em: string;
  respondido_em: string | null;
};

export type Database = {
  public: {
    Tables: {
      campanhas: { Row: CampanhaRow; Insert: Partial<CampanhaRow> & Pick<CampanhaRow, "slug" | "titulo">; Update: Partial<CampanhaRow>; Relationships: [] };
      submetas_campanhas: {
        Row: SubmetaRow;
        Insert: Partial<SubmetaRow> & Pick<SubmetaRow, "campanha_id" | "titulo" | "valor">;
        Update: Partial<SubmetaRow>;
        Relationships: [{ foreignKeyName: "submetas_campanhas_campanha_id_fkey"; columns: ["campanha_id"]; isOneToOne: false; referencedRelation: "campanhas"; referencedColumns: ["id"] }];
      };
      atualizacoes_campanhas: {
        Row: AtualizacaoRow;
        Insert: Partial<AtualizacaoRow> & Pick<AtualizacaoRow, "campanha_id" | "titulo" | "texto">;
        Update: Partial<AtualizacaoRow>;
        Relationships: [{ foreignKeyName: "atualizacoes_campanhas_campanha_id_fkey"; columns: ["campanha_id"]; isOneToOne: false; referencedRelation: "campanhas"; referencedColumns: ["id"] }];
      };
      imagens_campanhas: {
        Row: ImagemRow;
        Insert: Partial<ImagemRow> & Pick<ImagemRow, "campanha_id" | "url">;
        Update: Partial<ImagemRow>;
        Relationships: [{ foreignKeyName: "imagens_campanhas_campanha_id_fkey"; columns: ["campanha_id"]; isOneToOne: false; referencedRelation: "campanhas"; referencedColumns: ["id"] }];
      };
      doacoes: {
        Row: DoacaoRow;
        Insert: Partial<DoacaoRow> & Pick<DoacaoRow, "campanha_id" | "valor" | "txid">;
        Update: Partial<DoacaoRow>;
        Relationships: [{ foreignKeyName: "doacoes_campanha_id_fkey"; columns: ["campanha_id"]; isOneToOne: false; referencedRelation: "campanhas"; referencedColumns: ["id"] }];
      };
      usuarios: { Row: UsuarioRow; Insert: Partial<UsuarioRow> & Pick<UsuarioRow, "nome" | "email" | "login" | "senha">; Update: Partial<UsuarioRow>; Relationships: [] };
      parceiros: { Row: ParceiroRow; Insert: Partial<ParceiroRow> & Pick<ParceiroRow, "nome">; Update: Partial<ParceiroRow>; Relationships: [] };
      contato: { Row: ContatoRow; Insert: Partial<ContatoRow> & Pick<ContatoRow, "nome" | "email" | "assunto" | "mensagem">; Update: Partial<ContatoRow>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      confirmar_doacao: { Args: { p_doacao_id: string; p_payment_id: string; p_valor: number }; Returns: Json };
      definir_status_doacao: { Args: { p_doacao_id: string; p_status: StatusDoacao }; Returns: Json };
      consumir_rate_limit: { Args: { p_chave: string; p_limite: number; p_janela_segundos: number }; Returns: Json };
    };
    Enums: { tipo_usuarios: TipoUsuario };
    CompositeTypes: Record<string, never>;
  };
};

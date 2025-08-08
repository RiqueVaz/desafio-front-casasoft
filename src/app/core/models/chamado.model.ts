export type StatusChamado = 'ABERTO' | 'FECHADO' | 'EM_ANDAMENTO';

export interface Chamado {
  id: number;
  titulo: string;
  descricao: string;
  status: StatusChamado;
  dataCadastro: string;
}

export interface ChamadoResponse {
  data: Chamado;
}

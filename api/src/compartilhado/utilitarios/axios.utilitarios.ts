import axios from 'axios';

/**
 * Extrai mensagem de erro amigável de erros do Axios
 * Tenta extrair mensagens em português e inglês de várias propriedades comuns
 */
export function extrairErroAxios(erro: unknown): string {
  if (axios.isAxiosError(erro)) {
    const data = erro.response?.data;
    if (data?.mensagem) return data.mensagem;
    if (data?.erro) return data.erro;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return erro.message;
  }
  if (erro instanceof Error) {
    return erro.message;
  }
  return 'Erro desconhecido';
}

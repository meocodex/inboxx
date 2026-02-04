import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatarData(data: string | Date | null | undefined, formato = 'dd/MM/yyyy'): string {
  if (!data) {
    return '-';
  }

  const dataObj = new Date(data);
  if (isNaN(dataObj.getTime())) {
    return 'Data inválida';
  }

  if (formato === 'relative') {
    return formatDistanceToNow(dataObj, { addSuffix: true, locale: ptBR });
  }
  return format(dataObj, formato, { locale: ptBR });
}

export function formatarDataHora(data: string | Date | null | undefined): string {
  if (!data) {
    return '-';
  }

  const dataObj = new Date(data);
  if (isNaN(dataObj.getTime())) {
    return 'Data inválida';
  }

  return format(dataObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

export function formatarHora(data: string | Date | null | undefined): string {
  if (!data) {
    return '-';
  }

  const dataObj = new Date(data);
  if (isNaN(dataObj.getTime())) {
    return 'Hora inválida';
  }

  return format(dataObj, 'HH:mm');
}

export function formatarTempoRelativo(data: string | Date | null | undefined): string {
  if (!data) {
    return 'Nunca';
  }

  const dataObj = new Date(data);

  // Validar se a data é válida
  if (isNaN(dataObj.getTime())) {
    return 'Data inválida';
  }

  return formatDistanceToNow(dataObj, { addSuffix: true, locale: ptBR });
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor);
}

export function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');

  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  if (numeros.length === 13) {
    return numeros.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
  }

  return telefone;
}

export function truncarTexto(texto: string, tamanho: number): string {
  if (texto.length <= tamanho) return texto;
  return texto.slice(0, tamanho) + '...';
}

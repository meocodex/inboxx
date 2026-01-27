import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatarData(data: string | Date, formato = 'dd/MM/yyyy'): string {
  return format(new Date(data), formato, { locale: ptBR });
}

export function formatarDataHora(data: string | Date): string {
  return format(new Date(data), 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

export function formatarHora(data: string | Date): string {
  return format(new Date(data), 'HH:mm');
}

export function formatarTempoRelativo(data: string | Date): string {
  return formatDistanceToNow(new Date(data), { addSuffix: true, locale: ptBR });
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

import { useCallback, useState } from 'react';
import { useNodesState, type Node } from '@xyflow/react';
import type { DadosNo, TipoNo } from '../NoFluxo';
import type { NoFluxo } from '../CanvasFluxo';
import { gerarId, obterNomePadrao, obterConfiguracaoPadrao } from '../helpers/fluxo.helpers';

// =============================================================================
// Hook: Gerenciamento de Nós
// =============================================================================

export const useGerenciamentoNos = (nosIniciais: NoFluxo[] = []) => {
  const [nos, setNos, onNosChange] = useNodesState(nosIniciais as unknown as Node[]);
  const [noSelecionado, setNoSelecionado] = useState<{ id: string; data: DadosNo } | null>(null);

  // Adicionar nó
  const adicionarNo = useCallback(
    (tipo: TipoNo, position?: { x: number; y: number }) => {
      const novoNo: Node = {
        id: gerarId(),
        type: tipo,
        position: position || { x: 250, y: nos.length * 100 + 50 },
        data: {
          tipo,
          nome: obterNomePadrao(tipo),
          configuracao: obterConfiguracaoPadrao(tipo),
        },
      };

      setNos((nds) => nds.concat(novoNo));
      return novoNo.id;
    },
    [nos.length, setNos]
  );

  // Atualizar nó
  const atualizarNo = useCallback(
    (id: string, dados: Partial<DadosNo>) => {
      setNos((nds) =>
        nds.map((no) => {
          if (no.id === id) {
            const dadosAtuais = no.data as unknown as DadosNo;
            return {
              ...no,
              data: {
                ...dadosAtuais,
                ...dados,
                configuracao: {
                  ...dadosAtuais.configuracao,
                  ...(dados.configuracao || {}),
                },
              },
            };
          }
          return no;
        })
      );

      // Atualizar seleção
      if (noSelecionado?.id === id) {
        setNoSelecionado((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            data: {
              ...prev.data,
              ...dados,
              configuracao: {
                ...prev.data.configuracao,
                ...(dados.configuracao || {}),
              },
            },
          };
        });
      }
    },
    [setNos, noSelecionado?.id]
  );

  // Excluir nó
  const excluirNo = useCallback(
    (id: string) => {
      setNos((nds) => nds.filter((no) => no.id !== id));
      setNoSelecionado(null);
      return id;
    },
    [setNos]
  );

  // Selecionar nó
  const selecionarNo = useCallback((no: Node | null) => {
    if (no) {
      setNoSelecionado({
        id: no.id,
        data: no.data as unknown as DadosNo,
      });
    } else {
      setNoSelecionado(null);
    }
  }, []);

  // Converter para formato de salvamento
  const converterNosParaSalvar = useCallback(() => {
    return nos.map((no) => ({
      id: no.id,
      type: no.type as TipoNo,
      position: no.position,
      data: no.data as unknown as DadosNo,
    }));
  }, [nos]);

  return {
    nos,
    setNos,
    onNosChange,
    noSelecionado,
    adicionarNo,
    atualizarNo,
    excluirNo,
    selecionarNo,
    converterNosParaSalvar,
  };
};

import { memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/ui/select';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Separator } from '@/componentes/ui/separator';
import { cn } from '@/utilitarios/cn';
import type { DadosNo } from './NoFluxo';
import { configuracoesNo } from './NoFluxo';

// =============================================================================
// Schemas de Validacao por Tipo
// =============================================================================

const schemaBase = z.object({
  nome: z.string().min(1, 'Nome obrigatorio'),
});

const schemaMensagem = schemaBase.extend({
  configuracao: z.object({
    mensagem: z.string().min(1, 'Mensagem obrigatoria'),
  }),
});

const schemaPergunta = schemaBase.extend({
  configuracao: z.object({
    mensagem: z.string().min(1, 'Pergunta obrigatoria'),
    variavel: z.string().min(1, 'Nome da variavel obrigatorio'),
    validacao: z.enum(['TEXTO', 'NUMERO', 'EMAIL', 'TELEFONE', 'CPF', 'DATA']).optional(),
  }),
});

const schemaMenu = schemaBase.extend({
  configuracao: z.object({
    mensagem: z.string().min(1, 'Mensagem obrigatoria'),
    opcoes: z.array(z.object({
      texto: z.string().min(1),
      valor: z.string().optional(),
    })).min(1, 'Adicione pelo menos uma opcao'),
  }),
});

// =============================================================================
// Props
// =============================================================================

interface PainelPropriedadesProps {
  no: {
    id: string;
    data: DadosNo;
  } | null;
  onAtualizar: (id: string, dados: Partial<DadosNo>) => void;
  onFechar: () => void;
  onExcluir: (id: string) => void;
  className?: string;
}

// =============================================================================
// Formularios por Tipo
// =============================================================================

function FormularioMensagem({
  dados,
  onSalvar,
}: {
  dados: DadosNo;
  onSalvar: (dados: Partial<DadosNo>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(schemaMensagem),
    defaultValues: {
      nome: dados.nome,
      configuracao: {
        mensagem: (dados.configuracao?.mensagem as string) || '',
      },
    },
  });

  useEffect(() => {
    form.reset({
      nome: dados.nome,
      configuracao: {
        mensagem: (dados.configuracao?.mensagem as string) || '',
      },
    });
  }, [dados, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSalvar(values);
  });

  return (
    <form onChange={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome do no</Label>
        <Input id="nome" {...form.register('nome')} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="mensagem">Mensagem</Label>
        <Textarea
          id="mensagem"
          {...form.register('configuracao.mensagem')}
          className="mt-1 min-h-[100px]"
          placeholder="Digite a mensagem que sera enviada..."
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use {'{variavel}'} para incluir valores dinamicos
        </p>
      </div>
    </form>
  );
}

function FormularioPergunta({
  dados,
  onSalvar,
}: {
  dados: DadosNo;
  onSalvar: (dados: Partial<DadosNo>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(schemaPergunta),
    defaultValues: {
      nome: dados.nome,
      configuracao: {
        mensagem: (dados.configuracao?.mensagem as string) || '',
        variavel: (dados.configuracao?.variavel as string) || '',
        validacao: (dados.configuracao?.validacao as string) || 'TEXTO',
      },
    },
  });

  useEffect(() => {
    form.reset({
      nome: dados.nome,
      configuracao: {
        mensagem: (dados.configuracao?.mensagem as string) || '',
        variavel: (dados.configuracao?.variavel as string) || '',
        validacao: (dados.configuracao?.validacao as string) || 'TEXTO',
      },
    });
  }, [dados, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSalvar(values);
  });

  return (
    <form onChange={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome do no</Label>
        <Input id="nome" {...form.register('nome')} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="mensagem">Pergunta</Label>
        <Textarea
          id="mensagem"
          {...form.register('configuracao.mensagem')}
          className="mt-1"
          placeholder="Digite a pergunta..."
        />
      </div>
      <div>
        <Label htmlFor="variavel">Salvar resposta em</Label>
        <Input
          id="variavel"
          {...form.register('configuracao.variavel')}
          className="mt-1"
          placeholder="nome_variavel"
        />
      </div>
      <div>
        <Label>Validacao</Label>
        <Select
          value={form.watch('configuracao.validacao')}
          onValueChange={(v) => {
            form.setValue('configuracao.validacao', v as 'TEXTO' | 'NUMERO' | 'EMAIL' | 'TELEFONE' | 'CPF' | 'DATA');
            handleSubmit();
          }}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEXTO">Texto livre</SelectItem>
            <SelectItem value="NUMERO">Numero</SelectItem>
            <SelectItem value="EMAIL">E-mail</SelectItem>
            <SelectItem value="TELEFONE">Telefone</SelectItem>
            <SelectItem value="CPF">CPF</SelectItem>
            <SelectItem value="DATA">Data</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  );
}

function FormularioMenu({
  dados,
  onSalvar,
}: {
  dados: DadosNo;
  onSalvar: (dados: Partial<DadosNo>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(schemaMenu),
    defaultValues: {
      nome: dados.nome,
      configuracao: {
        mensagem: (dados.configuracao?.mensagem as string) || '',
        opcoes: (dados.configuracao?.opcoes as Array<{ texto: string; valor?: string }>) || [{ texto: '', valor: '' }],
      },
    },
  });

  useEffect(() => {
    form.reset({
      nome: dados.nome,
      configuracao: {
        mensagem: (dados.configuracao?.mensagem as string) || '',
        opcoes: (dados.configuracao?.opcoes as Array<{ texto: string; valor?: string }>) || [{ texto: '', valor: '' }],
      },
    });
  }, [dados, form]);

  const opcoes = form.watch('configuracao.opcoes') || [];

  const handleSubmit = form.handleSubmit((values) => {
    onSalvar(values);
  });

  const adicionarOpcao = () => {
    form.setValue('configuracao.opcoes', [...opcoes, { texto: '', valor: '' }]);
    handleSubmit();
  };

  const removerOpcao = (index: number) => {
    form.setValue(
      'configuracao.opcoes',
      opcoes.filter((_, i) => i !== index)
    );
    handleSubmit();
  };

  return (
    <form onChange={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome do no</Label>
        <Input id="nome" {...form.register('nome')} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="mensagem">Mensagem do menu</Label>
        <Textarea
          id="mensagem"
          {...form.register('configuracao.mensagem')}
          className="mt-1"
          placeholder="Escolha uma opcao:"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Opcoes</Label>
          <Button type="button" variant="outline" size="sm" onClick={adicionarOpcao}>
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>
        <div className="space-y-2">
          {opcoes.map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground w-6">
                {index + 1}.
              </span>
              <Input
                {...form.register(`configuracao.opcoes.${index}.texto`)}
                placeholder="Texto da opcao"
                className="flex-1"
              />
              {opcoes.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removerOpcao(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}

function FormularioBase({
  dados,
  onSalvar,
}: {
  dados: DadosNo;
  onSalvar: (dados: Partial<DadosNo>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(schemaBase),
    defaultValues: {
      nome: dados.nome,
    },
  });

  useEffect(() => {
    form.reset({ nome: dados.nome });
  }, [dados, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSalvar(values);
  });

  return (
    <form onChange={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome do no</Label>
        <Input id="nome" {...form.register('nome')} className="mt-1" />
      </div>
      <p className="text-sm text-muted-foreground">
        Configuracoes adicionais para este tipo de no serao implementadas em breve.
      </p>
    </form>
  );
}

// =============================================================================
// Componente Painel de Propriedades
// =============================================================================

function PainelPropriedadesBase({
  no,
  onAtualizar,
  onFechar,
  onExcluir,
  className,
}: PainelPropriedadesProps) {
  if (!no) {
    return (
      <div
        className={cn(
          'w-80 bg-background border-l p-4 flex items-center justify-center',
          className
        )}
      >
        <p className="text-sm text-muted-foreground text-center">
          Selecione um no para editar suas propriedades
        </p>
      </div>
    );
  }

  const config = configuracoesNo[no.data.tipo];
  const Icone = config.icone;

  const handleSalvar = (dados: Partial<DadosNo>) => {
    onAtualizar(no.id, dados);
  };

  const renderFormulario = () => {
    switch (no.data.tipo) {
      case 'MENSAGEM':
        return <FormularioMensagem dados={no.data} onSalvar={handleSalvar} />;
      case 'PERGUNTA':
        return <FormularioPergunta dados={no.data} onSalvar={handleSalvar} />;
      case 'MENU':
        return <FormularioMenu dados={no.data} onSalvar={handleSalvar} />;
      default:
        return <FormularioBase dados={no.data} onSalvar={handleSalvar} />;
    }
  };

  return (
    <div className={cn('w-80 bg-background border-l flex flex-col', className)}>
      {/* Cabecalho */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded', config.corFundo)}>
            <Icone className={cn('h-4 w-4', config.cor)} />
          </div>
          <span className="font-medium">{config.rotulo}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFechar}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Formulario */}
      <ScrollArea className="flex-1 p-4">{renderFormulario()}</ScrollArea>

      {/* Acoes */}
      {no.data.tipo !== 'INICIO' && (
        <>
          <Separator />
          <div className="p-4">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => onExcluir(no.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir no
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export const PainelPropriedades = memo(PainelPropriedadesBase);

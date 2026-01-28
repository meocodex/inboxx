import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Bell,
  Shield,
  Smartphone,
  Building,
} from 'lucide-react';
import { autenticacaoServico } from '@/servicos';
import { useAutenticacao, useToast } from '@/hooks';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Switch } from '@/componentes/ui/switch';

// =============================================================================
// Schemas
// =============================================================================

const perfilSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  email: z.string().email('Email invalido'),
});

const senhaSchema = z.object({
  senhaAtual: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
  novaSenha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
  confirmarSenha: z.string().min(6, 'Confirme a senha'),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: 'Senhas nao conferem',
  path: ['confirmarSenha'],
});

type PerfilForm = z.infer<typeof perfilSchema>;
type SenhaForm = z.infer<typeof senhaSchema>;

// =============================================================================
// Abas de Configuração
// =============================================================================

type AbaConfig = 'perfil' | 'notificacoes' | 'seguranca' | 'conexoes' | 'empresa';

const abas: { id: AbaConfig; label: string; icon: React.ElementType }[] = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'notificacoes', label: 'Notificacoes', icon: Bell },
  { id: 'seguranca', label: 'Seguranca', icon: Shield },
  { id: 'conexoes', label: 'Conexoes', icon: Smartphone },
  { id: 'empresa', label: 'Empresa', icon: Building },
];

// =============================================================================
// Componente Principal
// =============================================================================

export default function Configuracoes() {
  const { usuario } = useAutenticacao();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();
  const [abaAtiva, setAbaAtiva] = useState<AbaConfig>('perfil');

  // ---------------------------------------------------------------------------
  // Forms
  // ---------------------------------------------------------------------------
  const perfilForm = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome: usuario?.nome || '',
      email: usuario?.email || '',
    },
  });

  const senhaForm = useForm<SenhaForm>({
    resolver: zodResolver(senhaSchema),
    defaultValues: {
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    },
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const atualizarPerfilMutation = useMutation({
    mutationFn: (dados: PerfilForm) =>
      autenticacaoServico.atualizarPerfil(dados),
    onSuccess: () => {
      mostrarSucesso('Perfil atualizado', 'Suas informacoes foram atualizadas');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel atualizar'),
  });

  const alterarSenhaMutation = useMutation({
    mutationFn: (dados: SenhaForm) =>
      autenticacaoServico.alterarSenha(dados.senhaAtual, dados.novaSenha),
    onSuccess: () => {
      mostrarSucesso('Senha alterada', 'Sua senha foi alterada com sucesso');
      senhaForm.reset();
    },
    onError: () => mostrarErro('Erro', 'Senha atual incorreta'),
  });

  // ---------------------------------------------------------------------------
  // Render Conteúdo
  // ---------------------------------------------------------------------------
  const renderConteudo = () => {
    switch (abaAtiva) {
      case 'perfil':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Informacoes do Perfil</CardTitle>
              <CardDescription>Atualize suas informacoes pessoais</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={perfilForm.handleSubmit((dados) => atualizarPerfilMutation.mutate(dados))}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" {...perfilForm.register('nome')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...perfilForm.register('email')} />
                </div>
                <Button type="submit" disabled={atualizarPerfilMutation.isPending}>
                  Salvar Alteracoes
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'notificacoes':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificacao</CardTitle>
              <CardDescription>Configure como deseja receber notificacoes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificacoes por email</p>
                  <p className="text-sm text-muted-foreground">
                    Receba atualizacoes por email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sons de notificacao</p>
                  <p className="text-sm text-muted-foreground">
                    Reproduzir som ao receber mensagens
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificacoes do navegador</p>
                  <p className="text-sm text-muted-foreground">
                    Mostrar notificacoes na area de trabalho
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        );

      case 'seguranca':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Mantenha sua conta segura</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={senhaForm.handleSubmit((dados) => alterarSenhaMutation.mutate(dados))}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="senhaAtual">Senha Atual</Label>
                  <Input
                    id="senhaAtual"
                    type="password"
                    {...senhaForm.register('senhaAtual')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <Input
                    id="novaSenha"
                    type="password"
                    {...senhaForm.register('novaSenha')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    {...senhaForm.register('confirmarSenha')}
                  />
                </div>
                <Button type="submit" disabled={alterarSenhaMutation.isPending}>
                  Alterar Senha
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'conexoes':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Conexoes WhatsApp</CardTitle>
              <CardDescription>Gerencie suas conexoes com o WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma conexao configurada
                </p>
                <Button className="mt-4" disabled>
                  Conectar WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'empresa':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>Informacoes do seu negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input placeholder="Nome da empresa" disabled />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input placeholder="00.000.000/0000-00" disabled />
              </div>
              <p className="text-sm text-muted-foreground">
                Contate o suporte para alterar dados da empresa
              </p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground">Gerencie suas preferencias</p>
      </div>

      {/* Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Menu Lateral */}
        <Card className="md:w-64 shrink-0">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {abas.map((aba) => {
                const Icon = aba.icon;
                return (
                  <button
                    key={aba.id}
                    onClick={() => setAbaAtiva(aba.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      abaAtiva === aba.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {aba.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Conteúdo */}
        <div className="flex-1">{renderConteudo()}</div>
      </div>
    </div>
  );
}

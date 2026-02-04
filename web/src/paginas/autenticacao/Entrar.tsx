import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, MessageSquare, Loader2 } from 'lucide-react';
import { useAutenticacao } from '@/hooks';
import { extrairMensagemErro } from '@/servicos';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';

// =============================================================================
// Schema de Validação
// =============================================================================

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

// =============================================================================
// Componente Página de Login
// =============================================================================

export default function Entrar() {
  const { entrar, carregando, erro, limparErro } = useAutenticacao();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  const preencherDemo = () => {
    setValue('email', 'admin@admin.com');
    setValue('senha', 'admin123');
  };

  const onSubmit = async (dados: LoginForm) => {
    setErroLocal(null);
    limparErro();

    try {
      await entrar(dados.email, dados.senha);
      // navigate('/') já é chamado pelo hook entrar()
    } catch (error) {
      setErroLocal(extrairMensagemErro(error));
    }
  };

  const mensagemErro = erroLocal || erro;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          {/* Logo */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">CRM Omnichannel</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar o sistema</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Erro */}
            {mensagemErro && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {mensagemErro}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  {...register('senha')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.senha && (
                <p className="text-xs text-destructive">{errors.senha.message}</p>
              )}
            </div>

            {/* Botão */}
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>

            {/* Botão Demo */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={preencherDemo}
              disabled={carregando}
            >
              Preencher com acesso demo
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Sistema de atendimento omnichannel via WhatsApp
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

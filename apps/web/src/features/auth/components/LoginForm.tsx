import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alerta } from '../../../shared/ui/Alerta';
import { Boton } from '../../../shared/ui/Boton';
import { Campo } from '../../../shared/ui/Campo';
import { loginSchema, type Credenciales } from '../schemas/login.schema';

interface LoginFormProps {
  onSubmit: (credenciales: Credenciales) => void;
  enviando: boolean;
  error?: string;
}

export function LoginForm({ onSubmit, enviando, error }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credenciales>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {error && <Alerta>{error}</Alerta>}
      <Campo
        etiqueta="Usuario"
        autoComplete="username"
        autoFocus
        error={errors.username?.message}
        {...register('username')}
      />
      <Campo
        etiqueta="Contraseña"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Boton type="submit" cargando={enviando}>
        {enviando ? 'Ingresando…' : 'Iniciar sesión'}
      </Boton>
    </form>
  );
}

import type { RespuestaSesion, Sesion } from './sesion';

// Almacén de la sesión fuera de React: lo usan el interceptor de Axios y los componentes
// (vía useSesion). El access token vive solo en memoria; en localStorage se guardan el
// refresh token y el usuario, para recuperar la sesión al recargar con un refresh.
const CLAVE = 'simulacion-credito.sesion';

type Persistida = Pick<Sesion, 'refreshToken' | 'usuario'>;
type Suscriptor = () => void;

let actual: Sesion | null = null;
const suscriptores = new Set<Suscriptor>();

function leerPersistida(): Persistida | null {
  try {
    const texto = localStorage.getItem(CLAVE);
    return texto ? (JSON.parse(texto) as Persistida) : null;
  } catch {
    return null;
  }
}

function persistir(sesion: Sesion | null): void {
  try {
    if (sesion) {
      const { refreshToken, usuario } = sesion;
      localStorage.setItem(CLAVE, JSON.stringify({ refreshToken, usuario }));
    } else {
      localStorage.removeItem(CLAVE);
    }
  } catch {
    // Sin almacenamiento disponible (modo privado): la sesión dura lo que la pestaña.
  }
}

function cambiar(sesion: Sesion | null): void {
  actual = sesion;
  persistir(sesion);
  suscriptores.forEach((suscriptor) => suscriptor());
}

export const sesionStore = {
  obtener(): Sesion | null {
    return actual;
  },

  /** Guarda la sesión que devuelven login y refresh. */
  guardar({ accessToken, refreshToken, usuario }: RespuestaSesion): void {
    cambiar({ accessToken, refreshToken, usuario });
  },

  cerrar(): void {
    cambiar(null);
  },

  /** Recupera la sesión persistida (sin access token). Se llama al cargar la aplicación. */
  restaurar(): void {
    const persistida = leerPersistida();
    actual = persistida ? { ...persistida, accessToken: null } : null;
    suscriptores.forEach((suscriptor) => suscriptor());
  },

  suscribir(suscriptor: Suscriptor): () => void {
    suscriptores.add(suscriptor);
    return () => suscriptores.delete(suscriptor);
  },
};

sesionStore.restaurar();

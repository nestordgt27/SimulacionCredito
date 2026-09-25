// Única fuente de "ahora" para dominio y aplicación (CLAUDE.md §3.1: tiempo inyectable).
export interface Clock {
  ahora(): Date;
}

export const CLOCK = Symbol('CLOCK');

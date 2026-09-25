import type { Clock } from '../../src/core/domain/clock';

// Reloj fijo y controlable: las pruebas nunca dependen de la hora real (CLAUDE.md §6.2).
export class FakeClock implements Clock {
  private actual: Date;

  constructor(inicial: Date | string = '2026-09-25T12:00:00Z') {
    this.actual = new Date(inicial);
  }

  ahora(): Date {
    return new Date(this.actual);
  }

  fijar(fecha: Date | string): void {
    this.actual = new Date(fecha);
  }

  avanzar(milisegundos: number): void {
    this.actual = new Date(this.actual.getTime() + milisegundos);
  }
}

export const MINUTOS = 60_000;
export const DIAS = 86_400_000;

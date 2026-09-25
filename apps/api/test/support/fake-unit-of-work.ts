import type { UnitOfWork } from '../../src/core/domain/unit-of-work';

// En unitarias el UnitOfWork ejecuta la función directamente;
// el rollback real se prueba en integración (CLAUDE.md §6.2).
export class FakeUnitOfWork implements UnitOfWork {
  run<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}

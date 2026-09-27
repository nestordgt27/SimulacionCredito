import { leerPagina, paginar } from './paginacion';

const numeros = (cantidad: number) => Array.from({ length: cantidad }, (_, indice) => indice + 1);

describe('paginar', () => {
  it('debe devolver los primeros elementos en la página 1', () => {
    expect(paginar(numeros(12), 1, 5)).toEqual({
      elementos: [1, 2, 3, 4, 5],
      paginaActual: 1,
      totalPaginas: 3,
      totalElementos: 12,
      desde: 1,
      hasta: 5,
    });
  });

  it('debe devolver una última página incompleta', () => {
    expect(paginar(numeros(12), 3, 5)).toMatchObject({
      elementos: [11, 12],
      desde: 11,
      hasta: 12,
    });
  });

  it('debe tener una sola página cuando hay exactamente 5 elementos', () => {
    expect(paginar(numeros(5), 1, 5)).toMatchObject({ totalPaginas: 1, hasta: 5 });
  });

  it('debe tener dos páginas cuando hay 6 elementos', () => {
    expect(paginar(numeros(6), 2, 5)).toMatchObject({ elementos: [6], totalPaginas: 2 });
  });

  it.each([
    [0, 1],
    [-3, 1],
    [99, 3],
  ])('debe ajustar la página %p a la página %p', (pedida, ajustada) => {
    expect(paginar(numeros(12), pedida, 5).paginaActual).toBe(ajustada);
  });

  it('debe tener una página vacía cuando no hay elementos', () => {
    expect(paginar([], 1, 5)).toEqual({
      elementos: [],
      paginaActual: 1,
      totalPaginas: 1,
      totalElementos: 0,
      desde: 0,
      hasta: 0,
    });
  });
});

describe('leerPagina', () => {
  it.each([
    ['2', 2],
    [null, 1],
    ['', 1],
    ['abc', 1],
    ['0', 1],
    ['-1', 1],
    ['1.5', 1],
  ])('debe interpretar %p como la página %p', (valor, pagina) => {
    expect(leerPagina(valor)).toBe(pagina);
  });
});

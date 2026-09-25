import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// HTTP mockeado con MSW, no hooks ni Axios (CLAUDE.md §6.2).
export const server = setupServer(...handlers);

import { Outlet } from 'react-router';

export function AppLayout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>Simulación de Crédito</h1>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

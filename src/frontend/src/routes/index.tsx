import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AppLayout } from '../components/layout/AppLayout';
import { AdminPage } from '../pages/AdminPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EventsPage } from '../pages/EventsPage';
import { FleetPage } from '../pages/FleetPage';
import { HistoryPage } from '../pages/HistoryPage';
import { LoginPage } from '../pages/LoginPage';
import { NewAccessPage } from '../pages/NewAccessPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { OpenAccessPage } from '../pages/OpenAccessPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to="/login" />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/visao-geral', element: <DashboardPage /> },
      { path: '/acessos/novo', element: <NewAccessPage /> },
      { path: '/acessos/abertos', element: <OpenAccessPage /> },
      { path: '/acessos/historico', element: <HistoryPage /> },
      { path: '/frota', element: <FleetPage /> },
      { path: '/eventos', element: <EventsPage /> },
      { path: '/administracao', element: <AdminPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

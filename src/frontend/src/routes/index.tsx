import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";
import { AdminPage } from "../pages/AdminPage";
import { DashboardPage } from "../pages/DashboardPage";
import { EventsPage } from "../pages/EventsPage";
import { FleetPage } from "../pages/FleetPage";
import { HistoryPage } from "../pages/HistoryPage";
import { InstitutionalDriversPage } from "../pages/InstitutionalDriversPage";
import { InstitutionalUsagesPage } from "../pages/InstitutionalUsagesPage";
import { LoginPage } from "../pages/LoginPage";
import { NewAccessPage } from "../pages/NewAccessPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { OpenAccessPage } from "../pages/OpenAccessPage";
import { ProfileRoute } from "./ProfileRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { RouteTransitionManager } from "./RouteTransitionManager";

export const router = createBrowserRouter([
  {
    element: <RouteTransitionManager />,
    children: [
      {
        path: "/",
        element: <Navigate replace to="/login" />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                element: <ProfileRoute />,
                children: [
                  { path: "/visao-geral", element: <DashboardPage /> },
                  { path: "/acessos/novo", element: <NewAccessPage /> },
                  { path: "/acessos/abertos", element: <OpenAccessPage /> },
                  { path: "/acessos/historico", element: <HistoryPage /> },
                  {
                    path: "/utilizacoes-institucionais",
                    element: <InstitutionalUsagesPage />,
                  },
                  { path: "/frota", element: <FleetPage /> },
                  {
                    path: "/motoristas-institucionais",
                    element: <InstitutionalDriversPage />,
                  },
                  { path: "/eventos", element: <EventsPage /> },
                  { path: "/administracao", element: <AdminPage /> },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

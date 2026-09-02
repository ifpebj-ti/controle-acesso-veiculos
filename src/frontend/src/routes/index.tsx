import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";
import { AdminPage } from "../pages/AdminPage";
import { DashboardPage } from "../pages/DashboardPage";
import { EventsPage } from "../pages/EventsPage";
import { FleetPage } from "../pages/FleetPage";
import { HistoryPage } from "../pages/HistoryPage";
import { LoginPage } from "../pages/LoginPage";
import { NewAccessPage } from "../pages/NewAccessPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { OpenAccessPage } from "../pages/OpenAccessPage";
import { ProfileRoute } from "./ProfileRoute";
import { ProtectedRoute } from "./ProtectedRoute";

const allProfiles = [
  "Porteiro",
  "Vigilante",
  "SetorTransporte",
  "Administrador",
] as const;

const operationalProfiles = ["Porteiro", "Vigilante", "Administrador"] as const;

export const router = createBrowserRouter([
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
          { path: "/visao-geral", element: <DashboardPage /> },
          {
            element: <ProfileRoute allowedProfiles={operationalProfiles} />,
            children: [
              { path: "/acessos/novo", element: <NewAccessPage /> },
              { path: "/acessos/abertos", element: <OpenAccessPage /> },
            ],
          },
          {
            element: <ProfileRoute allowedProfiles={allProfiles} />,
            children: [
              { path: "/acessos/historico", element: <HistoryPage /> },
              { path: "/frota", element: <FleetPage /> },
              { path: "/eventos", element: <EventsPage /> },
            ],
          },
          {
            element: <ProfileRoute allowedProfiles={["Administrador"]} />,
            children: [{ path: "/administracao", element: <AdminPage /> }],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

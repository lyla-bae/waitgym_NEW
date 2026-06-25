import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuthStore } from "@/stores/authStore";
import { useWorkoutStore } from "@/stores/workoutStore";
import Layout from "@/components/Layout";

function ProtectedRoute() {
  const { session, isLoading } = useAuthStore();
  if (isLoading)
    return (
      <div className="page-loader">
        <CircularProgress size={32} sx={{ color: "#98c1d9" }} />
      </div>
    );
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function WorkoutRoute() {
  const { waitingId } = useWorkoutStore();
  if (!waitingId)
    return <Navigate to="/reservation/select-equipment" replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: "/login",
    lazy: async () => {
      const { default: Component } = await import("@/pages/Login");
      return { Component };
    },
  },
  {
    path: "*",
    lazy: async () => {
      const { default: Component } = await import("@/pages/NotFound");
      return { Component };
    },
  },
  {
    path: "/auth/callback",
    lazy: async () => {
      const { default: Component } = await import("@/pages/AuthCallback");
      return { Component };
    },
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: "/",
            lazy: async () => {
              const { default: Component } = await import("@/pages/Home");
              return { Component };
            },
          },
          {
            path: "/equipment/:id",
            lazy: async () => {
              const { default: Component } =
                await import("@/pages/EquipmentDetail");
              return { Component };
            },
          },
          {
            path: "/waiting/:id",
            lazy: async () => {
              const { default: Component } = await import("@/pages/Waiting");
              return { Component };
            },
          },
          {
            path: "/mission",
            lazy: async () => {
              const { default: Component } = await import("@/pages/Mission");
              return { Component };
            },
          },
          {
            path: "/routine/new",
            lazy: async () => {
              const { default: Component } =
                await import("@/pages/RoutineEdit");
              return { Component };
            },
          },
          {
            path: "/routine/:id/edit",
            lazy: async () => {
              const { default: Component } =
                await import("@/pages/RoutineEdit");
              return { Component };
            },
          },
          {
            path: "/routine/select-equipment",
            lazy: async () => {
              const { default: Component } =
                await import("@/pages/RoutineSelectEquipment");
              return { Component };
            },
          },
          {
            path: "/mypage",
            lazy: async () => {
              const { default: Component } = await import("@/pages/MyPage");
              return { Component };
            },
          },
          {
            path: "/mypage/profile",
            lazy: async () => {
              const { default: Component } = await import("@/pages/Profile");
              return { Component };
            },
          },
          {
            path: "/mypage/favorites",
            lazy: async () => {
              const { default: Component } = await import("@/pages/Favorites");
              return { Component };
            },
          },
          {
            path: "/notifications",
            lazy: async () => {
              const { default: Component } =
                await import("@/pages/Notification");
              return { Component };
            },
          },
          {
            path: "/reservation/select-equipment",
            lazy: async () => {
              const { default: Component } =
                await import("@/pages/SelectEquipment");
              return { Component };
            },
          },
          {
            path: "/reservation/goal-setting",
            lazy: async () => {
              const { default: Component } =
                await import("@/pages/GoalSetting");
              return { Component };
            },
          },
          {
            path: "/reservation/wait-request",
            lazy: async () => {
              const { default: Component } =
                await import("@/pages/WaitRequest");
              return { Component };
            },
          },
          {
            element: <WorkoutRoute />,
            children: [
              {
                path: "/workout/exercising",
                lazy: async () => {
                  const { default: Component } =
                    await import("@/pages/Exercising");
                  return { Component };
                },
              },
              {
                path: "/workout/complete",
                lazy: async () => {
                  const { default: Component } =
                    await import("@/pages/Complete");
                  return { Component };
                },
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  GetStarted,
  UserLogin,
  RiderLogin,
  UserHomeScreen,
  UserIndex,
  UserRoutes,
  RiderHomeScreen,
  UserProtectedWrapper,
  RiderProtectedWrapper,
  AdminProtectedWrapper,
  UserSignup,
  RiderSignup,
  RideHistory,
  UserEditProfile,
  RiderEditProfile,
  AdminHome,
  AdminLayout,
  AdminUsers,
  AdminRoutes,
  AdminMetrics,
  AdminFares,
  AdminDriverApprovals,
  RoleSelect,
  Error,
  ChatScreen,
  VerifyEmail,
  ResetPassword,
  ForgotPassword,
  RideShare,
} from "./screens/";
import { logger } from "./utils/logger";
import { SocketDataContext } from "./contexts/SocketContext";
import { useEffect, useContext, useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { ConfirmModal } from "./components";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<MobileApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

function AdminApp() {
  useEffect(() => {
    document.body.classList.add("admin-mode");
    return () => document.body.classList.remove("admin-mode");
  }, []);

  return (
    <div className="w-full min-h-dvh bg-zinc-100">
      <LoggingWrapper />
      <Routes>
        <Route
          path="/"
          element={
            <AdminProtectedWrapper>
              <AdminLayout />
            </AdminProtectedWrapper>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="driver-approvals" element={<AdminDriverApprovals />} />
          <Route path="routes" element={<AdminRoutes />} />
          <Route path="metrics" element={<AdminMetrics />} />
          <Route path="fares" element={<AdminFares />} />
        </Route>
        <Route path="home" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
}

function MobileApp() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const syncTheme = () => {
      const isDark = localStorage.getItem("homeTheme") === "dark";
      document.body.classList.toggle("home-theme-dark", isDark);
    };

    syncTheme();
    window.addEventListener("home-theme-change", syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener("home-theme-change", syncTheme);
      window.removeEventListener("storage", syncTheme);
      document.body.classList.remove("home-theme-dark");
    };
  }, []);

  useEffect(() => {
    const isDark = localStorage.getItem("homeTheme") === "dark";
    document.body.classList.toggle("home-theme-dark", isDark);
  }, [location.pathname]);

  const confirmReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const getAuthInfo = () => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("userData") || "null");
    return { token, type: userData?.type };
  };

  const redirectByRole = (type) => {
    if (type === "user") return "/user/home";
    if (type === "rider") return "/rider/home";
    if (type === "admin") return "/admin";
    return "/";
  };

  const PublicOnly = ({ children }) => {
    const { token, type } = getAuthInfo();
    if (token && type) {
      return <Navigate to={redirectByRole(type)} replace />;
    }
    return children;
  };

  const RequireUserType = ({ type, children }) => {
    const auth = getAuthInfo();
    if (!auth.token || auth.type !== type) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <div className="w-full h-dvh flex items-center">
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reiniciar app"
        message="Esto limpiará todos tus datos y cerrará tu sesión para arreglar la app en caso de corrupción. ¿Deseas continuar?"
        confirmText="Reiniciar"
        cancelText="Cancelar"
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
      <div className="relative w-full sm:min-w-96 sm:w-96 h-full bg-white overflow-hidden">
        {/* Force Reset Button to clear data */}
        <div className="absolute top-36 -right-11 opacity-20 hover:opacity-100 z-50 flex items-center p-1 PL-0 gap-1 bg-zinc-50 border-2 border-r-0 border-gray-300 hover:-translate-x-11 rounded-l-md transition-all duration-300">
          <ChevronLeft />
          <button
            className="flex justify-center items-center w-10 h-10 rounded-lg border-2 border-red-300 bg-red-200 text-red-500"
            onClick={() => setShowResetConfirm(true)}
          >
            <Trash2 strokeWidth={1.8} width={18} />
          </button>
        </div>

        <div className="flex flex-col h-full overflow-auto">
          <LoggingWrapper />
          <Routes>
            <Route path="/" element={<GetStarted />} />
            <Route
              path="/user/home"
              element={
                <UserProtectedWrapper>
                  <UserHomeScreen />
                </UserProtectedWrapper>
              }
            />
            <Route
              path="/user/index"
              element={
                <UserProtectedWrapper>
                  <UserIndex />
                </UserProtectedWrapper>
              }
            />
          <Route
            path="/login"
            element={
              <PublicOnly>
                <UserLogin />
              </PublicOnly>
            }
          />
          <Route path="/choose-role" element={<RoleSelect />} />
          <Route
            path="/rider/login"
            element={
              <PublicOnly>
                <RiderLogin />
              </PublicOnly>
            }
          />
          <Route
            path="/admin/login"
            element={
              <PublicOnly>
                <UserLogin />
              </PublicOnly>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnly>
                <UserSignup />
              </PublicOnly>
            }
          />
          <Route
            path="/rider/signup"
            element={
              <RequireUserType type="user">
                <RiderSignup />
              </RequireUserType>
            }
          />
            <Route
              path="/user/edit-profile"
              element={
                <UserProtectedWrapper>
                  <UserEditProfile />
                </UserProtectedWrapper>
              }
            />
            <Route
              path="/user/rides"
              element={
                <UserProtectedWrapper>
                  <RideHistory />
                </UserProtectedWrapper>
              }
            />
            <Route
              path="/user/routes"
              element={
                <UserProtectedWrapper>
                  <UserRoutes />
                </UserProtectedWrapper>
              }
            />

            <Route
              path="/rider/home"
              element={
                <RiderProtectedWrapper>
                  <RiderHomeScreen />
                </RiderProtectedWrapper>
              }
            />
            <Route
              path="/rider/edit-profile"
              element={
                <RiderProtectedWrapper>
                  <RiderEditProfile />
                </RiderProtectedWrapper>
              }
            />
            <Route
              path="/rider/rides"
              element={
                <RiderProtectedWrapper>
                  <RideHistory />
                </RiderProtectedWrapper>
              }
            />

            <Route path="/:userType/chat/:rideId" element={<ChatScreen />} />
            <Route path="/ride/share/:rideId" element={<RideShare />} />
            <Route path="/:userType/verify-email/" element={<VerifyEmail />} />
            <Route path="/:userType/forgot-password/" element={<ForgotPassword />} />
            <Route path="/:userType/reset-password/" element={<ResetPassword />} />

            <Route path="*" element={<Error />} />
          </Routes>
          {location.pathname !== "/user/home" &&
            location.pathname !== "/rider/home" && (
              location.pathname === "/" ? (
                <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-zinc-400 pointer-events-none mt-2">
                  Colibri · 2026 · Arroyo Seco, Querétaro
                </div>
              ) : (
                <div className="text-center text-xs text-zinc-400 py-3 bg-transparent">
                  Colibri · 2026 · Arroyo Seco, Querétaro
                </div>
              )
            )}
        </div>
      </div>
      <div className="hidden sm:block w-full h-full bg-[#eae1fe] overflow-hidden  select-none border-l-2 border-black">
        <img
          className="h-full object-cover mx-auto  select-none "
          src="https://img.freepik.com/free-vector/taxi-app-service-concept_23-2148497472.jpg?semt=ais_hybrid"
          alt="Side image"
        />
      </div>
    </div>
  );
}

function LoggingWrapper() {
  const location = useLocation();
  const { socket } = useContext(SocketDataContext);

  useEffect(() => {
    if (socket) {
      logger(socket);
    }
  }, [location.pathname, location.search, socket]);
  return null;
}



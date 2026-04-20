import { NavLink, Outlet, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Usuarios", path: "/admin/users" },
  { label: "Validación de conductores", path: "/admin/driver-approvals" },
  { label: "Rutas", path: "/admin/routes" },
  { label: "Métricas", path: "/admin/metrics" },
  { label: "Tarifas", path: "/admin/fares" },
];

function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    navigate("/");
  };

  return (
    <div className="w-full h-dvh flex bg-zinc-100">
      <aside className="w-56 shrink-0 border-r bg-white p-4 flex flex-col">
        <button
          className="mb-6 text-left"
          onClick={() => navigate("/admin")}
        >
          <h1 className="text-lg font-bold">Admin</h1>
          <p className="text-xs text-zinc-500">Panel de control</p>
        </button>
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm ${
                  isActive
                    ? "bg-black text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="pt-4 border-t">
          <button
            className="w-full px-3 py-2 rounded text-sm bg-red-600 text-white"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        <div className="text-center text-xs text-zinc-400 py-3">
          Colibri · 2026 · Arroyo Seco, Querétaro
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;

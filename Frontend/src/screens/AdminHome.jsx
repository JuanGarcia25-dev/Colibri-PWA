import { Button } from "../components";
import { useNavigate } from "react-router-dom";

function AdminHome() {
  const navigate = useNavigate();
  const userData = localStorage.getItem("userData");
  const adminName = userData
    ? `${JSON.parse(userData).data?.fullname?.firstname || ""} ${
        JSON.parse(userData).data?.fullname?.lastname || ""
      }`.trim()
    : "";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Panel de Administración</h1>
      <p className="text-sm text-zinc-600 mb-2">
        {adminName ? `Hola, ${adminName}` : "Bienvenido"}
      </p>
      <p className="text-sm text-zinc-600 mb-6">
        Selecciona una sección para comenzar.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold">Usuarios</h3>
          <p className="text-sm text-zinc-600 mb-3">Gestion de Usuarios</p>
          <Button title="Ir" fun={() => navigate("/admin/users")} />
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold">Validación de conductores</h3>
          <p className="text-sm text-zinc-600 mb-3">Revisa y aprueba solicitudes de nuevos conductores.</p>
          <Button title="Ir" fun={() => navigate("/admin/driver-approvals")} />
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold">Rutas</h3>
          <p className="text-sm text-zinc-600 mb-3">Contenido de rutas.</p>
          <Button title="Ir" fun={() => navigate("/admin/routes")} />
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold">Métricas</h3>
          <p className="text-sm text-zinc-600 mb-3">Uso y ganancias.</p>
          <Button title="Ir" fun={() => navigate("/admin/metrics")} />
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold">Tarifas</h3>
          <p className="text-sm text-zinc-600 mb-3">Configuración base.</p>
          <Button title="Ir" fun={() => navigate("/admin/fares")} />
        </div>
      </div>
    </div>
  );
}

export default AdminHome;

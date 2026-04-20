import { useEffect, useState } from "react";
import axios from "axios";

function AdminMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const load = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/admin/metrics`,
        { headers: { token } }
      );
      setMetrics(response.data.totals);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar métricas");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Métricas</h1>
      <p className="text-sm text-zinc-600 mb-6">Uso y ganancias.</p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {!metrics ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm text-zinc-500">Usuarios</h3>
            <div className="text-2xl font-bold">{metrics.users}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm text-zinc-500">Conductores</h3>
            <div className="text-2xl font-bold">{metrics.riders}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm text-zinc-500">Viajes hoy</h3>
            <div className="text-2xl font-bold">{metrics.ridesToday}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm text-zinc-500">Viajes completados</h3>
            <div className="text-2xl font-bold">{metrics.completedRides}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm text-zinc-500">Ingresos estimados</h3>
            <div className="text-2xl font-bold">$ {metrics.revenue}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMetrics;

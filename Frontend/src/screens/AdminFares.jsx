import { useEffect, useState } from "react";
import axios from "axios";

const defaultRows = [
  { vehicleType: "car", label: "Auto" },
  { vehicleType: "truck", label: "Camioneta" },
];

const fallbackRates = {
  car: { baseFare: 30, perKmRate: 10, perMinuteRate: 2 },
  truck: { baseFare: 30, perKmRate: 5, perMinuteRate: 1 },
};

function AdminFares() {
  const [rows, setRows] = useState(defaultRows);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const loadFares = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/admin/fares`,
        { headers: { token } }
      );
      const serverFares = response.data.fares || [];

      const merged = defaultRows.map((row) => {
        const found =
          serverFares.find((f) => f.vehicleType === row.vehicleType) ||
          (row.vehicleType === "car"
            ? serverFares.find((f) => f.vehicleType === "auto")
            : serverFares.find((f) => f.vehicleType === "car"));
        const fallback = fallbackRates[row.vehicleType];
        return {
          ...row,
          baseFare: found?.baseFare ?? fallback?.baseFare ?? "",
          perKmRate: found?.perKmRate ?? fallback?.perKmRate ?? "",
          perMinuteRate: found?.perMinuteRate ?? fallback?.perMinuteRate ?? "",
        };
      });
      setRows(merged);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar tarifas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFares();
  }, []);

  const validateNumber = (value) => {
    if (value === "") return true;
    const num = parseFloat(value);
    // Rechaza NaN, números <= 0, y notación científica (que contiene 'e')
    return !isNaN(num) && num > 0 && !value.toLowerCase().includes('e');
  };

  const updateRow = (idx, field, value) => {
    // Bloquea cualquier intento de escribir caracteres no numéricos o símbolos
    const sanitized = value.replace(/[^\d.]/g, '');
    
    if (sanitized && !validateNumber(sanitized)) {
      setError("Solo números positivos (mayores a 0). No se permiten símbolos ni notación científica");
      return;
    }
    setError("");
    const next = [...rows];
    next[idx] = { ...next[idx], [field]: sanitized };
    setRows(next);
  };

  const validateAllRows = () => {
    for (let row of rows) {
      if (row.baseFare === "" || row.perKmRate === "" || row.perMinuteRate === "") {
        setError("Todos los campos son requeridos");
        return false;
      }
      const baseFare = parseFloat(row.baseFare);
      const perKmRate = parseFloat(row.perKmRate);
      const perMinuteRate = parseFloat(row.perMinuteRate);

      if (isNaN(baseFare) || isNaN(perKmRate) || isNaN(perMinuteRate)) {
        setError("Solo se permiten números válidos");
        return false;
      }
      if (baseFare <= 0 || perKmRate <= 0 || perMinuteRate <= 0) {
        setError("Los valores deben ser mayores a 0");
        return false;
      }
    }
    return true;
  };

  const save = async () => {
    if (!validateAllRows()) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/admin/fares`,
        { fares: rows },
        { headers: { token } }
      );
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar tarifas");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Tarifas Base</h1>
      <p className="text-sm text-zinc-600 mb-6">
        Configura tarifas por tipo de vehículo.
      </p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm font-semibold mb-2">
            <div>Tipo</div>
            <div>Base</div>
            <div>Por km</div>
            <div>Por minuto</div>
          </div>
          {rows.map((row, idx) => (
            <div key={row.vehicleType} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
              <div className="text-sm font-semibold">{row.label}</div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="pl-6 pr-3 py-2 border rounded w-full"
                  placeholder="0.00"
                  value={row.baseFare}
                  onChange={(e) => updateRow(idx, "baseFare", e.target.value)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="pl-6 pr-3 py-2 border rounded w-full"
                  placeholder="0.00"
                  value={row.perKmRate}
                  onChange={(e) => updateRow(idx, "perKmRate", e.target.value)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="pl-6 pr-3 py-2 border rounded w-full"
                  placeholder="0.00"
                  value={row.perMinuteRate}
                  onChange={(e) => updateRow(idx, "perMinuteRate", e.target.value)}
                />
              </div>
            </div>
          ))}
          <button
            className="mt-2 px-4 py-2 bg-black text-white rounded text-sm"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminFares;

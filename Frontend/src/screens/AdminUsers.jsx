import { useEffect, useState, useRef } from "react";
import axios from "axios";

const roleOptions = [
  { label: "Todos", value: "all" },
  { label: "Usuarios", value: "user" },
  { label: "Conductores", value: "rider" },
  { label: "Admins", value: "admin" },
];

const roleLabels = {
  user: "Usuario",
  rider: "Conductor",
  admin: "Administrador",
};

function AdminUsers() {
  const [role, setRole] = useState("all");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceTimer = useRef(null);
  const token = localStorage.getItem("token");

  const fetchUsers = async (searchQuery = query, searchRole = role) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/admin/users?role=${searchRole}&q=${encodeURIComponent(searchQuery)}`,
        { headers: { token } }
      );
      const sortedUsers = (response.data.users || []).slice().sort((a, b) => {
        const nameA = `${a.fullname?.firstname || ""} ${a.fullname?.lastname || ""}`.toLowerCase();
        const nameB = `${b.fullname?.firstname || ""} ${b.fullname?.lastname || ""}`.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      setUsers(sortedUsers);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers("", role);
  }, [role]);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchUsers(query, role);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const toggleBlock = async (user) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/admin/users/${user._id}/block`,
        { role: user.role || role, blocked: !user.blocked },
        { headers: { token } }
      );
      fetchUsers(query, role);
    } catch (err) {
      setError(err.response?.data?.message || "Error al actualizar usuario");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Usuarios</h1>
      <p className="text-sm text-zinc-600 mb-6">CRUD de usuarios por rol.</p>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {roleOptions.map((opt) => (
              <button
                key={opt.value}
                className={`px-3 py-2 text-sm rounded ${
                  role === opt.value ? "bg-black text-white" : "bg-zinc-100"
                }`}
                onClick={() => setRole(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            className="px-3 py-2 text-sm border rounded w-full sm:w-64 sm:ml-auto"
            placeholder="Buscar por email, nombre o teléfono..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {loading ? (
          <p className="text-sm text-zinc-500">Cargando...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay resultados.</p>
        ) : (
          <div className="divide-y">
            {users.map((u) => (
              <div key={u._id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {u.fullname?.firstname} {u.fullname?.lastname}
                  </div>
                  <div className="text-sm text-zinc-600">{u.email}</div>
                  {u.phone && <div className="text-sm text-zinc-600">{u.phone}</div>}
                  <div className="text-xs text-zinc-500">
                    {roleLabels[u.role || role] || u.role}
                  </div>
                </div>
                <button
                  className={`px-3 py-2 text-sm rounded ${
                    u.blocked ? "bg-green-600 text-white" : "bg-red-600 text-white"
                  }`}
                  onClick={() => toggleBlock(u)}
                >
                  {u.blocked ? "Desbloquear" : "Bloquear"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;

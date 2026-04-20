import { Button } from "../components";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../contexts/UserContext";

export default function UserIndex() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [driverStatus, setDriverStatus] = useState(user?.driverStatus || "none");

  useEffect(() => {
    setDriverStatus(user?.driverStatus || "none");
  }, [user?.driverStatus]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/user/profile`, {
        headers: { token },
      })
      .then((response) => {
        if (response.status === 200) {
          const userData = response.data.user;
          setUser(userData);
          localStorage.setItem(
            "userData",
            JSON.stringify({ type: "user", data: userData })
          );
          setDriverStatus(userData.driverStatus || "none");
        }
      })
      .catch(() => {});
  }, [setUser]);

  const showDriverCTA = driverStatus !== "pending" && driverStatus !== "approved";

  return (
    <div className="w-full h-dvh flex flex-col justify-start p-6 gap-6">
      <h1 className="text-2xl font-bold">Bienvenido</h1>

      <div className="flex flex-col gap-4">
        <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4">
          <img
            src="/pv.png"
            alt="opcion"
            className="w-16 h-16 object-cover rounded"
          />
          <div>
            <h2 className="font-semibold mb-2">Buscar viaje</h2>
            <p className="text-sm text-gray-500 mb-4">
              Usa el buscador para indicar tu punto de recogida y destino.
            </p>
            <Button title={"Ir al Mapa"} type={"button"} fun={() => navigate("/user/home")} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4">
          <img
            src="/rutas.png"
            alt="opcion"
            className="w-16 h-16 object-cover rounded"
          />
          <div>
            <h2 className="font-semibold mb-2">Rutas</h2>
            <p className="text-sm text-gray-500">Ve las rutas colecctivas disponibles.</p>
            <Button title={"Ver rutas"} type={"button"} fun={() => navigate("/user/routes")} />
          </div>
        </div>

        {showDriverCTA && (
          <div
            className="p-4 bg-white rounded-lg shadow flex items-center gap-4 cursor-pointer"
            onClick={() => navigate("/rider/signup")}
          >
            <img
              src="/bedriver.png"
              alt="opcion"
              className="w-16 h-16 object-cover rounded"
            />

            <div>
              <h2 className="font-semibold mb-1">Sé Conductor</h2>
              <p className="text-sm text-gray-500">
                Si estas interesado en trabajar con nosotros, registra tus datos.
              </p>
            </div>
          </div>
        )}

        {driverStatus === "pending" && (
          <div className="p-4 bg-yellow-50 rounded-lg shadow flex items-center gap-4">
            <img
              src="/bedriver.png"
              alt="opcion"
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <h2 className="font-semibold mb-1">Solicitud enviada</h2>
              <p className="text-sm text-gray-500">
                Tu solicitud está en revisión. Te avisaremos cuando sea aprobada.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

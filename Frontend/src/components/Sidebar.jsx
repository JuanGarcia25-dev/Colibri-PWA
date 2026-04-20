import { useEffect, useState } from "react";
import {
  ChevronRight,
  CircleUserRound,
  History,
  KeyRound,
  Menu,
  X,
  Repeat,
  Map,
  Moon,
  Sun,
} from "lucide-react";
import Button from "./Button";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Console from "../utils/console";

function Sidebar({ homeThemeEnabled = false, isDarkMode = false, onToggleDarkMode }) {
  const token = localStorage.getItem("token");
  const [showSidebar, setShowSidebar] = useState(false);
  const [newUser, setNewUser] = useState({});
  const [linkedRoles, setLinkedRoles] = useState(null);
  const driverStatus = newUser?.data?.driverStatus || "none";
  const currentType = newUser?.type || "user";

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    setNewUser(userData);
    const linked = JSON.parse(localStorage.getItem("linkedRoles"));
    setLinkedRoles(linked);
  }, []);

  useEffect(() => {
    if (showSidebar) {
      const userData = JSON.parse(localStorage.getItem("userData"));
      setNewUser(userData);
      const linked = JSON.parse(localStorage.getItem("linkedRoles"));
      setLinkedRoles(linked);

      if (userData?.type === "user" && token) {
        axios
          .get(`${import.meta.env.VITE_SERVER_URL}/user/profile`, {
            headers: { token },
          })
          .then((response) => {
            if (response.status === 200) {
              const updated = { type: "user", data: response.data.user };
              setNewUser(updated);
              localStorage.setItem("userData", JSON.stringify(updated));
            }
          })
          .catch(() => {});
      }
    }
  }, [showSidebar]);

  const navigate = useNavigate();

  const logout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_SERVER_URL}/${newUser.type}/logout`, {
        headers: {
          token: token,
        },
      });

      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("messages");
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
      localStorage.removeItem("showPanel");
      localStorage.removeItem("showBtn");
      localStorage.removeItem("linkedRoles");
      navigate("/");
    } catch (error) {
      Console.log("Error al cerrar sesion", error);
    }
  };

  const switchRole = () => {
    if (!linkedRoles?.tokens || !linkedRoles?.data) return;
    const nextType = currentType === "user" ? "rider" : "user";
    const nextToken = linkedRoles.tokens?.[nextType];
    const data = linkedRoles.data?.[nextType];

    if (!nextToken || !data) return;

    localStorage.setItem("token", nextToken);
    localStorage.setItem(
      "userData",
      JSON.stringify({
        type: nextType,
        data,
      })
    );
    setNewUser({ type: nextType, data });
    setShowSidebar(false);

    if (nextType === "user") navigate("/user/home");
    if (nextType === "rider") navigate("/rider/home");
  };

  const isLinkedForCurrent =
    linkedRoles?.data?.user?.email &&
    linkedRoles?.data?.rider?.email &&
    linkedRoles.data.user.email === linkedRoles.data.rider.email &&
    newUser?.data?.email &&
    newUser.data.email === linkedRoles.data.user.email;

  const canSwitch =
    isLinkedForCurrent &&
    linkedRoles?.tokens?.user &&
    linkedRoles?.tokens?.rider &&
    linkedRoles?.data?.user &&
    linkedRoles?.data?.rider;

  const showDriverCTA =
    currentType === "user" &&
    driverStatus !== "pending" &&
    driverStatus !== "approved";
  const showDriverPending = currentType === "user" && driverStatus === "pending";

  const toggleHomeTheme = () => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
      return;
    }

    const current = localStorage.getItem("homeTheme") || "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("homeTheme", next);
    window.dispatchEvent(new CustomEvent("home-theme-change", { detail: { theme: next } }));
  };

  return (
    <>
      {!showSidebar && (
        <div
          className="home-sidebar-trigger m-3 mt-4 absolute right-0 top-0 z-20 cursor-pointer bg-white p-1 rounded"
          onClick={() => {
            setShowSidebar(true);
          }}
        >
          <Menu />
        </div>
      )}

      <div
        className={`home-sidebar ${showSidebar ? " left-0 " : " -left-[100%] "} z-50 duration-300 absolute w-full h-dvh top-0 bottom-0 bg-white p-4 pt-5 flex flex-col justify-between`}
      >
        <div className="select-none relative">
          <button
            type="button"
            onClick={() => setShowSidebar(false)}
            onPointerDown={(e) => {
              e.preventDefault();
              setShowSidebar(false);
            }}
            className="absolute top-1 right-1 p-1 rounded hover:bg-zinc-100 z-10"
            aria-label="Cerrar"
          >
            <X />
          </button>
          <h1 className="relative text-2xl font-semibold ">
            {currentType === "rider" ? "Conductor" : "Usuario"}
          </h1>
          {canSwitch && (
            <button
              type="button"
              onClick={switchRole}
              className="mt-3 w-full flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-100 rounded-xl px-3 border border-zinc-200"
            >
              <div className="flex gap-3 items-center">
                <Repeat />
                <h1 className="text-sm font-semibold">
                  Cambiar a {currentType === "user" ? "Conductor" : "Usuario"}
                </h1>
              </div>
              <div>
                <ChevronRight />
              </div>
            </button>
          )}

          {homeThemeEnabled && (
            <button
              type="button"
              onClick={toggleHomeTheme}
              className="mt-3 w-full flex items-center justify-between py-3 cursor-pointer hover:bg-zinc-100 rounded-xl px-3 border border-zinc-200"
            >
              <div className="flex gap-3 items-center">
                {isDarkMode ? <Sun /> : <Moon />}
                <h1 className="text-sm font-semibold">
                  {isDarkMode ? "Modo claro" : "Modo oscuro"}
                </h1>
              </div>
              <div>
                <ChevronRight />
              </div>
            </button>
          )}

          <div className="leading-3 mt-8 mb-4">
            <div className="my-2 rounded-full w-24 h-24 bg-blue-400 mx-auto flex items-center justify-center overflow-hidden">
              {newUser?.data?.profilephoto ? (
                <img
                  src={newUser?.data?.profilephoto}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <h1 className="text-5xl text-white">
                  {newUser?.data?.fullname?.firstname[0]}
                  {newUser?.data?.fullname?.lastname[0]}
                </h1>
              )}
            </div>
            <h1 className=" text-center font-semibold text-2xl">
              {newUser?.data?.fullname?.firstname}{" "}
              {newUser?.data?.fullname?.lastname}
            </h1>
            <h1 className="mt-1 text-center text-zinc-400 ">{newUser?.data?.email}</h1>
          </div>

          <div className="mb-2">
            {currentType === "user" && (
              <button
                type="button"
                onClick={() => {
                  setShowSidebar(false);
                  navigate("/user/routes");
                }}
                className="w-full flex items-center justify-between py-4 cursor-pointer hover:bg-zinc-100 rounded-xl px-3 text-zinc-700"
              >
                <div className="flex gap-3">
                  <Map />
                  <h1>Rutas</h1>
                </div>
                <div>
                  <ChevronRight />
                </div>
              </button>
            )}

            {showDriverCTA && (
              <button
                type="button"
                onClick={() => {
                  setShowSidebar(false);
                  navigate("/rider/signup");
                }}
                className="w-full flex items-center justify-between py-4 cursor-pointer hover:bg-zinc-100 rounded-xl px-3"
              >
                <div className="flex gap-3">
                  <CircleUserRound />
                  <h1>Se Conductor</h1>
                </div>
                <div>
                  <ChevronRight />
                </div>
              </button>
            )}

            {showDriverPending && (
              <div className="w-full flex items-center justify-between py-4 rounded-xl px-3 bg-yellow-50">
                <div className="flex gap-3">
                  <CircleUserRound />
                  <div>
                    <h1 className="font-semibold">Solicitud enviada</h1>
                    <p className="text-xs text-zinc-600">Tu solicitud esta en revision.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            to={`/${newUser?.type}/edit-profile`}
            className="flex items-center justify-between py-4 cursor-pointer hover:bg-zinc-100 rounded-xl px-3"
          >
            <div className="flex gap-3">
              <CircleUserRound /> <h1>Perfil</h1>
            </div>
            <div>
              <ChevronRight />
            </div>
          </Link>

          <Link
            to={`/${newUser?.type}/rides`}
            className="flex items-center justify-between py-4 cursor-pointer hover:bg-zinc-100 rounded-xl px-3"
          >
            <div className="flex gap-3">
              <History /> <h1>Historial de viajes</h1>
            </div>
            <div>
              <ChevronRight />
            </div>
          </Link>

          <Link
            to={`/${newUser?.type}/reset-password?token=${token}`}
            className="flex items-center justify-between py-4 cursor-pointer hover:bg-zinc-100 rounded-xl px-3"
          >
            <div className="flex gap-3">
              <KeyRound /> <h1>Cambiar contrasena</h1>
            </div>
            <div>
              <ChevronRight />
            </div>
          </Link>
        </div>

        <Button title={"Cerrar sesion"} classes={"bg-red-600"} fun={logout} />
      </div>
    </>
  );
}

export default Sidebar;

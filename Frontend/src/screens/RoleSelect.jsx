import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heading } from "../components";

function RoleSelect() {
  const navigate = useNavigate();
  const pending = localStorage.getItem("pendingRole");
  const parsed = pending ? JSON.parse(pending) : null;

  useEffect(() => {
    if (!parsed) {
      navigate("/login");
    }
  }, [parsed, navigate]);

  if (!parsed) return null;

  const chooseRole = (role) => {
    const token = parsed.tokens?.[role];
    const data = parsed.data?.[role];

    if (!token || !data) {
      navigate("/login");
      return;
    }

    localStorage.setItem("token", token);
    localStorage.setItem(
      "userData",
      JSON.stringify({
        type: role,
        data,
      })
    );
    localStorage.setItem(
      "linkedRoles",
      JSON.stringify({
        roles: parsed.roles,
        tokens: parsed.tokens,
        data: parsed.data,
      })
    );
    localStorage.removeItem("pendingRole");

    if (role === "user") navigate("/user/home");
    if (role === "rider") navigate("/rider/home");
  };

  return (
    <div className="w-full h-dvh flex flex-col justify-center items-center p-6 text-center">
      <Heading title={"Elegir tipo de sesión"} />
      <p className="text-sm text-zinc-600 mb-6">
         ¿Cómo quieres iniciar sesión?
      </p>
      <div className="flex items-center justify-center gap-8 w-full">
        <button
          type="button"
          onClick={() => chooseRole("user")}
          className="flex flex-col items-center gap-2"
          aria-label="Entrar como Usuario"
        >
          <span className="w-28 h-28 rounded-full border-2 border-zinc-200 shadow bg-white flex items-center justify-center">
            <img src="/pv.png" alt="Usuario" className="w-14 h-14 object-contain" />
          </span>
          <span className="text-sm font-semibold">Usuario</span>
        </button>
        <button
          type="button"
          onClick={() => chooseRole("rider")}
          className="flex flex-col items-center gap-2"
          aria-label="Entrar como Conductor"
        >
          <span className="w-28 h-28 rounded-full border-2 border-orange-200 shadow bg-orange-50 flex items-center justify-center">
            <img src="/bedriver.png" alt="Conductor" className="w-14 h-14 object-contain" />
          </span>
          <span className="text-sm font-semibold">Conductor</span>
        </button>
      </div>
    </div>
  );
}

export default RoleSelect;

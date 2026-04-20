import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import Console from "../utils/console";

function UserLogin() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();
  const location = useLocation();
  const currentRole = useMemo(() => {
    if (location.pathname === "/admin/login") return "admin";
    return "user";
  }, [location.pathname]);
  const forgotPasswordPath =
    currentRole === "admin" ? "/admin/forgot-password" : "/user/forgot-password";

  const emailRules = {
    required: "El correo es obligatorio",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Correo invalido",
    },
  };
  const passwordRules = {
    required: "La contrasena es obligatoria",
    minLength: {
      value: 8,
      message: "Minimo 8 caracteres",
    },
  };

  const redirectByRole = (userType) => {
    if (userType === "user") return "/user/home";
    if (userType === "rider") return "/rider/home";
    if (userType === "admin") return "/admin";
    return "/";
  };

  const loginUnified = async (data) => {
    if (data.email.trim() !== "" && data.password.trim() !== "") {
      try {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/auth/login`,
          data
        );
        Console.log(response);

        if (response.data.roles && response.data.tokens) {
          localStorage.setItem(
            "pendingRole",
            JSON.stringify({
              roles: response.data.roles,
              tokens: response.data.tokens,
              data: response.data.data,
            })
          );
          navigation("/choose-role");
          return;
        }

        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "userData",
          JSON.stringify({
            type: response.data.userType,
            data: response.data.data,
          })
        );
        navigation(redirectByRole(response.data.userType));
      } catch (error) {
        setResponseError(error.response?.data?.message || "Error al iniciar sesion");
        Console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setResponseError("");
    }, 5000);
  }, [responseError]);

  return (
    <div className="w-full h-dvh flex flex-col justify-between p-4 pt-6">
      <div>
        <Heading title={"Inicio de sesion"} />
        <form onSubmit={handleSubmit(loginUnified)}>
          <Input
            label={"Correo electronico"}
            type={"email"}
            name={"email"}
            register={register}
            rules={emailRules}
            error={errors.email}
          />
          <Input
            label={"Contrasena"}
            type={"password"}
            name={"password"}
            register={register}
            rules={passwordRules}
            error={errors.password}
          />
          {responseError && (
            <p className="text-sm text-center mb-4 text-red-500">
              {responseError}
            </p>
          )}

          <div className="text-xs mb-2">
            Olvidaste tu contrasena?{" "}
            <Link to={forgotPasswordPath} className="underline">
              Recuperar contrasena
            </Link>
          </div>

          <Button title={"Iniciar sesion"} loading={loading} type="submit" />
        </form>

        {currentRole !== "admin" && (
          <div className="text-sm font-normal text-center mt-4">
            No tienes cuenta?{" "}
            <Link to={"/signup"} className="font-semibold">
              Registrate
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserLogin;

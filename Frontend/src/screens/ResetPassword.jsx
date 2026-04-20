import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Button, Input, Alert } from "../components";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Console from "../utils/console";
import axios from "axios";
import { useAlert } from "../hooks/useAlert";
import password_image from "/password.svg";
import { ArrowLeft } from "lucide-react";

const allowedParams = ["user", "rider", "admin"];

function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const emailFromQuery = searchParams.get("email") || "";
  const { userType } = useParams();
  const navigate = useNavigate();
  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      email: emailFromQuery,
    },
  });

  const { alert, showAlert, hideAlert } = useAlert();
  const passwordRules = {
    required: "La contrasena es obligatoria",
    minLength: {
      value: 8,
      message: "Minimo 8 caracteres",
    },
  };
  const confirmRules = {
    required: "Confirma la contrasena",
    validate: (value) =>
      value === watch("password") || "Las contrasenas no coinciden",
  };
  const emailRules = {
    required: "El correo es obligatorio",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Correo invalido",
    },
  };
  const otpRules = {
    required: "El codigo es obligatorio",
    minLength: {
      value: 6,
      message: "El codigo debe tener 6 digitos",
    },
    maxLength: {
      value: 6,
      message: "El codigo debe tener 6 digitos",
    },
    pattern: {
      value: /^\d{6}$/,
      message: "Solo se permiten 6 digitos",
    },
  };

  if (!allowedParams.includes(userType)) {
    return <Navigate to={"/not-found"} replace />;
  }

  const roleHome = () => {
    if (userType === "user") return "/user/home";
    if (userType === "rider") return "/rider/home";
    if (userType === "admin") return "/admin";
    return "/";
  };

  const roleLogin = () => {
    if (userType === "admin") return "/admin/login";
    if (userType === "rider") return "/rider/login";
    return "/login";
  };

  const resendOtp = async () => {
    const email = watch("email")?.trim();
    if (!email) {
      showAlert(
        "Correo requerido",
        "Ingresa tu correo para reenviar el codigo",
        "failure"
      );
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/mail/${userType}/reset-password`,
        { email }
      );
      showAlert("Codigo reenviado", response.data.message, "success");
    } catch (error) {
      showAlert(
        "Ocurrio un error",
        error.response?.data?.message || "No se pudo reenviar el codigo",
        "failure"
      );
      Console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (data) => {
    if (data.password.length < 8 || data.confirmPassword.length < 8) {
      showAlert(
        "Longitud de contrasena incorrecta",
        "La contrasena debe tener al menos 8 caracteres",
        "failure"
      );
      return;
    }
    if (data.password !== data.confirmPassword) {
      showAlert(
        "Las contrasenas no coinciden",
        "La contrasena y la confirmacion deben ser identicas. Por favor, vuelve a ingresarlas",
        "failure"
      );
      return;
    }

    try {
      setLoading(true);
      const payload = token
        ? {
            token,
            password: data.password,
          }
        : {
            email: data.email.trim(),
            otp: data.otp,
            password: data.password,
          };

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/${userType}/reset-password`,
        payload
      );
      showAlert(
        "Contrasena restablecida exitosamente",
        response.data.message,
        "success"
      );
      Console.log(response);
      setTimeout(() => {
        navigate(roleLogin());
      }, 2000);
    } catch (error) {
      showAlert(
        "Ocurrio un error",
        error.response?.data?.message || "No se pudo restablecer la contrasena",
        "failure"
      );
      Console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar-section-page w-full h-dvh flex flex-col p-4 pt-6">
      <Alert
        heading={alert.heading}
        text={alert.text}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        type={alert.type}
      />
      <div className="flex items-center gap-3 mb-4">
        <ArrowLeft
          strokeWidth={3}
          className="cursor-pointer"
          onClick={() => navigate(roleHome())}
        />
        <h1 className="text-2xl font-bold">Crear nueva contrasena</h1>
      </div>

      <img className="w-60 mx-auto" src={password_image} alt="Password Image" />
      <form onSubmit={handleSubmit(resetPassword)}>
        {!token && (
          <>
            <Input
              label={"Correo electronico"}
              type={"email"}
              name={"email"}
              register={register}
              rules={emailRules}
              error={errors.email}
            />
            <Input
              label={"Codigo OTP"}
              type={"number"}
              name={"otp"}
              register={register}
              rules={otpRules}
              error={errors.otp}
              placeholder={"Ingresa el codigo de 6 digitos"}
            />
            <button
              type="button"
              className="text-sm underline text-zinc-700 mb-3"
              onClick={resendOtp}
              disabled={loading}
            >
              Reenviar codigo
            </button>
          </>
        )}
        <Input
          label={"Nueva contrasena"}
          type={"password"}
          name={"password"}
          register={register}
          rules={passwordRules}
          error={errors.password}
        />
        <Input
          label={"Confirmar contrasena"}
          type={"password"}
          name={"confirmPassword"}
          register={register}
          rules={confirmRules}
          error={errors.confirmPassword}
        />
        <Button
          title={"Restablecer contrasena"}
          loading={loading}
          type="submit"
        />
      </form>
    </div>
  );
}

export default ResetPassword;

import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button, Input, Alert } from "../components";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Console from "../utils/console";
import axios from "axios";
import useCooldownTimer from "../hooks/useCooldownTimer";
import mailImg from "/mail.png";
import { ArrowLeft } from "lucide-react";
import { useAlert } from "../hooks/useAlert";

const allowedParams = ["user", "rider", "admin"];

function ForgotPassword() {
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();
  const { userType } = useParams();
  const { alert, showAlert, hideAlert } = useAlert();
  const emailRules = {
    required: "El correo es obligatorio",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Correo invalido",
    },
  };
  const { timeLeft, isActive, startCooldown } = useCooldownTimer(
    60000,
    "forgot-password-cooldown"
  );

  if (!allowedParams.includes(userType)) {
    return <Navigate to="/not-found" replace />;
  }

  const forgotPassword = async (data) => {
    if (data.email.trim() !== "") {
      try {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/mail/${userType}/reset-password`,
          data
        );
        Console.log(response);
        showAlert(
          "Codigo enviado con exito",
          "Revisa tu correo e ingresa el codigo dentro de la app para restablecer tu contrasena",
          "success"
        );
        startCooldown();
        setTimeout(() => {
          navigation(`/${userType}/reset-password?email=${encodeURIComponent(data.email.trim())}`);
        }, 1000);
      } catch (error) {
        showAlert(
          "Ocurrio un error",
          error.response?.data?.message || "No se pudo enviar el codigo",
          "failure"
        );
        Console.log(error.response?.data?.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getButtonTitle = () => {
    if (isActive) {
      return `Espera ${timeLeft}s`;
    }
    return "Restablecer contrasena";
  };

  return (
    <div className="w-full h-dvh flex flex-col text-center p-4 pt-6 gap-24">
      <Alert
        heading={alert.heading}
        text={alert.text}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        type={alert.type}
      />
      <div className="flex gap-3">
        <ArrowLeft
          strokeWidth={3}
          className="mt-[5px] cursor-pointer"
          onClick={() => navigation(-1)}
        />
      </div>
      <div className="px-2">
        <h1 className="text-2xl font-bold">Olvidaste tu contrasena?</h1>
        <p className="text-sm mt-3 text-zinc-600 text-balance">
          Ingresa tu correo registrado para recibir un codigo de recuperacion
        </p>
        <img src={mailImg} alt="Email" className="h-36 mx-auto my-8" />

        <form onSubmit={handleSubmit(forgotPassword)}>
          <Input
            placeholder={"ejemplo@gmail.com"}
            type={"email"}
            name={"email"}
            register={register}
            rules={emailRules}
            error={errors.email}
          />

          <Button
            title={getButtonTitle()}
            loading={loading}
            loadingMessage={"Enviando..."}
            type="submit"
            classes="bg-red-500 text-white border-2 border-black-500"
            disabled={loading || isActive}
          />
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;

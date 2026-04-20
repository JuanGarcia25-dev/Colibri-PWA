import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input, Alert } from "../components";
import axios from "axios";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { ArrowLeft } from "lucide-react";

function UserSignup() {
  const [loading, setLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();

  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();
  const nameRules = {
    required: "Campo obligatorio",
    minLength: {
      value: 2,
      message: "Minimo 2 caracteres",
    },
    maxLength: {
      value: 50,
      message: "Maximo 50 caracteres",
    },
    pattern: {
      value: /^[A-Za-z\s'-]+$/,
      message: "Solo letras",
    },
  };
  const emailRules = {
    required: "El correo es obligatorio",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Correo invalido",
    },
    maxLength: {
      value: 100,
      message: "Maximo 100 caracteres",
    },
  };
  const passwordRules = {
    required: "La contrasena es obligatoria",
    minLength: {
      value: 8,
      message: "Minimo 8 caracteres",
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/,
      message: "Debe incluir mayúscula, minúscula y símbolo",
    },
  };
  const confirmPasswordRules = {
    required: "Confirma tu contrasena",
    validate: (value) =>
      value === watch("password") || "Las contraseñas no coinciden",
  };
  const phoneRules = {
    required: "El telefono es obligatorio",
    pattern: {
      value: /^\d{10}$/,
      message: "Debe tener 10 digitos",
    },
  };
  const countryCodeOptions = ["+52", "+1", "+57", "+54", "+51", "+56", "+58", "+502", "+503", "+504", "+505", "+506", "+507"];
  const signupUser = async (data) => {
    const userData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      email: data.email,
      password: data.password,
      phone: data.phone
    };

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/user/register`,
        userData
      );
      Console.log(response);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "userData",
        JSON.stringify({
          type: "user",
          data: response.data.user,
        })
      );
      navigation("/user/home");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.[0]?.msg ||
        "No se pudo registrar";
      showAlert("Ocurrió un error", message, "failure");
      Console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-dvh flex flex-col justify-between p-4 pt-6">
      <Alert
        heading={alert.heading}
        text={alert.text}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        type={alert.type}
      />
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            className="p-1 -ml-1 rounded hover:bg-zinc-100"
            onClick={() => navigation(-1)}
            aria-label="Volver"
          >
            <ArrowLeft className="align-middle" />
          </button>
          <h1 className="text-3xl font-bold">Registro de Usuario</h1>
        </div>
        <form onSubmit={handleSubmit(signupUser)}>
          <div className="flex gap-4 -mb-2">
            <Input
              label={"Nombre"}
              name={"firstname"}
              register={register}
              rules={nameRules}
              error={errors.firstname}
            />
            <Input
              label={"Apellido"}
              name={"lastname"}
              register={register}
              rules={nameRules}
              error={errors.lastname}
            />
          </div>
          <Input
            label={"Número de teléfono"}
            type={"number"}
            name={"phone"}
            register={register}
            rules={phoneRules}
            error={errors.phone}
            prefix={
              <select
                {...register("phoneCountryCode")}
                defaultValue="+52"
                className="bg-transparent outline-none text-sm"
              >
                {countryCodeOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            }
          />
          <Input
            label={"Correo electrónico"}
            type={"email"}
            name={"email"}
            register={register}
            rules={emailRules}
            error={errors.email}
          />
          <Input
            label={"Contraseña"}
            type={"password"}
            name={"password"}
            register={register}
            rules={passwordRules}
            error={errors.password}
          />
          <p className="text-xs text-zinc-500 -mt-1 mb-2">
            Debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un símbolo.
          </p>
          <Input
            label={"Confirmar contraseña"}
            type={"password"}
            name={"confirmPassword"}
            register={register}
            rules={confirmPasswordRules}
            error={errors.confirmPassword}
          />
          <Button title={"Registrarse"} loading={loading} type="submit" />
        </form>

        <p className="text-sm font-normal text-center mt-4">
          ¿Ya tienes una cuenta?{" "}
          <Link to={"/login"} className="font-semibold">
            Iniciar sesión
          </Link>
        </p>
      </div>

      
    </div>
  );
}

export default UserSignup;




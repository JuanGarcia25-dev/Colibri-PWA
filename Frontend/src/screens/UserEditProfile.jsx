import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import { ArrowLeft } from "lucide-react";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { Alert } from "../components";
import { compressImage } from "../utils/image";

function UserEditProfile() {
  const token = localStorage.getItem("token");
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const { user, setUser } = useUser();
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(user.profilephoto || "");

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
  const phoneRules = {
    required: "El telefono es obligatorio",
    pattern: {
      value: /^\d{10}$/,
      message: "Debe tener 10 digitos",
    },
  };
  const countryCodeOptions = ["+52", "+1", "+57", "+54", "+51", "+56", "+58", "+502", "+503", "+504", "+505", "+506", "+507"];

  const updateUserProfile = async (data) => {
    const userData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      phone: data.phone,
    };
    Console.log(userData);
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/user/update`,
        userData,
        {
          headers: {
            token: token,
          },
        }
      );
      Console.log(response);
      showAlert('Edición Exitosa', 'Tus datos de perfil se actualizaron correctamente', 'success');

      setTimeout(() => {
        navigation("/user/home");
      }, 5000)
    } catch (error) {
      showAlert('Ocurrió un error', error.response.data[0].msg, 'failure');

      Console.log(error.response);
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePhoto = async (file) => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      showAlert("Formato inválido", "Solo JPG o PNG", "failure");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showAlert("Imagen muy pesada", "El archivo debe ser menor a 3MB", "failure");
      return;
    }
    try {
      setPhotoUploading(true);
      const compressed = await compressImage(file);
      if (compressed.size > 2 * 1024 * 1024) {
        showAlert("Imagen muy pesada", "La imagen debe ser menor a 2MB", "failure");
        return;
      }
      setPhotoPreview(URL.createObjectURL(compressed));
      const formData = new FormData();
      formData.append("profilephoto", compressed);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/user/profilephoto`,
        formData,
        {
          headers: {
            token: token,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const url = response.data.profilephoto;
      setPhotoPreview(url);

      const current = JSON.parse(localStorage.getItem("userData"));
      if (current?.data) {
        const updated = { ...current, data: { ...current.data, profilephoto: url } };
        localStorage.setItem("userData", JSON.stringify(updated));
        if (current.type === "user") setUser(updated.data);
      }

      showAlert("Foto actualizada", "Tu foto de perfil se guardó correctamente", "success");
    } catch (error) {
      showAlert("Ocurrió un error", error.response?.data?.message || "No se pudo subir la foto", "failure");
    } finally {
      setPhotoUploading(false);
    }
  };

  const deleteProfilePhoto = async () => {
    try {
      setPhotoUploading(true);
      const response = await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/user/profilephoto`,
        { headers: { token: token } }
      );
      const url = response.data.profilephoto || "";
      setPhotoPreview(url);
      const current = JSON.parse(localStorage.getItem("userData"));
      if (current?.data) {
        const updated = { ...current, data: { ...current.data, profilephoto: url } };
        localStorage.setItem("userData", JSON.stringify(updated));
        if (current.type === "user") setUser(updated.data);
      }
      showAlert("Foto eliminada", "Se eliminó tu foto de perfil", "success");
    } catch (error) {
      showAlert("Ocurrió un error", error.response?.data?.message || "No se pudo eliminar la foto", "failure");
    } finally {
      setPhotoUploading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setResponseError("");
    }, 5000);
  }, [responseError]);
  return (
    <div className="sidebar-section-page w-full h-dvh flex flex-col justify-between p-4 pt-6">
      <Alert
        heading={alert.heading}
        text={alert.text}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        type={alert.type}
      />
      <div>
        <div className="flex gap-3">
          <ArrowLeft
            strokeWidth={3}
            className="mt-[5px] cursor-pointer"
            onClick={() => navigation(-1)}
          />
          <Heading title={"Editar Perfil"} />
        </div>
        <Input
          label={"Correo electrónico"}
          type={"email"}
          name={"email"}
          register={register}
          error={errors.email}
          defaultValue={user.email}
          disabled={true}
        />
        <div className="my-3">
          <h1 className="font-semibold">Foto de perfil</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-16 h-16 rounded-full bg-zinc-200 overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-zinc-500">Sin foto</span>
              )}
            </div>
            <label className="text-sm font-medium">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadProfilePhoto(e.target.files?.[0])}
                disabled={photoUploading}
              />
              <span className={`px-4 py-2 rounded-lg border ${photoUploading ? "opacity-60" : "cursor-pointer hover:bg-zinc-100"}`}>
                {photoUploading ? "Subiendo..." : photoPreview ? "Cambiar foto" : "Subir foto"}
              </span>
            </label>
            {photoPreview && (
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                onClick={deleteProfilePhoto}
                disabled={photoUploading}
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit(updateUserProfile)}>
          <Input
            label={"Nombre"}
            name={"firstname"}
            register={register}
            rules={nameRules}
            error={errors.firstname}
            defaultValue={user.fullname.firstname}
          />
          <Input
            label={"Apellido"}
            name={"lastname"}
            register={register}
            rules={nameRules}
            error={errors.lastname}
            defaultValue={user.fullname.lastname}
          />
          <Input
            label={"Número de teléfono"}
            type={"number"}
            name={"phone"}
            register={register}
            rules={phoneRules}
            error={errors.phone}
            defaultValue={user.phone}
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
          {responseError && (
            <p className="text-sm text-center mb-4 text-red-500">
              {responseError}
            </p>
          )}
          <Button
            title={"Actualizar Perfil"}
            loading={loading}
            type="submit"
            classes={"mt-4"}
          />
        </form>
      </div>
    </div>
  );
}

export default UserEditProfile;




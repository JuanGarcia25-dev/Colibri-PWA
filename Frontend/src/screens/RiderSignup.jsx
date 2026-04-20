import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import Console from "../utils/console";
import { compressImage } from "../utils/image";

function RiderSignup() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const {
    handleSubmit,
    register,
    resetField,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("userData");
  const parsedUser = userData ? JSON.parse(userData).data : null;
  const currentYear = new Date().getFullYear();
  const nameRules = {
    required: "Campo obligatorio",
    minLength: { value: 2, message: "Minimo 2 caracteres" },
    maxLength: { value: 50, message: "Maximo 50 caracteres" },
    pattern: { value: /^[A-Za-z\s'-]+$/, message: "Solo letras" },
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
  const phoneRules = {
    required: "El telefono es obligatorio",
    pattern: { value: /^\d{10}$/, message: "Debe tener 10 digitos" },
  };
  const emergencyPhoneRules = {
    required: "El telefono de emergencia es obligatorio",
    pattern: { value: /^\d{10}$/, message: "Debe tener 10 digitos" },
  };
  const countryCodeOptions = ["+52", "+1", "+57", "+54", "+51", "+56", "+58", "+502", "+503", "+504", "+505", "+506", "+507"];
  const dateOfBirthRules = {
    required: "La fecha es obligatoria",
    validate: (value) => {
      const dob = new Date(value);
      if (Number.isNaN(dob.getTime())) return "Fecha invalida";
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age -= 1;
      }
      return age >= 18 || "Debes ser mayor de 18";
    },
  };
  const ageRules = {
    required: "La edad es obligatoria",
    min: { value: 18, message: "Minimo 18" },
    max: { value: 80, message: "Maximo 80" },
  };
  const nationalityRules = {
    required: "La nacionalidad es obligatoria",
    maxLength: { value: 50, message: "Maximo 50 caracteres" },
  };
  const nationalityOptions = [
    "Mexicana",
    "Estadounidense",
    "Canadiense",
    "Guatemalteca",
    "Salvadoreña",
    "Hondureña",
    "Nicaragüense",
    "Costarricense",
    "Panameña",
    "Colombiana",
    "Venezolana",
    "Peruana",
    "Chilena",
    "Argentina",
    "Española",
    "Otra",
  ];
  const sexRules = {
    required: "Selecciona una opcion",
  };
  const vehicleBrandRules = {
    required: "La marca es obligatoria",
    maxLength: { value: 30, message: "Maximo 30 caracteres" },
  };
  const vehicleColorRules = {
    required: "El color es obligatorio",
    maxLength: { value: 30, message: "Maximo 30 caracteres" },
  };
  const vehicleModelRules = {
    required: "El modelo es obligatorio",
    maxLength: { value: 30, message: "Maximo 30 caracteres" },
  };
  const vehicleYearRules = {
    required: "El anio es obligatorio",
    min: { value: 1990, message: "Minimo 1990" },
    max: { value: currentYear + 1, message: `Maximo ${currentYear + 1}` },
  };
  const vehicleTypeRules = { required: "Selecciona un tipo" };
  const vehiclePlateRules = {
    required: "La placa es obligatoria",
    maxLength: { value: 10, message: "Maximo 10 caracteres" },
    pattern: {
      value: /^[A-Za-z0-9-]{5,10}$/,
      message: "Formato de placa invalido",
    },
  };
  const vehicleInsuranceRules = {
    required: "Selecciona una opcion",
  };
  const vehicleCatalog = {
    truck: {
      label: "Camioneta",
      brands: {
        nissan: { label: "Nissan", models: ["NP300"] },
        ford: { label: "Ford", models: ["Ranger"] },
        toyota: { label: "Toyota", models: ["Hilux"] },
        chevrolet: { label: "Chevrolet", models: ["S10 / Tornado"] },
      },
      capacity: { min: 2, max: 6 },
    },
    car: {
      label: "Vehiculo",
      brands: {
        nissan: { label: "Nissan", models: ["Versa"] },
        ford: { label: "Ford", models: ["Figo"] },
        toyota: { label: "Toyota", models: ["Yaris"] },
        chevrolet: { label: "Chevrolet", models: ["Aveo"] },
      },
      capacity: { min: 2, max: 4 },
    },
  };

  const dateOfBirth = watch("dateOfBirth");
  const vehicleType = watch("vehicleType");
  const vehicleBrand = watch("vehicleBrand");
  const selectedVehicle = vehicleCatalog[vehicleType];
  const brandOptions = selectedVehicle
    ? Object.entries(selectedVehicle.brands).map(([value, brand]) => ({
        label: brand.label,
        value,
      }))
    : [];
  const modelOptions =
    selectedVehicle && vehicleBrand && selectedVehicle.brands[vehicleBrand]
      ? selectedVehicle.brands[vehicleBrand].models.map((model) => ({
          label: model,
          value: model,
        }))
      : [];
  const vehicleCapacityRules = {
    required: "La capacidad es obligatoria",
    validate: (value) => {
      const capacity = Number(value);
      if (!selectedVehicle) return "Selecciona primero un tipo de vehiculo";
      if (!Number.isInteger(capacity) || capacity < selectedVehicle.capacity.min) {
        return `Minimo ${selectedVehicle.capacity.min}`;
      }
      if (capacity > selectedVehicle.capacity.max) {
        return `Maximo ${selectedVehicle.capacity.max}`;
      }
      return true;
    },
  };

  const appendUpload = async (formData, fieldName, file, options = {}) => {
    if (!file) return;

    let uploadFile = file;
    if (file.type?.startsWith("image/")) {
      uploadFile = await compressImage(
        file,
        options.maxSizeBytes ?? 1024 * 1024,
        options.maxDimension ?? 1280,
        options.squareSize ?? 1024
      );
    }

    formData.append(fieldName, uploadFile);
  };

  useEffect(() => {
    if (!dateOfBirth) return;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    if (age >= 0) {
      setValue("age", age.toString());
    }
  }, [dateOfBirth, setValue]);

  useEffect(() => {
    resetField("vehicleBrand");
    resetField("vehicleModel");
    resetField("vehicleCapacity");
  }, [vehicleType, resetField]);

  useEffect(() => {
    resetField("vehicleModel");
  }, [vehicleBrand, resetField]);

  const submitApplication = async (data) => {
    if (!token) {
      setResponseError("Necesitas iniciar sesión como usuario primero");
      return;
    }

    const formData = new FormData();
    formData.append("firstname", data.firstname);
    formData.append("lastname", data.lastname);
    formData.append("age", data.age);
    formData.append("dateOfBirth", data.dateOfBirth);
    formData.append("nationality", data.nationality);
    formData.append("sex", data.sex);
    if (data.conditions) formData.append("conditions", data.conditions);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("emergencyPhone", data.emergencyPhone);

    formData.append("vehicleAuto", data.vehicleAuto);
    formData.append("vehicleModel", data.vehicleModel);
    formData.append("vehicleBrand", data.vehicleBrand);
    formData.append("vehicleColor", data.vehicleColor);
    formData.append("vehicleType", data.vehicleType);
    formData.append("vehicleCapacity", data.vehicleCapacity);
    formData.append("vehiclePlate", data.vehiclePlate);
    formData.append("vehicleInsurance", data.vehicleInsurance);

    try {
      setLoading(true);
      await appendUpload(formData, "profilephoto", data.profilephoto?.[0], {
        maxSizeBytes: 800 * 1024,
        maxDimension: 1024,
        squareSize: 768,
      });
      await appendUpload(formData, "curp", data.curp?.[0]);
      await appendUpload(formData, "ine", data.ine?.[0]);
      await appendUpload(formData, "license", data.license?.[0]);
      await appendUpload(formData, "tioVigente", data.tioVigente?.[0]);
      await appendUpload(formData, "tarjetaCirculacion", data.tarjetaCirculacion?.[0]);
      await appendUpload(formData, "vehicleFront", data.vehicleFront?.[0]);
      await appendUpload(formData, "vehicleRear", data.vehicleRear?.[0]);
      await appendUpload(formData, "vehiclePlate", data.vehiclePlatePhoto?.[0], {
        maxSizeBytes: 800 * 1024,
        maxDimension: 1024,
        squareSize: 768,
      });

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/driver/apply`,
        formData,
        {
          headers: {
            token: token,
          },
        }
      );
      Console.log(response);

      if (userData) {
        const updated = {
          ...JSON.parse(userData),
          data: { ...parsedUser, driverStatus: "pending" },
        };
        localStorage.setItem("userData", JSON.stringify(updated));
      }

      setSuccess("Solicitud enviada correctamente");
      setTimeout(() => navigation("/user/home"), 1500);
    } catch (error) {
      const isPayloadTooLarge = error.response?.status === 413;
      setResponseError(
        isPayloadTooLarge
          ? "Los archivos seleccionados son demasiado pesados. Intenta con imágenes o PDFs más ligeros."
          : error.response?.data?.message ||
            error.response?.data?.[0]?.msg ||
            "Error al enviar la solicitud"
      );
      Console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (responseError || success) {
      const timer = setTimeout(() => {
        setResponseError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [responseError, success]);

  return (
    <div className="sidebar-section-page w-full h-dvh overflow-y-auto flex flex-col justify-between p-4 pt-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ArrowLeft
            className="cursor-pointer"
            onClick={() => navigation("/user/home")}
          />
          <Heading title={"Solicitud de Conductor"} />
        </div>

        <form onSubmit={handleSubmit(submitApplication)}>
          <div className="flex gap-4 -mb-2">
            <Input
              label={"Nombre"}
              name={"firstname"}
              register={register}
              rules={nameRules}
              error={errors.firstname}
              defaultValue={parsedUser?.fullname?.firstname}
            />
            <Input
              label={"Apellido"}
              name={"lastname"}
              register={register}
              rules={nameRules}
              error={errors.lastname}
              defaultValue={parsedUser?.fullname?.lastname}
            />
          </div>

          <Input
            label={"Fecha de nacimiento"}
            type={"date"}
            name={"dateOfBirth"}
            register={register}
            rules={dateOfBirthRules}
            error={errors.dateOfBirth}
          />

          <Input
            label={"Edad"}
            type={"number"}
            name={"age"}
            register={register}
            rules={ageRules}
            error={errors.age}
            readOnly
          />

          <Input
            label={"Nacionalidad"}
            type={"select"}
            options={nationalityOptions}
            name={"nationality"}
            register={register}
            rules={nationalityRules}
            error={errors.nationality}
          />

          <Input
            label={"Sexo"}
            type={"select"}
            options={["Masculino", "Femenino", "Otro"]}
            name={"sex"}
            register={register}
            rules={sexRules}
            error={errors.sex}
          />

          <div className="my-2">
            <h1 className="font-semibold">Padecimientos (opcional)</h1>
            <textarea
              {...register("conditions")}
              className="w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
              rows={3}
              placeholder="Describe si tienes algún padecimiento"
            />
          </div>

          <Input
            label={"Correo electrónico"}
            type={"email"}
            name={"email"}
            register={register}
            rules={emailRules}
            error={errors.email}
            defaultValue={parsedUser?.email}
          />

          <Input
            label={"Número de teléfono"}
            type={"number"}
            name={"phone"}
            register={register}
            rules={phoneRules}
            error={errors.phone}
            defaultValue={parsedUser?.phone}
            readOnly
            prefix={
              <span>+52</span>
            }
          />

          <Input
            label={"Número de emergencia"}
            type={"number"}
            name={"emergencyPhone"}
            register={register}
            rules={emergencyPhoneRules}
            error={errors.emergencyPhone}
            prefix={
              <select
                {...register("emergencyPhoneCountryCode")}
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
          <div className="my-2">
            <h1 className="font-semibold">Foto de perfil del conductor</h1>
            <p className="text-xs text-zinc-500 mb-1">
              Esta foto se usará para el perfil de conductor cuando tu solicitud sea aprobada.
            </p>
            <input
              type="file"
              accept="image/*"
              {...register("profilephoto", { required: true })}
              className="w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
            />
            {errors.profilephoto && (
              <p className="text-xs text-red-500">La foto de perfil es requerida</p>
            )}
          </div>
          
          <div className="mt-4">
            <h2 className="font-semibold">Datos del vehículo</h2>
          </div>



          <Input
            label={"Tipo"}
            type={"select"}
            options={[
              { label: "Vehiculo", value: "car" },
              { label: "Camioneta", value: "truck" },
            ]}
            name={"vehicleType"}
            register={register}
            rules={vehicleTypeRules}
            error={errors.vehicleType}
          />

          <Input
            label={"Marca"}
            type={"select"}
            name={"vehicleBrand"}
            register={register}
            rules={vehicleBrandRules}
            error={errors.vehicleBrand}
            options={brandOptions}
            disabled={!vehicleType}
          />

          <Input
            label={"Modelo"}
            type={"select"}
            name={"vehicleModel"}
            register={register}
            rules={vehicleModelRules}
            error={errors.vehicleModel}
            options={modelOptions}
            disabled={!vehicleBrand}
          />

          <Input
            label={"Año del vehículo"}
            name={"vehicleAuto"}
            register={register}
            rules={vehicleYearRules}
            error={errors.vehicleAuto}
          />

          <Input
            label={"Color"}
            name={"vehicleColor"}
            register={register}
            rules={vehicleColorRules}
            error={errors.vehicleColor}
          />

          <Input
            label={"Capacidad de pasajeros"}
            type={"number"}
            name={"vehicleCapacity"}
            register={register}
            rules={vehicleCapacityRules}
            error={errors.vehicleCapacity}
            min={selectedVehicle?.capacity.min}
            max={selectedVehicle?.capacity.max}
            placeholder={
              selectedVehicle
                ? `Entre ${selectedVehicle.capacity.min} y ${selectedVehicle.capacity.max}`
                : "Selecciona primero el tipo"
            }
            disabled={!vehicleType}
          />

          <Input
            label={"Placa"}
            name={"vehiclePlate"}
            register={register}
            rules={vehiclePlateRules}
            error={errors.vehiclePlate}
          />

          <Input
            label={"Tiene seguro"}
            type={"select"}
            options={[{ label: "Sí", value: "yes" }, { label: "No", value: "no" }]}
            name={"vehicleInsurance"}
            register={register}
            rules={vehicleInsuranceRules}
            error={errors.vehicleInsurance}
          />

          <div className="my-2">
            <h1 className="font-semibold">CURP (PDF o imagen)</h1>
            <input
              type="file"
              accept="image/*,.pdf"
              {...register("curp", { required: true })}
              className="w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
            />
            {errors.curp && <p className="text-xs text-red-500">Archivo requerido</p>}
          </div>

          <div className="my-2">
            <h1 className="font-semibold">INE (PDF o imagen)</h1>
            <input
              type="file"
              accept="image/*,.pdf"
              {...register("ine", { required: true })}
              className="w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
            />
            {errors.ine && <p className="text-xs text-red-500">Archivo requerido</p>}
          </div>

          <div className="my-2">
            <h1 className="font-semibold">Licencia de conducir (PDF o imagen)</h1>
            <input
              type="file"
              accept="image/*,.pdf"
              {...register("license", { required: true })}
              className="w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
            />
            {errors.license && <p className="text-xs text-red-500">Archivo requerido</p>}
          </div>

          <div className="my-2">
            <h1 className="font-semibold">TIO vigente (Tarjetón de identificación) (PDF o imagen)</h1>
            <input
              type="file"
              accept="image/*,.pdf"
              {...register("tioVigente", { required: true })}
              className="w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
            />
            {errors.tioVigente && <p className="text-xs text-red-500">Archivo requerido</p>}
          </div>

          <div className="my-2">
            <h1 className="font-semibold">Tarjeta de circulación (PDF o imagen)</h1>
            <input
              type="file"
              accept="image/*,.pdf"
              {...register("tarjetaCirculacion", { required: true })}
              className="w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
            />
            {errors.tarjetaCirculacion && <p className="text-xs text-red-500">Archivo requerido</p>}
          </div>

          <div className="my-2">
            <h1 className="font-semibold">Foto del vehículo (frente)</h1>
            <input
              type="file"
              accept="image/*"
              {...register("vehicleFront", { required: true })}
              className="w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
            />
            {errors.vehicleFront && (
              <p className="text-xs text-red-500">Archivo requerido</p>
            )}
          </div>

          <div className="my-2">
            <h1 className="font-semibold">Foto del vehículo (parte trasera)</h1>
            <input
              type="file"
              accept="image/*"
              {...register("vehicleRear", { required: true })}
              className="w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
            />
            {errors.vehicleRear && (
              <p className="text-xs text-red-500">Archivo requerido</p>
            )}
          </div>

          <div className="my-2">
            <h1 className="font-semibold">Foto de la placa</h1>
            <input
              type="file"
              accept="image/*"
              {...register("vehiclePlatePhoto", { required: true })}
              className="w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
            />
            {errors.vehiclePlatePhoto && (
              <p className="text-xs text-red-500">Archivo requerido</p>
            )}
          </div>

          {responseError && (
            <p className="text-sm text-center mb-4 text-red-500">
              {responseError}
            </p>
          )}
          {success && (
            <p className="text-sm text-center mb-4 text-green-600">{success}</p>
          )}

          <Button title={"Enviar solicitud"} loading={loading} type="submit" />
        </form>

       
      </div>
    </div>
  );
}

export default RiderSignup;


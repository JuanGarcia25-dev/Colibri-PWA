import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heading } from "../components";
import axios from "axios";
import { useRider } from "../contexts/RiderContext";
import { ArrowLeft } from "lucide-react";
import Console from "../utils/console";

function RiderEditProfile() {
  const token = localStorage.getItem("token");
  const [responseError, setResponseError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { rider } = useRider();
  const [photoPreview, setPhotoPreview] = useState(rider.profilephoto || "");
  const navigation = useNavigate();

  const updateUserProfile = async (data) => {
    // No longer needed - profile is read-only
  };

  const uploadProfilePhoto = async (file) => {
    // No longer needed - photo upload disabled
  };

  const deleteProfilePhoto = async () => {
    // No longer needed - photo deletion disabled
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setResponseError("");
      setSuccessMessage("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [responseError, successMessage]);

  return (
    <div className="sidebar-section-page w-full h-dvh flex flex-col justify-between p-4 pt-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="overflow-auto pb-4">
        <div className="flex gap-3 mb-6">
          <ArrowLeft
            strokeWidth={3}
            className="mt-[5px] cursor-pointer hover:opacity-70 transition"
            onClick={() => navigation(-1)}
          />
          <Heading title={"Perfil"} />
        </div>

        {/* Foto de Perfil Grande */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 overflow-hidden flex items-center justify-center shadow-lg mb-4">
            {photoPreview ? (
              <img src={photoPreview} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-300"></div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-center">
            {rider.fullname.firstname} {rider.fullname.lastname}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{rider.email}</p>
        </div>

        {/* Información de Contacto */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">Contacto</h3>
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-400 rounded-full"></div>
            <div>
              <p className="text-xs text-slate-500">Teléfono</p>
              <p className="font-medium">+52 {rider.phone}</p>
            </div>
          </div>
        </div>

        {/* Información del Vehículo */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">Vehículo</h3>
          
          {/* Tipo y Capacidad */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Tipo</p>
              <p className="font-semibold text-lg">
                {rider.vehicle.type === "car" ? "Auto" : "Camioneta"}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Capacidad</p>
              <p className="font-semibold text-lg">{rider.vehicle.capacity} personas</p>
            </div>
          </div>

          {/* Placa y Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Placa</p>
              <p className="font-semibold">{rider.vehicle.number}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border-2 border-slate-300"
                style={{ backgroundColor: rider.vehicle.color.toLowerCase() }}
              ></div>
              <div>
                <p className="text-xs text-slate-500">Color</p>
                <p className="text-sm font-medium capitalize">{rider.vehicle.color}</p>
              </div>
            </div>
          </div>
        </div>

        {responseError && (
          <p className="text-sm text-center mt-4 text-red-500 bg-red-50 p-3 rounded-lg">
            {responseError}
          </p>
        )}
        {successMessage && (
          <p className="text-sm text-center mt-4 text-green-600 bg-green-50 p-3 rounded-lg">
            {successMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default RiderEditProfile;



import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { SocketDataContext } from "../contexts/SocketContext";
import { MapPin, Phone, ArrowLeft, Clock } from "lucide-react";
import map from "/map.png";
import Console from "../utils/console";
import Loading from "./Loading";

function RideShare() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { socket } = useContext(SocketDataContext);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const riderMarkerRef = useRef(null);
  
  const [rideData, setRideData] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eta, setEta] = useState(null);

  // Obtener datos del viaje
  const getRideDetails = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/share-details/${rideId}`
      );
      setRideData(response.data);
      setLoading(false);
      
      // Conectarse a la sala del viaje para recibir actualizaciones
      socket.emit("join-room", rideId);
    } catch (error) {
      Console.error("Error obtaining ride details:", error);
      setError("No se encontró el viaje o ha expirado");
      setLoading(false);
    }
  };

  // Inicializar mapa
  const initializeMap = () => {
    if (!mapRef.current || !window.google || !rideData) return;

    // Para direcciones de string, usar geocoding o simplemente mostrar el mapa centrado
    const mapOptions = {
      center: {
        lat: 3.432,
        lng: -76.53,
      },
      zoom: 15,
      fullscreenControl: false,
    };

    mapInstanceRef.current = new window.google.maps.Map(
      mapRef.current,
      mapOptions
    );
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer();
    directionsRendererRef.current.setMap(mapInstanceRef.current);

    // Usar DirectionsService para obtener coordenadas
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: rideData.pickup,
        destination: rideData.destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result);
        }
      }
    );
  };

  // Actualizar ubicación del rider
  const updateRiderLocation = (location) => {
    setRiderLocation(location);

    if (!mapInstanceRef.current || !window.google) return;

    if (riderMarkerRef.current) {
      riderMarkerRef.current.setPosition({
        lat: location.latitude,
        lng: location.longitude,
      });
    } else {
      riderMarkerRef.current = new window.google.maps.Marker({
        position: {
          lat: location.latitude,
          lng: location.longitude,
        },
        map: mapInstanceRef.current,
        title: "Ubicación del conductor",
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });
    }

    mapInstanceRef.current.panTo({
      lat: location.latitude,
      lng: location.longitude,
    });

    // Actualizar ETA si está disponible
    if (location.eta) {
      setEta(location.eta);
    }
  };

  useEffect(() => {
    getRideDetails();
  }, [rideId]);

  useEffect(() => {
    if (rideData) {
      initializeMap();
    }
  }, [rideData]);

  // Escuchar actualizaciones de ubicación en tiempo real
  useEffect(() => {
    if (socket) {
      socket.on("rider-location-update", (location) => {
        updateRiderLocation(location);
      });

      return () => {
        socket.off("rider-location-update");
      };
    }
  }, [socket]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="w-full h-dvh flex flex-col items-center justify-center bg-white">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-dvh bg-contain"
      style={{ backgroundImage: `url(${map})` }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-white shadow-md p-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold flex-1 text-center">
          Viaje en Curso
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Mapa */}
      <div
        ref={mapRef}
        className="w-full h-[70vh] top-0 left-0"
        id="share-map"
      ></div>

      {/* Información del viaje */}
      <div className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-lg p-4">
        {/* Conductor */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {rideData?.rider?.fullname?.firstname[0]}
            {rideData?.rider?.fullname?.lastname[0]}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">
              {rideData?.rider?.fullname?.firstname}{" "}
              {rideData?.rider?.fullname?.lastname}
            </h2>
            <p className="text-sm text-gray-600">
              {rideData?.rider?.vehicle?.color} {rideData?.rider?.vehicle?.type}
            </p>
            <p className="text-sm font-bold text-gray-800">
              {rideData?.rider?.vehicle?.number}
            </p>
          </div>
          <a
            href={"tel:" + rideData?.rider?.phone}
            className="p-3 bg-green-500 rounded-full text-white hover:bg-green-600"
          >
            <Phone size={20} />
          </a>
        </div>

        {/* Localizaciones */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-0.5 h-8 bg-gray-300"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Salida</p>
              <p className="text-sm font-semibold mb-3">
                {rideData?.pickup}
              </p>
              <p className="text-xs text-gray-500 mb-1">Destino</p>
              <p className="text-sm font-semibold">
                {rideData?.destination}
              </p>
            </div>
          </div>
        </div>

        {/* ETA */}
        {eta && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">
              ETA: {eta}
            </span>
          </div>
        )}

        {/* Tarifa */}
        <div className="mt-4 text-center p-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-600">Total estimado</p>
          <p className="text-2xl font-bold text-gray-900">
            $ {rideData?.fare}
          </p>
        </div>
      </div>
    </div>
  );
}

export default RideShare;

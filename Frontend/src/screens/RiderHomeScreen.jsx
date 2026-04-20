import { useContext, useEffect, useRef, useState } from "react";
import map from "/map.png";
import axios from "axios";
import { useRider } from "../contexts/RiderContext";
import { Phone, User } from "lucide-react";
import { SocketDataContext } from "../contexts/SocketContext";
import { NewRide, Sidebar } from "../components";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { Alert } from "../components";

const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#111827" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#111827" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1324" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
];

const defaultRideData = {
  user: {
    fullname: {
      firstname: "No",
      lastname: "User",
    },
    _id: "",
    email: "example@gmail.com",
    rides: [],
  },
  pickup: "Place, City, State, Country",
  destination: "Place, City, State, Country",
  fare: 0,
  vehicle: "car",
  status: "pending",
  duration: 0,
  distance: 0,
  _id: "123456789012345678901234",
};

function RiderHomeScreen() {
  const token = localStorage.getItem("token");

  const { rider } = useRider();
  const { socket } = useContext(SocketDataContext);
  const mapRef = useRef(null); // Ref para el contenedor del mapa
  const mapInstanceRef = useRef(null); // Ref para la instancia del mapa
  const directionsServiceRef = useRef(null); // Ref para el servicio de direcciones
  const directionsRendererRef = useRef(null); // Ref para el renderer de direcciones
  const userMarkerRef = useRef(null); // Ref para el marcador del usuario
  const [loading, setLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();

  const [riderLocation, setRiderLocation] = useState({
    ltd: null,
    lng: null,
  });
  const [earnings, setEarnings] = useState({
    total: 0,
    today: 0,
  });

  const [rides, setRides] = useState({
    accepted: 0,
    cancelled: 0,
    distanceTravelled: 0,
  });
  const [newRide, setNewRide] = useState(
    JSON.parse(localStorage.getItem("rideDetails")) || defaultRideData
  );

  const [otp, setOtp] = useState("");
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem("messages")) || []
  );
  const [error, setError] = useState("");

  // Panels
  const [showRiderDetailsPanel, setShowRiderDetailsPanel] = useState(true);
  const [showNewRidePanel, setShowNewRidePanel] = useState(
    JSON.parse(localStorage.getItem("showPanel")) || false
  );
  const [showBtn, setShowBtn] = useState(
    JSON.parse(localStorage.getItem("showBtn")) || "accept"
  );
  const [isDarkHome, setIsDarkHome] = useState(
    () => localStorage.getItem("homeTheme") === "dark"
  );

  const acceptRide = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/confirm`,
          { rideId: newRide._id },
          {
            headers: {
              token: token,
            },
          }
        );
        setLoading(false);
        setShowBtn("otp");
        setShowRiderDetailsPanel(false); // Ocultar panel de detalles
        setShowNewRidePanel(true); // Mantener el panel de nuevo viaje para mostrar OTP
        localStorage.setItem("showBtn", JSON.stringify("otp"));
        // Unirse a la sala del ride para recibir actualizaciones
        socket.emit("join-room", newRide._id);
        // Dibujar ruta desde mi ubicación actual hasta el pickup del usuario
        drawRoute(
          { lat: riderLocation.ltd, lng: riderLocation.lng },
          newRide.pickup
        );
        Console.log(response);
      }
    } catch (error) {
      setLoading(false);
      showAlert('Some error occured', error.response.data.message, 'failure');
      Console.log(error.response);
      setTimeout(() => {
        clearRideData();
      }, 1000);
    }
  };

  const verifyOTP = async () => {
    try {
      if (newRide._id != "" && otp.length == 6) {
        setLoading(true);
        const cleanOtp = otp.trim();
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/ride/start-ride?rideId=${newRide._id}&otp=${cleanOtp}`,
          {
            headers: {
              token: token,
            },
          }
        );
        setShowBtn("end-ride");
        setLoading(false);
        // Dibujar ruta hacia el destino final
        drawRoute(
          { lat: riderLocation.ltd, lng: riderLocation.lng },
          newRide.destination
        );
        Console.log(response);
      }
    } catch (err) {
      setLoading(false);
      setError("Invalid OTP");
      Console.log(err);
    }
  };

  const cancelRide = async () => {
    try {
      if (newRide._id != "" && showBtn === "otp") {
        setLoading(true);
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/cancel`,
          {
            rideId: newRide._id,
            reason: "Cancelado por el conductor",
          },
          {
            headers: {
              token: token,
            },
          }
        );
        clearRideData();
        updateLocation();
      }
    } catch (err) {
      setLoading(false);
      Console.log("Error cancelling ride:", err);
      showAlert("Error al cancelar el viaje", err.response?.data?.message || err.message, "failure");
    } finally {
      setLoading(false);
    }
  };

  const endRide = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/end-ride`,
          {
            rideId: newRide._id,
          },
          {
            headers: {
              token: token,
            },
          }
        );
        Console.log("Ride ended:", response.data);
        setShowBtn("payment");
        setShowRiderDetailsPanel(false);
        setShowNewRidePanel(true);
        setNewRide((prev) => ({ ...prev, ...(response.data || {}), status: "awaiting_payment" }));
        localStorage.setItem("showBtn", JSON.stringify("payment"));
      }
    } catch (err) {
      setLoading(false);
      Console.log("Error ending ride:", err);
      showAlert("Error al finalizar el viaje", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/confirm-payment`,
          {
            rideId: newRide._id,
          },
          {
            headers: {
              token: token,
            },
          }
        );
        Console.log("Payment confirmed:", response.data);
        showAlert("Pago confirmado", "Viaje completado correctamente.", "success");
        clearRideData();
        updateLocation();
      }
    } catch (err) {
      Console.log("Error confirming payment:", err);
      showAlert("Error al confirmar pago", err.response?.data?.message || err.message, "failure");
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Actualizar ubicación local
          setRiderLocation({
            ltd: lat,
            lng: lng,
          });

          // Inicializar el mapa con la ubicación actual
          initializeMap(lat, lng);
          
          // Emitir ubicación en tiempo real al backend
          socket.emit("update-location-rider", {
            userId: rider._id,
            location: {
              ltd: lat,
              lng: lng,
            },
          });
        },
        (error) => {
          console.error("Error fetching position:", error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.error("User denied the request for Geolocation.");
              break;
            case error.POSITION_UNAVAILABLE:
              console.error("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              console.error("The request to get user location timed out.");
              break;
            default:
              console.error("An unknown error occurred.");
          }
        }
      );
    }
  };

  // Inicializar Google Maps
  const initializeMap = (lat, lng) => {
    if (!mapRef.current || !window.google) return;

    const location = { lat, lng };

    // Crear el mapa si no existe
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: location,
        fullscreenControl: false,
        mapTypeControl: false,
        styles: isDarkHome ? DARK_MAP_STYLES : [],
      });

      // Inicializar servicios
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer();
      directionsRendererRef.current.setMap(mapInstanceRef.current);
    } else {
      // Actualizar centro del mapa
      mapInstanceRef.current.setCenter(location);
    }
  };

  // Dibujar ruta entre dos ubicaciones
  const drawRoute = (pickup, destination) => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || !mapInstanceRef.current) return;

    directionsServiceRef.current.route(
      {
        origin: pickup,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result);
          Console.log("Ruta dibujada correctamente");
        } else {
          Console.error("Error al obtener direcciones:", status);
        }
      }
    );
  };

  // Actualizar marcador del usuario en tiempo real
  const updateUserMarker = (lat, lng) => {
    if (!mapInstanceRef.current || !window.google) return;

    const location = { lat, lng };

    if (userMarkerRef.current) {
      // Actualizar posición del marcador existente
      userMarkerRef.current.setPosition(location);
    } else {
      // Crear nuevo marcador del usuario
      userMarkerRef.current = new window.google.maps.Marker({
        position: location,
        map: mapInstanceRef.current,
        title: "Usuario",
        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Marcador azul para el usuario
      });
    }
  };

  const clearRideData = () => {
    setShowBtn("accept");
    setLoading(false);
    setShowRiderDetailsPanel(true);
    setShowNewRidePanel(false);
    setNewRide(defaultRideData);
    localStorage.removeItem("rideDetails");
    localStorage.removeItem("showPanel");
  };

  const getCancelMessage = (cancelledByModel) => {
    if (cancelledByModel === "User") {
      return {
        heading: "Viaje cancelado",
        text: "El usuario canceló el viaje.",
      };
    }
    if (cancelledByModel === "Rider") {
      return {
        heading: "Viaje cancelado",
        text: "Has cancelado el viaje.",
      };
    }
    return {
      heading: "Viaje cancelado",
      text: "El viaje fue cancelado.",
    };
  };

  useEffect(() => {
    if (rider._id) {
      socket.emit("join", {
        userId: rider._id,
        userType: "rider",
      });

      // const locationInterval = setInterval(updateLocation, 10000);
      updateLocation(); // IMP: Call this function to update location
    }

    socket.on("new-ride", (data) => {
      Console.log("New Ride available:", data);
      setShowBtn("accept");
      setNewRide(data);
      setShowNewRidePanel(true);
    });

    socket.on("ride-cancelled", (data) => {
      Console.log("Ride cancelled", data);
      const cancelInfo = getCancelMessage(data?.cancelledByModel);
      showAlert(cancelInfo.heading, cancelInfo.text, "failure");
      updateLocation();
      clearRideData();
    });

    socket.on("ride-awaiting-payment", (data) => {
      if (!data?._id) return;
      if (newRide?._id && data._id !== newRide._id) return;
      setNewRide((prev) => ({ ...(prev || {}), ...(data || {}), status: "awaiting_payment" }));
      setShowBtn("payment");
      setShowRiderDetailsPanel(false);
      setShowNewRidePanel(true);
    });

    socket.on("ride-user-marked-paid", (data) => {
      if (!data?._id) return;
      if (newRide?._id && data._id !== newRide._id) return;
      setNewRide((prev) => ({ ...(prev || {}), ...(data || {}) }));
      showAlert("Pago reportado", "El usuario marcó el pago como realizado.", "success");
    });

    socket.on("ride-payment-confirmed", (data) => {
      if (!data?._id) return;
      if (newRide?._id && data._id !== newRide._id) return;
      showAlert("Pago confirmado", "Viaje completado correctamente.", "success");
      clearRideData();
      updateLocation();
    });

    return () => {
      socket.off("new-ride");
      socket.off("ride-cancelled");
      socket.off("ride-awaiting-payment");
      socket.off("ride-user-marked-paid");
      socket.off("ride-payment-confirmed");
    };
  }, [rider, newRide?._id]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    socket.emit("join-room", newRide._id);

    socket.on("receiveMessage", async (msg) => {
      // Console.log("Received message: ", msg);
      setMessages((prev) => [...prev, { msg, by: "other" }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [newRide]);

  useEffect(() => {
    localStorage.setItem("rideDetails", JSON.stringify(newRide));
  }, [newRide]);

  useEffect(() => {
    localStorage.setItem("showPanel", JSON.stringify(showNewRidePanel));
    localStorage.setItem("showBtn", JSON.stringify(showBtn));
  }, [showNewRidePanel, showBtn]);

  const calculateEarnings = () => {
    let Totalearnings = 0;
    let Todaysearning = 0;

    let acceptedRides = 0;
    let cancelledRides = 0;

    let distanceTravelled = 0;

    const today = new Date();
    const todayWithoutTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    rider.rides.forEach((ride) => {
      if (ride.status == "completed") {
        acceptedRides++;
        distanceTravelled += ride.distance;
      }
      if (ride.status == "cancelled") cancelledRides++;

      Totalearnings += ride.fare;
      const rideDate = new Date(ride.updatedAt);

      const rideDateWithoutTime = new Date(
        rideDate.getFullYear(),
        rideDate.getMonth(),
        rideDate.getDate()
      );

      if (
        rideDateWithoutTime.getTime() === todayWithoutTime.getTime() &&
        ride.status === "completed"
      ) {
        Todaysearning += ride.fare;
      }
    });

    setEarnings({ total: Totalearnings, today: Todaysearning });
    setRides({
      accepted: acceptedRides,
      cancelled: cancelledRides,
      distanceTravelled: Math.round(distanceTravelled / 1000),
    });
  };

  useEffect(() => {
    calculateEarnings();
  }, [rider]);

  useEffect(() => {
    if (socket.id) Console.log("socket id:", socket.id);
  }, [socket.id]);

  useEffect(() => {
    const handleThemeChange = (event) => {
      const theme = event?.detail?.theme || localStorage.getItem("homeTheme") || "light";
      setIsDarkHome(theme === "dark");
    };

    window.addEventListener("home-theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("home-theme-change", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("home-theme-dark", isDarkHome);
    return () => {
      document.body.classList.remove("home-theme-dark");
    };
  }, [isDarkHome]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setOptions({
      styles: isDarkHome ? DARK_MAP_STYLES : [],
    });
  }, [isDarkHome]);

  return (
    <div
      className="home-screen relative w-full h-dvh bg-contain"
      style={{ backgroundImage: `url(${map})` }}
    >
      <Alert
        heading={alert.heading}
        text={alert.text}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        type={alert.type}
      />
      <Sidebar
        homeThemeEnabled
        isDarkMode={isDarkHome}
        onToggleDarkMode={() => {
          const nextTheme = isDarkHome ? "light" : "dark";
          localStorage.setItem("homeTheme", nextTheme);
          window.dispatchEvent(new CustomEvent("home-theme-change", { detail: { theme: nextTheme } }));
        }}
      />
      <div
        ref={mapRef}
        className="w-full h-[80vh] top-0 left-0"
        id="rider-map"
      ></div>

      {showRiderDetailsPanel && (
        <div className="home-bottom-panel absolute bottom-0 flex flex-col justify-start p-4 gap-2 rounded-t-lg bg-white h-fit w-full">
          {/* Driver details */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="my-2 select-none rounded-full w-10 h-10 bg-blue-400 mx-auto flex items-center justify-center overflow-hidden">
                {rider?.profilephoto ? (
                  <img
                    src={rider.profilephoto}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <h1 className="text-lg text-white">
                    {rider?.fullname?.firstname[0]}
                    {rider?.fullname?.lastname[0]}
                  </h1>
                )}
              </div>

              <div>
                <h1 className="text-lg font-semibold leading-6">
                  {rider?.fullname?.firstname} {rider?.fullname?.lastname}
                </h1>
                <p className="text-xs flex items-center gap-1 text-gray-500 ">
                  <Phone size={12} />
                  {rider?.phone}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500 ">Ganancias</p>
              <h1 className="font-semibold">$ {earnings.today}</h1>
            </div>
          </div>

          {/* Ride details */}
          <div className="flex justify-around items-center mt-2 py-4 rounded-lg bg-zinc-800">
            <div className="flex flex-col items-center text-white">
              <h1 className="mb-1 text-xl">{rides?.accepted}</h1>
              <p className="text-xs text-gray-400 text-center leading-3">
                Viajes
                <br />
                Aceptados
              </p>
            </div>
            <div className="flex flex-col items-center text-white">
              <h1 className="mb-1 text-xl">{rides?.distanceTravelled}</h1>
              <p className="text-xs text-gray-400 text-center leading-3">
                Km
                <br />
                Viajados
              </p>
            </div>
            <div className="flex flex-col items-center text-white">
              <h1 className="mb-1 text-xl">{rides?.cancelled}</h1>
              <p className="text-xs text-gray-400 text-center leading-3">
                Viajes
                <br />
                Cancelados
              </p>
            </div>
          </div>

          {/* Car details */}
          <div className="flex justify-between border-2 items-center pl-3 py-2 rounded-lg">
            <div>
              <h1 className="text-lg font-semibold leading-6 tracking-tighter ">
                {rider?.vehicle?.number}
              </h1>
              <p className="text-xs text-gray-500 flex items-center">
                {rider?.vehicle?.color} |
                <User size={12} strokeWidth={2.5} /> {rider?.vehicle?.capacity}
              </p>
            </div>

            <img
              className="rounded-full h-16 scale-x-[-1]"
              src={
                {
                  car: "/car.png",
                  truck: "/np300.png",
                }[rider?.vehicle?.type] || "/default.png"
              }
              alt="Driver picture"
            />

          </div>
        </div>
      )}

      <NewRide
        rideData={newRide}
        otp={otp}
        setOtp={setOtp}
        showBtn={showBtn}
        showPanel={showNewRidePanel}
        setShowPanel={setShowNewRidePanel}
        showPreviousPanel={setShowRiderDetailsPanel}
        loading={loading}
        acceptRide={acceptRide}
        cancelRide={cancelRide}
        verifyOTP={verifyOTP}
        endRide={endRide}
        confirmPayment={confirmPayment}
        error={error}
      />
    </div>
  );
}

export default RiderHomeScreen;

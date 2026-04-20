import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import axios from "axios";
import { SocketDataContext } from "../contexts/SocketContext";

function UserRoutes() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ headers: { token } }), [token]);
  const { socket } = useContext(SocketDataContext);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [error, setError] = useState("");
  const [mapsReady, setMapsReady] = useState(Boolean(window.google?.maps));
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const userMarkerRef = useRef(null);
  const riderMarkersRef = useRef({});

  const showingDetails = Boolean(selectedRouteId && selectedRoute);

  const clearMapArtifacts = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.set("directions", null);
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
    Object.values(riderMarkersRef.current).forEach((marker) => marker.setMap(null));
    riderMarkersRef.current = {};
  };

  const loadRoutes = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/collective-routes`, headers);
      setRoutes(response.data.routes || []);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar las rutas");
    }
  };

  const loadRouteDetails = async (routeId) => {
    if (!routeId) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/collective-routes/${routeId}`, headers);
      setSelectedRoute(response.data.route);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cargar la ruta");
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    if (window.google?.maps) {
      setMapsReady(true);
      return;
    }

    const intervalId = window.setInterval(() => {
      if (window.google?.maps) {
        setMapsReady(true);
        window.clearInterval(intervalId);
      }
    }, 500);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!selectedRouteId) {
      setSelectedRoute(null);
      clearMapArtifacts();
      return;
    }
    loadRouteDetails(selectedRouteId);
  }, [selectedRouteId]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!socket || !selectedRouteId) return;
    socket.emit("join-collective-route", selectedRouteId);
    const handleLocationUpdate = (payload) => {
      setSelectedRoute((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          assignedRiders: (prev.assignedRiders || []).map((rider) =>
            rider._id === payload.riderId
              ? {
                  ...rider,
                  location: {
                    type: "Point",
                    coordinates: [payload.longitude, payload.latitude],
                  },
                }
              : rider
          ),
        };
      });
    };
    socket.on("collective-route-rider-location-update", handleLocationUpdate);
    return () => {
      socket.off("collective-route-rider-location-update", handleLocationUpdate);
    };
  }, [socket, selectedRouteId]);

  useEffect(() => {
    if (!selectedRoute || !mapsReady || !window.google || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: selectedRoute.origin.coordinates,
        zoom: 12,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
      });
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: false,
      });
      directionsRendererRef.current.setMap(mapInstanceRef.current);
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: selectedRoute.origin.coordinates,
        destination: selectedRoute.destination.coordinates,
        waypoints: (selectedRoute.stops || []).map((stop) => ({
          location: stop.coordinates,
          stopover: true,
        })),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result);
        }
      }
    );

    if (currentPosition) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new window.google.maps.Marker({
          position: currentPosition,
          map: mapInstanceRef.current,
          title: "Tu ubicacion",
          icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        });
      } else {
        userMarkerRef.current.setPosition(currentPosition);
      }
    }

    const nextRiderIds = new Set();
    (selectedRoute.assignedRiders || []).forEach((rider) => {
      if (!rider.location?.coordinates?.length) return;
      const position = {
        lat: rider.location.coordinates[1],
        lng: rider.location.coordinates[0],
      };
      nextRiderIds.add(rider._id);
      if (!riderMarkersRef.current[rider._id]) {
        riderMarkersRef.current[rider._id] = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: `${rider.fullname?.firstname || ""} ${rider.fullname?.lastname || ""}`.trim(),
          icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        });
      } else {
        riderMarkersRef.current[rider._id].setPosition(position);
      }
    });

    Object.keys(riderMarkersRef.current).forEach((riderId) => {
      if (!nextRiderIds.has(riderId)) {
        riderMarkersRef.current[riderId].setMap(null);
        delete riderMarkersRef.current[riderId];
      }
    });
  }, [selectedRoute, currentPosition, mapsReady]);

  const openRoute = (routeId) => {
    setError("");
    setSelectedRouteId(routeId);
  };

  const closeDetails = () => {
    setSelectedRouteId("");
    setSelectedRoute(null);
  };

  if (showingDetails) {
    return (
      <div className="sidebar-section-page w-full h-dvh flex flex-col p-4 gap-4 overflow-auto">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={closeDetails}
            className="mt-1 rounded-full border p-2 bg-white"
            aria-label="Volver a rutas"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{selectedRoute.name}</h1>
            <p className="text-sm text-zinc-600">
              Sigue la ruta y ubica a los conductores asignados en el mapa.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {!mapsReady && <p className="text-sm text-zinc-500">Cargando mapa...</p>}

        <div ref={mapRef} className="w-full h-80 rounded-2xl overflow-hidden border bg-zinc-100 shrink-0" />

        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div>
            <p className="text-sm text-zinc-600">
              {selectedRoute.origin?.label} {"->"} {selectedRoute.destination?.label}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Paradas</h3>
            <div className="space-y-2">
              {(selectedRoute.stops || []).map((stop) => (
                <div key={`${selectedRoute._id}-${stop.order}`} className="rounded-full bg-zinc-100 px-3 py-2 text-sm">
                  {stop.label}
                </div>
              ))}
              {selectedRoute.stops?.length === 0 && (
                <p className="text-sm text-zinc-500">Esta ruta no tiene paradas registradas.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Conductores en esta ruta</h3>
            <div className="space-y-2">
              {(selectedRoute.assignedRiders || []).map((rider) => (
                <div key={rider._id} className="rounded-lg border px-3 py-2 text-sm">
                  <div className="font-semibold">{rider.fullname?.firstname} {rider.fullname?.lastname}</div>
                  <div className="text-zinc-600">{rider.vehicle?.type} · {rider.vehicle?.color} · {rider.vehicle?.number}</div>
                  <div className="text-xs text-zinc-500">
                    {rider.location?.coordinates?.length ? "Ubicacion disponible" : "Sin ubicacion reciente"}
                  </div>
                </div>
              ))}
              {selectedRoute.assignedRiders?.length === 0 && (
                <p className="text-sm text-zinc-500">No hay conductores asignados todavia.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-section-page w-full h-dvh flex flex-col p-4 gap-4 overflow-auto">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate("/user/home")}
          className="mt-1 rounded-full border p-2 bg-white"
          aria-label="Volver"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Rutas informativas</h1>
          <p className="text-sm text-zinc-600">
            Consulta las rutas disponibles y abre cada una para ver su mapa y conductores.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-3">
        {routes.map((route) => (
          <button
            key={route._id}
            type="button"
            onClick={() => openRoute(route._id)}
            className="text-left rounded-lg border p-4 bg-white"
          >
            <h2 className="font-semibold">{route.name}</h2>
            <p className="text-sm text-zinc-600">{route.origin?.label} {"->"} {route.destination?.label}</p>
            <p className="text-xs text-zinc-500 mt-1">
              Paradas: {route.stops?.length || 0} · Conductores: {route.assignedRiders?.length || 0}
            </p>
          </button>
        ))}
      </div>

      {routes.length === 0 && (
        <div className="rounded-lg border bg-white p-4 text-sm text-zinc-500">
          No hay rutas disponibles por el momento.
        </div>
      )}
    </div>
  );
}

export default UserRoutes;

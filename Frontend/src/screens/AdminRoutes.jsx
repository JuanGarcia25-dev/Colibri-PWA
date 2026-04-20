import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Button } from "../components";

const emptyForm = {
  name: "",
  origin: null,
  destination: null,
  stops: [],
  assignedRiders: [],
  isActive: true,
};

const selectionModes = {
  origin: "origin",
  destination: "destination",
  stop: "stop",
};

function AdminRoutes() {
  const token = localStorage.getItem("token");
  const [routes, setRoutes] = useState([]);
  const [riders, setRiders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mapsReady, setMapsReady] = useState(Boolean(window.google?.maps));
  const [selectionMode, setSelectionMode] = useState(selectionModes.origin);
  const selectionModeRef = useRef(selectionModes.origin);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geocoderRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef({
    origin: null,
    destination: null,
    stops: [],
  });

  const headers = useMemo(() => ({ headers: { token } }), [token]);

  const loadData = async () => {
    try {
      const [routesResponse, ridersResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_SERVER_URL}/collective-routes/admin/list`, headers),
        axios.get(`${import.meta.env.VITE_SERVER_URL}/collective-routes/admin/riders`, headers),
      ]);
      setRoutes(routesResponse.data.routes || []);
      setRiders(ridersResponse.data.riders || []);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar las rutas");
    }
  };

  useEffect(() => {
    loadData();
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
    selectionModeRef.current = selectionMode;
  }, [selectionMode]);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 21.1291, lng: -99.4941 },
      zoom: 12,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
    });

    geocoderRef.current = new window.google.maps.Geocoder();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
    });
    directionsRendererRef.current.setMap(mapInstanceRef.current);

    mapInstanceRef.current.addListener("click", async (event) => {
      const currentMode = selectionModeRef.current;
      if (!currentMode) return;

      const point = await buildPointFromLatLng(event.latLng);
      if (!point) {
        setError("No se pudo obtener la direccion de ese punto");
        return;
      }

      setError("");
      setMessage("");

      setForm((prev) => {
        if (currentMode === selectionModes.origin) {
          return { ...prev, origin: point };
        }
        if (currentMode === selectionModes.destination) {
          return { ...prev, destination: point };
        }
        return {
          ...prev,
          stops: [...prev.stops, point],
        };
      });
    });
  }, [mapsReady]);

  useEffect(() => {
    if (!mapsReady || !mapInstanceRef.current) return;

    renderMarkers();
    renderDirections();
  }, [mapsReady, form.origin, form.destination, form.stops]);

  const buildPointFromLatLng = async (latLng) =>
    new Promise((resolve) => {
      if (!geocoderRef.current) {
        resolve(null);
        return;
      }

      geocoderRef.current.geocode({ location: latLng }, (results, status) => {
        if (status !== "OK" || !results?.length) {
          resolve(null);
          return;
        }

        resolve({
          label: results[0].formatted_address,
          coordinates: {
            lat: latLng.lat(),
            lng: latLng.lng(),
          },
        });
      });
    });

  const createMarker = (position, label, color) =>
    new window.google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      title: label,
      icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
    });

  const renderMarkers = () => {
    const { origin, destination, stops } = form;

    if (markersRef.current.origin) {
      markersRef.current.origin.setMap(null);
      markersRef.current.origin = null;
    }
    if (markersRef.current.destination) {
      markersRef.current.destination.setMap(null);
      markersRef.current.destination = null;
    }
    markersRef.current.stops.forEach((marker) => marker.setMap(null));
    markersRef.current.stops = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    if (origin) {
      markersRef.current.origin = createMarker(origin.coordinates, "Origen", "green");
      bounds.extend(origin.coordinates);
      hasPoints = true;
    }

    if (destination) {
      markersRef.current.destination = createMarker(destination.coordinates, "Destino", "red");
      bounds.extend(destination.coordinates);
      hasPoints = true;
    }

    markersRef.current.stops = stops.map((stop, index) => {
      bounds.extend(stop.coordinates);
      hasPoints = true;
      return createMarker(stop.coordinates, `Parada ${index + 1}`, "yellow");
    });

    if (hasPoints) {
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  const renderDirections = () => {
    if (!directionsRendererRef.current) return;

    if (!form.origin || !form.destination) {
      directionsRendererRef.current.set("directions", null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: form.origin.coordinates,
        destination: form.destination.coordinates,
        waypoints: form.stops.map((stop) => ({
          location: stop.coordinates,
          stopover: true,
        })),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          directionsRendererRef.current.setDirections(result);
        }
      }
    );
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setSelectionMode(selectionModes.origin);
    setMessage("");
    setError("");
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRider = (riderId) => {
    setForm((prev) => ({
      ...prev,
      assignedRiders: prev.assignedRiders.includes(riderId)
        ? prev.assignedRiders.filter((id) => id !== riderId)
        : [...prev.assignedRiders, riderId],
    }));
  };

  const handleEdit = (route) => {
    setEditingId(route._id);
    setForm({
      name: route.name || "",
      origin: route.origin || null,
      destination: route.destination || null,
      stops: (route.stops || []).map((stop) => ({
        label: stop.label,
        coordinates: stop.coordinates,
      })),
      assignedRiders: (route.assignedRiders || []).map((rider) => rider._id),
      isActive: route.isActive,
    });
    setSelectionMode(selectionModes.origin);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearPoint = (field) => {
    if (field === "stops") {
      setForm((prev) => ({ ...prev, stops: [] }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: null }));
  };

  const removeStop = (stopIndex) => {
    setForm((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, index) => index !== stopIndex),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!form.origin || !form.destination) {
      setLoading(false);
      setError("Selecciona origen y destino en el mapa antes de guardar");
      return;
    }

    const payload = {
      name: form.name,
      origin: form.origin,
      destination: form.destination,
      stops: form.stops,
      assignedRiders: form.assignedRiders,
      isActive: form.isActive,
    };

    try {
      const url = editingId
        ? `${import.meta.env.VITE_SERVER_URL}/collective-routes/admin/${editingId}`
        : `${import.meta.env.VITE_SERVER_URL}/collective-routes/admin`;
      const method = editingId ? "put" : "post";
      const response = await axios[method](url, payload, headers);
      setMessage(response.data.message || "Ruta guardada");
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.[0]?.msg || "No se pudo guardar la ruta");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (routeId) => {
    try {
      await axios.patch(`${import.meta.env.VITE_SERVER_URL}/collective-routes/admin/${routeId}/status`, {}, headers);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cambiar el estado");
    }
  };

  const removeRoute = async (routeId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_SERVER_URL}/collective-routes/admin/${routeId}`, headers);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo eliminar la ruta");
    }
  };

  const selectedModeLabel =
    selectionMode === selectionModes.origin
      ? "Haz clic en el mapa para fijar el origen"
      : selectionMode === selectionModes.destination
      ? "Haz clic en el mapa para fijar el destino"
      : "Haz clic en el mapa para agregar una parada";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Rutas</h1>
        <p className="text-sm text-zinc-600">
          Crea rutas informativas con puntos exactos en el mapa para evitar direcciones equivocadas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-4 space-y-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <label className="block text-sm font-semibold mb-1">Nombre de la ruta</label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Nombre de la ruta"
              required
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
              />
              Ruta activa
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`px-3 py-2 rounded-lg border text-sm ${selectionMode === selectionModes.origin ? "bg-black text-white" : ""}`}
              onClick={() => setSelectionMode(selectionModes.origin)}
            >
              Seleccionar origen
            </button>
            <button
              type="button"
              className={`px-3 py-2 rounded-lg border text-sm ${selectionMode === selectionModes.destination ? "bg-black text-white" : ""}`}
              onClick={() => setSelectionMode(selectionModes.destination)}
            >
              Seleccionar destino
            </button>
            <button
              type="button"
              className={`px-3 py-2 rounded-lg border text-sm ${selectionMode === selectionModes.stop ? "bg-black text-white" : ""}`}
              onClick={() => setSelectionMode(selectionModes.stop)}
            >
              Agregar parada
            </button>
          </div>

          <p className="text-sm text-zinc-500">{selectedModeLabel}</p>

          <div
            ref={mapRef}
            className="w-full h-96 rounded-2xl overflow-hidden border bg-zinc-100"
          />

          {!mapsReady && <p className="text-sm text-zinc-500">Cargando mapa...</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-sm font-semibold">Origen</h2>
              <button type="button" className="text-xs text-red-600" onClick={() => clearPoint("origin")}>
                Limpiar
              </button>
            </div>
            <p className="text-sm text-zinc-700">
              {form.origin?.label || "Sin origen seleccionado"}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-sm font-semibold">Destino</h2>
              <button type="button" className="text-xs text-red-600" onClick={() => clearPoint("destination")}>
                Limpiar
              </button>
            </div>
            <p className="text-sm text-zinc-700">
              {form.destination?.label || "Sin destino seleccionado"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Paradas intermedias</h2>
            <button type="button" className="text-xs text-red-600" onClick={() => clearPoint("stops")}>
              Limpiar todas
            </button>
          </div>

          {form.stops.length === 0 && (
            <p className="text-sm text-zinc-500">Todavia no has agregado paradas.</p>
          )}

          <div className="space-y-2">
            {form.stops.map((stop, index) => (
              <div key={`${stop.label}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div>
                  <div className="font-semibold text-sm">Parada {index + 1}</div>
                  <div className="text-sm text-zinc-600">{stop.label}</div>
                </div>
                <button type="button" className="text-xs text-red-600" onClick={() => removeStop(index)}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2">Conductores asignados</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {riders.map((rider) => (
              <label key={rider._id} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.assignedRiders.includes(rider._id)}
                  onChange={() => toggleRider(rider._id)}
                />
                <div>
                  <div className="font-semibold">
                    {rider.fullname?.firstname} {rider.fullname?.lastname}
                  </div>
                  <div className="text-zinc-500">
                    {rider.vehicle?.type} · {rider.vehicle?.color} · {rider.vehicle?.number}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Button title={editingId ? "Actualizar ruta" : "Crear ruta"} type="submit" loading={loading} />
          {(editingId || form.origin || form.destination || form.stops.length > 0) && (
            <button type="button" className="px-4 py-2 rounded-lg border" onClick={resetForm}>
              Cancelar edicion
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {routes.map((route) => (
          <div key={route._id} className="bg-white rounded-lg border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-semibold text-lg">{route.name}</h2>
                <p className="text-sm text-zinc-600">
                  {route.origin?.label} {"->"} {route.destination?.label}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Paradas: {route.stops?.length || 0} · Conductores: {route.assignedRiders?.length || 0}
                </p>
                <p className={`text-xs mt-1 font-semibold ${route.isActive ? "text-green-600" : "text-zinc-500"}`}>
                  {route.isActive ? "Activa" : "Inactiva"}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className="px-3 py-2 rounded-lg border text-sm" onClick={() => handleEdit(route)}>
                  Editar
                </button>
                <button type="button" className="px-3 py-2 rounded-lg border text-sm" onClick={() => toggleStatus(route._id)}>
                  {route.isActive ? "Desactivar" : "Activar"}
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm"
                  onClick={() => removeRoute(route._id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminRoutes;

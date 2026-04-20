import { useEffect, useState } from "react";
import axios from "axios";

const docLabels = {
  curp: "CURP",
  ine: "INE",
  license: "Licencia",
  tioVigente: "TIO vigente (Tarjetón de identificación)",
  tarjetaCirculacion: "Tarjeta de circulación",
  vehicleFront: "Frente vehículo",
  vehicleRear: "Trasera vehículo",
  vehiclePlate: "Placa",
};

function AdminDriverApprovals() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [signedUrls, setSignedUrls] = useState({});
  const [preview, setPreview] = useState(null);
  const token = localStorage.getItem("token");
  const signedCacheKey = "signedDocUrlCache";
  const cacheTtlMs = 5 * 60 * 1000;

  const readCache = () => {
    try {
      return JSON.parse(localStorage.getItem(signedCacheKey)) || {};
    } catch {
      return {};
    }
  };

  const writeCache = (key, url) => {
    const now = Date.now();
    const cache = readCache();
    cache[key] = { url, expiresAt: now + cacheTtlMs };
    localStorage.setItem(signedCacheKey, JSON.stringify(cache));
  };

  const fetchApplications = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/admin/driver-applications?status=pending`,
        { headers: { token } }
      );
      setApplications(response.data.applications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar solicitudes");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(true); // solo la primera vez
  }, []);

  const getSigned = async (key) => {
    if (!key) return null;
    if (signedUrls[key]) return signedUrls[key];
    const cache = readCache();
    const cached = cache[key];
    if (cached && cached.url && cached.expiresAt > Date.now()) {
      setSignedUrls((prev) => ({ ...prev, [key]: cached.url }));
      return cached.url;
    }
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/admin/doc-url?key=${encodeURIComponent(key)}`,
        { headers: { token } }
      );
      const url = response.data.url;
      if (url) {
        setSignedUrls((prev) => ({ ...prev, [key]: url }));
        writeCache(key, url);
      }
      return url;
    } catch (err) {
      setError(err.response?.data?.message || "Error al abrir documento");
      return null;
    }
  };

  const approve = async (id) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/admin/driver-applications/${id}/approve`,
        {},
        { headers: { token } }
      );
      fetchApplications(false);
    } catch (err) {
      setError(err.response?.data?.message || "Error al aprobar");
    }
  };

  const reject = async (id) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/admin/driver-applications/${id}/reject`,
        { notes: rejectNote },
        { headers: { token } }
      );
      setRejectNote("");
      fetchApplications(false);
    } catch (err) {
      setError(err.response?.data?.message || "Error al rechazar");
    }
  };

  const reviewDoc = async (appId, docKey, status, note = "") => {
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/admin/driver-applications/${appId}/docs/${docKey}/review`,
        { status, note },
        { headers: { token } }
      );
      fetchApplications(false);
    } catch (err) {
      setError(err.response?.data?.message || "Error al revisar documento");
    }
  };

  const allDocsApproved = (docs) => {
    if (!docs) return false;
    return Object.keys(docLabels).every((k) => docs[k]?.status === "approved");
  };

  const openPdf = async (doc, label, appId, docKey, status, note) => {
    const url = await getSigned(doc.key);
    if (url) {
      window.open(url, "_blank");
      setPreview({
        url,
        label,
        type: "pdf",
        appId,
        docKey,
        status,
        note,
      });
    }
  };

  const openImage = async (doc, label, appId, docKey, status, note) => {
    const url = await getSigned(doc.key);
    if (url) {
      setPreview({
        url,
        label,
        type: "image",
        appId,
        docKey,
        status,
        note,
      });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Solicitudes de Conductores</h1>
      <p className="text-sm text-zinc-600 mb-6">
        Revisa documentos y aprueba o rechaza solicitudes.
      </p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay solicitudes pendientes.</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app._id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">
                    {app.fullname?.firstname} {app.fullname?.lastname}
                  </h3>
                  <p className="text-sm text-zinc-600">{app.email}</p>
                  <p className="text-xs text-zinc-500">
                    Tel: {app.phoneCountryCode ? `${app.phoneCountryCode} ` : ""}{app.phone} | Emergencia: {app.emergencyPhoneCountryCode ? `${app.emergencyPhoneCountryCode} ` : ""}{app.emergencyPhone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 text-sm rounded bg-green-600 text-white disabled:opacity-50"
                    onClick={() => approve(app._id)}
                    disabled={!allDocsApproved(app.documents)}
                  >
                    Aprobar
                  </button>
                  <button
                    className="px-3 py-2 text-sm rounded bg-red-600 text-white"
                    onClick={() => reject(app._id)}
                  >
                    Rechazar
                  </button>
                </div>
              </div>

              {app.profilephoto?.key && (
                <div className="mt-3 text-sm">
                  <div className="font-semibold mb-1">Foto de perfil de conductor</div>
                  <button
                    className="text-blue-600 underline text-left"
                    onClick={() =>
                      openImage(
                        app.profilephoto,
                        "Foto de perfil de conductor",
                        app._id,
                        "profilephoto",
                        "approved",
                        ""
                      )
                    }
                  >
                    Ver foto de perfil
                  </button>
                </div>
              )}

              <div className="mt-3 text-sm">
                <div className="font-semibold">Vehículo</div>
                <div className="text-zinc-600">
                  {app.vehicle?.brand} {app.vehicle?.model} ({app.vehicle?.auto})
                </div>
                <div className="text-zinc-600">
                  Tipo: {app.vehicle?.type} | Capacidad: {app.vehicle?.capacity}
                </div>
                <div className="text-zinc-600">Color: {app.vehicle?.color}</div>
                <div className="text-zinc-600">Placa: {app.vehicle?.plate}</div>
                <div className="text-zinc-600">
                  Seguro: {app.vehicle?.hasInsurance ? "Sí" : "No"}
                </div>
              </div>

              <div className="mt-3 text-sm">
                <div className="font-semibold mb-1">Documentos</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {Object.keys(docLabels).map((docKey) => {
                    const doc = app.documents?.[docKey];
                    if (!doc) return null;
                    const isPdf = doc.key && doc.key.toLowerCase().endsWith(".pdf");

                    return (
                      <div key={docKey} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">{docLabels[docKey]}</div>
                          <div className="text-xs">
                            {doc.status === "approved" ? (
                              <span className="inline-flex items-center gap-1 text-green-700">
                                <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
                                Aprobado
                              </span>
                            ) : doc.status === "rejected" ? (
                              <span className="inline-flex items-center gap-1 text-red-700">
                                <span className="inline-block h-2 w-2 rounded-full bg-red-600" />
                                Rechazado
                              </span>
                            ) : (
                              <span className="text-zinc-500">Pendiente</span>
                            )}
                          </div>
                        </div>

                        {isPdf ? (
                          <button
                            className="text-blue-600 underline text-left mb-2"
                            onClick={() =>
                              openPdf(
                                doc,
                                docLabels[docKey],
                                app._id,
                                docKey,
                                doc.status || "pending",
                                doc.note || ""
                              )
                            }
                          >
                            Ver PDF
                          </button>
                        ) : (
                          <button
                            className="text-blue-600 underline text-left mb-2"
                            onClick={() =>
                              openImage(
                                doc,
                                docLabels[docKey],
                                app._id,
                                docKey,
                                doc.status || "pending",
                                doc.note || ""
                              )
                            }
                          >
                            Ver Documento
                          </button>
                        )}

                        {doc.note && (
                          <div className="text-xs text-red-600 mb-2">
                            Nota: {doc.note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-zinc-500">Motivo de rechazo (solicitud)</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border rounded text-sm"
                  rows={2}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Describe por qué se rechaza la solicitud"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-3xl w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{preview.label}</h3>
              <button
                className="px-2 py-1 text-sm rounded bg-zinc-200"
                onClick={() => setPreview(null)}
              >
                Cerrar
              </button>
            </div>

            {preview.type === "image" ? (
              <img
                src={preview.url}
                alt={preview.label}
                className="w-full max-h-[70vh] object-contain rounded"
              />
            ) : (
              <div className="text-sm text-zinc-600 mb-4">
                El PDF se abrió en otra pestaña. Si necesitas volver a abrirlo, da
                clic en "Abrir PDF".
                <button
                  className="ml-2 text-blue-600 underline"
                  onClick={() => window.open(preview.url, "_blank")}
                >
                  Abrir PDF
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs">
                {preview.status === "approved" ? (
                  <span className="inline-flex items-center gap-1 text-green-700">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
                    Aprobado
                  </span>
                ) : preview.status === "rejected" ? (
                  <span className="inline-flex items-center gap-1 text-red-700">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-600" />
                    Rechazado
                  </span>
                ) : (
                  <span className="text-zinc-500">Pendiente</span>
                )}
                {preview.note ? (
                  <span className="ml-2 text-red-600">Nota: {preview.note}</span>
                ) : null}
              </div>

              {preview.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 text-sm rounded bg-green-600 text-white"
                    onClick={async () => {
                      await reviewDoc(preview.appId, preview.docKey, "approved");
                      setPreview(null);
                    }}
                  >
                    Aprobar doc
                  </button>
                  <button
                    className="px-3 py-2 text-sm rounded bg-red-600 text-white"
                    onClick={async () => {
                      const note = prompt("Motivo de rechazo del documento");
                      await reviewDoc(preview.appId, preview.docKey, "rejected", note || "");
                      setPreview(null);
                    }}
                  >
                    Rechazar doc
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDriverApprovals;

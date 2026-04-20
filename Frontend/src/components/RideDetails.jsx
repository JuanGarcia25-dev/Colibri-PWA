import {
  CreditCard,
  MapPinMinus,
  MapPinPlus,
  PhoneCall,
  SendHorizontal,
  Share2,
} from "lucide-react";
import Button from "./Button";

function RideDetails({
  pickupLocation,
  destinationLocation,
  selectedVehicle,
  fare,
  showPanel,
  createRide,
  markUserPaid,
  cancelRide,
  loading,
  rideCreated,
  confirmedRideData,
  eta,
}) {
  const payment = confirmedRideData?.payment || {};
  const amountMxn = Number(payment.amountMxn ?? fare?.[selectedVehicle] ?? 0);
  const amountUsd = Number(payment.amountUsd ?? 0);

  const formatMxn = (amount) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
      Number.isFinite(Number(amount)) ? Number(amount) : 0
    );

  const formatUsd = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
      Number.isFinite(Number(amount)) ? Number(amount) : 0
    );

  const hasActiveRide = Boolean(confirmedRideData?._id);
  const canCancelRide =
    rideCreated &&
    (!hasActiveRide || confirmedRideData?.status === "accepted");
  const isAwaitingPayment = confirmedRideData?.status === "awaiting_payment";
  const isCompleted = confirmedRideData?.status === "completed";

  const rideStatusMessage =
    isCompleted
      ? "Pago confirmado"
      : isAwaitingPayment
      ? "Pendiente de pago"
      : confirmedRideData?.status === "ongoing"
      ? "Viaje en curso - Paga al finalizar"
      : eta
      ? `Conductor en camino · ETA ${eta}`
      : "Conductor en camino";

  const shareRide = async () => {
    try {
      const shareLink = `${window.location.origin}/ride/share/${confirmedRideData?._id}`;
      const shareText = `Sígueme en mi viaje en vivo. Estoy yendo a ${destinationLocation}. Haz clic para ver mi ubicación en tiempo real: ${shareLink}`;

      if (navigator.share) {
        await navigator.share({
          title: "Mi viaje en tiempo real",
          text: shareText,
          url: shareLink,
        });
      } else {
        const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappLink, "_blank");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error al compartir:", error);
      }
    }
  };

  return (
    <div
      className={`${
        showPanel ? "bottom-0" : "-bottom-[60%]"
      } home-sheet transition-all duration-500 absolute bg-white w-full rounded-t-xl p-4 pt-2`}
    >
      <div>
        {rideCreated && !confirmedRideData && (
          <>
            <h1 className="text-center">Buscando conductores cercanos</h1>
            <div className="overflow-y-hidden py-2 pb-2">
              <div className="h-1 rounded-full bg-blue-500 animate-ping"></div>
            </div>
          </>
        )}

        <div
          className={`flex ${
            confirmedRideData ? " justify-between " : " justify-center "
          } pt-2 pb-4`}
        >
          <div className="flex items-center gap-3">
            {confirmedRideData?._id ? (
              <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center">
                {confirmedRideData?.rider?.profilephoto ? (
                  <img
                    className="w-full h-full object-cover"
                    src={confirmedRideData.rider.profilephoto}
                    alt="Conductor"
                  />
                ) : (
                  <span className="text-lg font-semibold text-zinc-600">
                    {confirmedRideData?.rider?.fullname?.firstname?.[0] || ""}
                    {confirmedRideData?.rider?.fullname?.lastname?.[0] || ""}
                  </span>
                )}
              </div>
            ) : (
              <img
                className="h-12 rounded-full scale-x-[-1]"
                src={
                  {
                    car: "/car.png",
                    truck: "/np300.png",
                  }[selectedVehicle] || "/default.png"
                }
                alt="Vehicle"
              />
            )}
          </div>

          {confirmedRideData?._id && (
            <div className="leading-4 text-right">
              <h1 className="text-sm ">
                {confirmedRideData?.rider?.fullname?.firstname}{" "}
                {confirmedRideData?.rider?.fullname?.lastname}
              </h1>
              <h1 className="font-semibold">
                {confirmedRideData?.rider?.vehicle?.number}
              </h1>
              <div className="flex items-center justify-end gap-2 mt-1">
                <h1 className="capitalize text-xs text-zinc-400">
                  {confirmedRideData?.rider?.vehicle?.color}{" "}
                  {confirmedRideData?.rider?.vehicle?.type}
                </h1>
                <img
                  className="h-6 scale-x-[-1]"
                  src={
                    {
                      car: "/car.png",
                      truck: "/np300.png",
                    }[confirmedRideData?.rider?.vehicle?.type || selectedVehicle] ||
                    "/default.png"
                  }
                  alt="Vehiculo"
                />
              </div>
              {eta && (
                <h1 className="text-xs font-bold text-blue-600 mt-1">ETA: {eta}</h1>
              )}
              {confirmedRideData?.status === "accepted" && (
                <span className="mt-1 inline-block bg-black text-white px-3 py-1 rounded font-semibold">
                  OTP: {confirmedRideData?.otp}
                </span>
              )}
            </div>
          )}
        </div>

        {confirmedRideData?._id && (
          <div className="flex gap-2 mb-2">
            <Button
              type={"link"}
              path={`/user/chat/${confirmedRideData?._id}`}
              title={"Enviar un mensaje..."}
              icon={<SendHorizontal strokeWidth={1.5} size={18} />}
              classes={"bg-zinc-100 font-medium text-sm text-zinc-950"}
            />
            <div
              className="flex items-center justify-center w-14 rounded-md bg-zinc-100 cursor-pointer hover:bg-zinc-200 transition-colors"
              onClick={shareRide}
            >
              <Share2 size={18} strokeWidth={2} color="black" />
            </div>
            <div className="flex items-center justify-center w-14 rounded-md bg-zinc-100">
              <a href={"tel:" + confirmedRideData?.rider?.phone}>
                <PhoneCall size={18} strokeWidth={2} color="black" />
              </a>
            </div>
          </div>
        )}

        <div className="mb-2">
          <div className="flex items-center gap-3 border-t-2 py-2 px-2">
            <MapPinMinus size={18} />
            <div>
              <h1 className="text-lg font-semibold leading-5">
                {pickupLocation.split(", ")[0]}
              </h1>
              <div className="flex">
                <p className="text-xs text-gray-800 inline">
                  {pickupLocation.split(", ").map((location, index) => {
                    if (index > 0) {
                      return (
                        <span key={index}>
                          {location}
                          {index < pickupLocation.split(", ").length - 1 && ", "}
                        </span>
                      );
                    }
                    return null;
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t-2 py-2 px-2">
            <MapPinPlus size={18} />
            <div>
              <h1 className="text-lg font-semibold leading-5">
                {destinationLocation.split(", ")[0]}
              </h1>
              <div className="flex">
                <p className="text-xs text-gray-800 inline">
                  {destinationLocation.split(", ").map((location, index) => {
                    if (index > 0) {
                      return (
                        <span key={index}>
                          {location}
                          {index < destinationLocation.split(", ").length - 1 && ", "}
                        </span>
                      );
                    }
                    return null;
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t-2 py-2 px-2">
            <CreditCard size={18} />
            <div>
              <h1 className="text-lg font-semibold leading-6">{formatMxn(amountMxn)} MXN</h1>
              <p className="text-xs text-gray-800 ">
                Efectivo · {amountUsd > 0 ? `≈ ${formatUsd(amountUsd)} USD` : "USD no disponible"}
              </p>
            </div>
          </div>
        </div>

        {canCancelRide ? (
          <Button
            title={"Cancelar viaje"}
            loading={loading}
            classes={"bg-red-600 "}
            fun={cancelRide}
          />
        ) : !rideCreated && !hasActiveRide ? (
          <Button title={"Confirmar viaje"} fun={createRide} loading={loading} />
        ) : isAwaitingPayment ? (
          <div className="space-y-2">
            <div className="text-center text-sm font-semibold text-amber-600 py-1">
              Total a pagar: {formatMxn(amountMxn)} MXN {amountUsd > 0 ? `(≈ ${formatUsd(amountUsd)} USD)` : ""}
            </div>
            {payment?.userMarkedPaidAt ? (
              <div className="text-center text-sm font-semibold text-blue-600 py-1">
                Pago realizado. Esperando confirmación del conductor.
              </div>
            ) : (
              <Button
                title={"Ya pagué"}
                loading={loading}
                fun={markUserPaid}
                classes={"bg-emerald-600"}
              />
            )}
          </div>
        ) : (
          <div className="text-center text-sm font-semibold text-blue-600 py-2">
            {rideStatusMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default RideDetails;

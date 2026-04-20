import {
  CreditCard,
  MapPinMinus,
  MapPinPlus,
  PhoneCall,
  SendHorizontal,
  Share2,
} from "lucide-react";
import Button from "./Button";

function NewRide({
  rideData,
  otp,
  setOtp,
  showBtn,
  showPanel,
  setShowPanel,
  showPreviousPanel,
  loading,
  acceptRide,
  cancelRide,
  endRide,
  verifyOTP,
  confirmPayment,
  error,
}) {
  const payment = rideData?.payment || {};
  const amountMxn = Number(payment.amountMxn ?? rideData?.fare ?? 0);
  const amountUsd = Number(payment.amountUsd ?? 0);

  const formatMxn = (amount) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
      Number.isFinite(Number(amount)) ? Number(amount) : 0
    );

  const formatUsd = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
      Number.isFinite(Number(amount)) ? Number(amount) : 0
    );

  const shareRide = async () => {
    try {
      const shareLink = `${window.location.origin}/ride/share/${rideData?._id}`;
      const shareText = `Sígueme en mi viaje en vivo. Estoy yendo a ${rideData.destination}. Haz clic para ver mi ubicación en tiempo real: ${shareLink}`;

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
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error al compartir:", err);
      }
    }
  };

  const ignoreRide = () => {
    setShowPanel(false);
    showPreviousPanel(true);
  };

  return (
    <div
      className={`${
        showPanel ? "bottom-0" : "-bottom-[60%]"
      } home-sheet transition-all duration-500 absolute bg-white w-full rounded-t-xl p-4 pt-0`}
    >
      <div>
        <div className="flex justify-between items-center pb-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="my-2 select-none rounded-full w-10 h-10 bg-green-500 mx-auto flex items-center justify-center overflow-hidden">
              {rideData?.user?.profilephoto ? (
                <img
                  src={rideData.user.profilephoto}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <h1 className="text-lg text-white">
                  {rideData?.user?.fullname?.firstname?.[0]}
                  {rideData?.user?.fullname?.lastname?.[0]}
                </h1>
              )}
            </div>

            <div>
              <h1 className="text-lg font-semibold leading-6">
                {rideData?.user?.fullname?.firstname} {rideData?.user?.fullname?.lastname}
              </h1>
              <p className="text-xs text-gray-500 ">
                {rideData?.user?.phone || rideData?.user?.email}
              </p>
            </div>
          </div>

          <div className="text-right">
            <h1 className="font-semibold text-lg">{formatMxn(amountMxn)} MXN</h1>
            <p className="text-xs text-gray-500 ">
              {amountUsd > 0 ? `≈ ${formatUsd(amountUsd)} USD` : "USD no disponible"}
            </p>
          </div>
        </div>

        {showBtn !== "accept" && (
          <div className="flex gap-2 mb-2">
            <Button
              type={"link"}
              path={`/rider/chat/${rideData?._id}`}
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
              <a href={"tel:" + rideData?.user?.phone}>
                <PhoneCall size={18} strokeWidth={2} color="black" />
              </a>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-3 border-t-2 py-2 px-2">
            <MapPinMinus size={18} />
            <div>
              <h1 className="text-lg font-semibold leading-5">
                {rideData.pickup.split(", ")[0]}
              </h1>
              <div className="flex">
                <p className="text-xs text-gray-800 inline">
                  {rideData.pickup.split(", ").map((location, index) => {
                    if (index > 0) {
                      return (
                        <span key={index}>
                          {location}
                          {index < rideData.pickup.split(", ").length - 1 && ", "}
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
                {rideData.destination.split(", ")[0]}
              </h1>
              <div className="flex">
                <p className="text-xs text-gray-800 inline">
                  {rideData.destination.split(", ").map((location, index) => {
                    if (index > 0) {
                      return (
                        <span key={index}>
                          {location}
                          {index < rideData.destination.split(", ").length - 1 && ", "}
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

        {showBtn === "accept" ? (
          <div className="flex gap-2">
            <Button
              title={"Ignorar"}
              loading={loading}
              fun={ignoreRide}
              classes={"bg-white text-zinc-900 border-2 border-black"}
            />
            <Button title={"Aceptar"} fun={acceptRide} loading={loading} />
          </div>
        ) : showBtn === "otp" ? (
          <>
            <input
              type="text"
              minLength={6}
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
              placeholder={"Ingresar OTP"}
              className="w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm mb-2"
            />
            {error && <p className="text-red-500 text-xs mb-2 text-center">{error}</p>}
            <div className="flex gap-2">
              <Button
                title={"Cancelar viaje"}
                loading={loading}
                fun={cancelRide}
                classes={"bg-red-600"}
              />
              <Button title={"Verificar OTP"} loading={loading} fun={verifyOTP} />
            </div>
          </>
        ) : showBtn === "end-ride" ? (
          <Button
            title={"Finalizar viaje"}
            fun={endRide}
            loading={loading}
            classes={"bg-green-600 "}
          />
        ) : (
          <div className="space-y-2">
            <div className="text-center text-sm font-semibold text-amber-600 py-1">
              Cobra al pasajero: {formatMxn(amountMxn)} MXN {amountUsd > 0 ? `(≈ ${formatUsd(amountUsd)} USD)` : ""}
            </div>
            {payment?.userMarkedPaidAt && (
              <div className="text-center text-xs text-blue-600">
                El usuario marcó realizado el pago.
              </div>
            )}
            <Button
              title={"Pago recibido"}
              fun={confirmPayment}
              loading={loading}
              classes={"bg-emerald-600"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default NewRide;

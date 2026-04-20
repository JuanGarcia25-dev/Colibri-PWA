import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import mailImg from "/mail.png";
import { Button } from "../components";
import useCooldownTimer from "../hooks/useCooldownTimer";

const VerifyEmail = ({ user, role }) => {
  const { userType } = useParams();
  const resolvedRole = role || userType;
  const token = localStorage.getItem("token");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { timeLeft, isActive, startCooldown } = useCooldownTimer(60000, "verify-email-otp");

  const sendVerificationEmail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/mail/verify-${resolvedRole}-email`,
        {
          headers: { token: token },
        }
      );
      if (response.status === 200) {
        setMessage("Te enviamos un codigo a tu correo.");
        startCooldown();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "No se pudo enviar el codigo.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setMessage("Ingresa un codigo de 6 digitos.");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/${resolvedRole}/verify-email-otp`,
        { otp },
        { headers: { token: token } }
      );
      if (response.status === 200) {
        setMessage("Tu correo ha sido verificado exitosamente.");

        const current = JSON.parse(localStorage.getItem("userData"));
        if (current?.data) {
          const updated = { ...current, data: { ...current.data, emailVerified: true } };
          localStorage.setItem("userData", JSON.stringify(updated));
        }

        setTimeout(() => {
          window.location.href = "/user/home";
        }, 800);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "No se pudo verificar el codigo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      sendVerificationEmail();
    }
  }, []);

  return (
    <div className="w-full h-dvh flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-2xl font-bold">Verificación de Correo</h1>
      <img src={mailImg} alt="Verify Email" className="h-24 mx-auto mb-4" />

      <p className="text-sm text-zinc-600 mb-3">
        Ingresa el código enviado a tu correo {user?.email ? `(${user.email})` : ""}.
      </p>

      <input
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        className="w-40 text-center tracking-[0.3em] text-lg border-2 border-zinc-300 rounded-lg p-2 mb-3"
        placeholder="______"
      />

      {message && <p className="text-sm font-semibold mb-3">{message}</p>}

      <Button title={loading ? "Verificando..." : "Verificar"} fun={verifyOtp} disabled={loading} />

      <div className="mt-3">
        <button
          type="button"
          className="text-sm underline text-zinc-700 disabled:opacity-50"
          onClick={sendVerificationEmail}
          disabled={loading || isActive}
        >
          {isActive ? `Reenviar en ${timeLeft}s` : "Reenviar codigo"}
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;

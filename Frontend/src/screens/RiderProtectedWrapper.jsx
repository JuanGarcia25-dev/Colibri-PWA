import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRider } from "../contexts/RiderContext";
import VerifyEmail from "./VerifyEmail";
import Loading from "./Loading";

function RiderProtectedWrapper({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { rider, setRider } = useRider();

  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/rider/profile`, {
        headers: {
          token: token,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          const riderData = response.data.rider;
          setRider(riderData);
          localStorage.setItem(
            "userData",
            JSON.stringify({ type: "rider", data: riderData })
          );
          setIsVerified(riderData.emailVerified);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, navigate, setRider]);

  if (loading) return <Loading />;

  if (isVerified === false) {
    return <VerifyEmail user={rider} role={"rider"} />;
  }

  return <>{children}</>;
}

export default RiderProtectedWrapper;

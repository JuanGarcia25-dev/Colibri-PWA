import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import VerifyEmail from "./VerifyEmail";
import Loading from "./Loading";

function UserProtectedWrapper({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/user/profile`, {
        headers: {
          token: token,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          const userData = response.data.user;
          setUser(userData);
          localStorage.setItem(
            "userData",
            JSON.stringify({ type: "user", data: userData })
          );
          setIsVerified(userData.emailVerified);
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
  }, [token, navigate]);

  if (loading || !token) return <Loading />;

  if (isVerified === false) {
    return <VerifyEmail user={user} role={"user"} />;
  }

  return <>{children}</>;
}


export default UserProtectedWrapper;

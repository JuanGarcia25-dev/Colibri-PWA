import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";

function AdminProtectedWrapper({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const userData = localStorage.getItem("userData");
    if (!userData || JSON.parse(userData).type !== "admin") {
      navigate("/login");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/admin/profile`, {
        headers: { token },
      })
      .then(() => {
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/login");
      });
  }, [token, navigate]);

  if (loading) return <Loading />;

  return <>{children}</>;
}

export default AdminProtectedWrapper;

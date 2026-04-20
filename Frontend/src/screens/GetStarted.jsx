import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/index";
import background from "/getride.png";
import { useNavigate } from "react-router-dom";
import logo from "/Logo.png";

function GetStarted() {
  const navigate = useNavigate();
  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.type == "user") {
        navigate("/user/home");
      } else if (parsed.type == "rider") {
        navigate("/rider/home");
      } else if (parsed.type == "admin") {
        navigate("/admin/home");
      }
    }
  }, [navigate]);
  return (
    <div
      className="flex flex-col justify-between w-full h-full bg-contain bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${background})`,
        backgroundColor: "#e6ecff",
      }}
    >
      <img
        className="h-10 object-contain m-4 self-start"
        src={logo}
        alt="Logo"
      />

      <div className="flex flex-col p-2 pb-6 gap-7 rounded-t-lg bg-[#d31c5b] text-white shadow-lg shadow-pink-800/30">
        <h1 className="text-2xl font-semibold">Bienvenido a Colibri</h1>
        <Button
          title={"Continuar"}
          path={"/login"}
          type={"link"}
          icon={<ArrowRight className="text-white" />}
          classes="bg-[#9b1b4f] text-white border-none hover:bg-[#d31c5b] transition"
        />
      </div>
    </div>
  );
}

export default GetStarted;

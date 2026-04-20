import { Button } from "../components";
import { useNavigate } from "react-router-dom";

const Error = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full h-dvh flex items-center text-center p-4">
      <div className="">
        <h1 className="text-6xl font-bold">404</h1>

        <h2 className="text-3xl font-semibold">Página no encontrada</h2>
        <p className="text-gray-600 my-6">
          La página que buscas no existe o ha sido movida.
        </p>
        <Button
          title="Volver al inicio"
          classes="bg-orange-500"
          fun={() => navigate("/")}
        />
      </div>
    </div>
  );
};

export default Error;

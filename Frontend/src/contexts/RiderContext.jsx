import { createContext, useContext, useState } from "react";

export const riderDataContext = createContext();

function RiderContext({ children }) {
  const userData = JSON.parse(localStorage.getItem("userData"));

  const [rider, setRider] = useState(
    userData?.type == "rider"
      ? userData.data
      : {
        email: "",
        fullname: {
          firstname: "",
          lastname: "",
        },
        vehicle: {
          color: "",
          number: "",
          capacity: 0,
          type: "",
        },
        rides: [],
        status: "inactive",
      }
  );

  return (
    <riderDataContext.Provider value={{ rider, setRider }}>
      {children}
    </riderDataContext.Provider>
  );
}

export const useRider = () => {
  const { rider, setRider } = useContext(riderDataContext);
  return { rider, setRider };
};

export default RiderContext;

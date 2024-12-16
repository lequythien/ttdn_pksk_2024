import PropTypes from "prop-types";
import { createContext, useEffect, useState } from "react";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patient, setPatient] = useState(null);

  const value = {
    user,
    setUser,
    doctors,
    setDoctors,
    patient,
    setPatient,
  };
  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

AppContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppContextProvider;
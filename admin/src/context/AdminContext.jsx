import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";

export const AdminContext = createContext();

const AdminContextProvider = ({ children }) => {
  const initialToken = localStorage.getItem("aToken") || "";
  const [aToken, setAToken] = useState(initialToken);
  const [doctors, setDoctors] = useState([]);
  const [patient, setPatients] = useState([]);
  const [countPatient, setCountPatients] = useState([]);
  const [spec, setSpecs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [countAppointments, setCountAppointments] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [dashUpApData, setDashUpApData] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URI;

  const api = axios.create({
    baseURL: backendUrl,
    headers: { Authorization: `Bearer ${aToken}` },
  });

  const getAllDoctors = async () => {
    try {
      const { data } = await api.get("/doctor/find-all", {});

      if (data.success) {
        toast.error(data.message);
        setDoctors(data.doctors);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const getAllSpecialists = async () => {
    try {
      const { data } = await api.get("/specialization/find-all", {});
      if (data.success) {
        setSpecs(data.specializations);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error fetching specialists:", error);
    }
  };

  const changeAvailability = async (docId) => {
    try {
      console.log("Changing availability for doctor:", docId);
      const { data } = await api.post("/", { docId });

      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error changing availability:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const getCountAppointments = async () => {
    try {
      const { data } = await api.get("/appointment/get-all-admin");

      if (data.success) {
        setCountAppointments(data.data);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };
  const getAllAppointments = async () => {
    try {
      const { data } = await api.get("/appointment/find-all");
      if (data.success) {
        setAppointments(data.appointments);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const getAllPatients = async () => {
    try {
      const { data } = await api.get("/patient/find-all");
      if (data.success) {
        setPatients(data.data);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };
  const countPatients = async () => {
    try {
      const { data } = await api.get("/patient/count");
      if (data.success) {
        setCountPatients(data.data);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await api.post("/doctor/delete", { appointmentId });

      if (data.success) {
        toast.success(data.message);
        getAllAppointments(); // Cập nhật danh sách sau khi hủy
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const getDashData = async () => {
    try {
      const { data } = await api.get("/doctor/find-all");
      if (data.success) {
        setDashData(data.doctors);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };
  const getUpcomingApointmentsDashData = async () => {
    try {
      const { data } = await api.get("/upcoming-appointments-dashboard-admin");
      if (data.success) {
        setDashUpApData(data.data);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const value = {
    aToken,
    setAToken,
    backendUrl,
    doctors,
    getAllDoctors,
    changeAvailability,
    appointments,
    setAppointments,
    getAllAppointments,
    cancelAppointment,
    dashData,
    getDashData,
    spec,
    setSpecs,
    getAllSpecialists,
    patient,
    setPatients,
    getAllPatients,
    dashUpApData,
    setDashUpApData,
    getUpcomingApointmentsDashData,
    countAppointments,
    setCountAppointments,
    getCountAppointments,
    countPatient,
    setCountPatients,
    countPatients,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

export default AdminContextProvider;

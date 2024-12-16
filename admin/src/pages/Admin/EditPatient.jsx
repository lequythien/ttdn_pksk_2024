import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";

const EditPatient = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const { backendUrl, aToken } = useContext(AdminContext);
  const navigate = useNavigate();
  const { id } = useParams(); // Lấy ID từ URL

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/patient/get-patient-dashboard/${id}`,
          {
            headers: {
              Authorization: `Bearer ${aToken}`,
            },
          }
        );
        const patientData = response.data;

        if (patientData.success && patientData.patient) {
          const user = patientData.patient.user_id;
          setName(user.name);
          setPhone(user.phone);
          setEmail(user.email);
        } else {
          throw new Error("Dữ liệu bệnh nhân không hợp lệ.");
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin bệnh nhân:", error);
        toast.error("Có lỗi xảy ra khi lấy thông tin bệnh nhân.");
      }
    };

    fetchPatientData();
  }, [id, backendUrl, aToken]);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true); // Bắt đầu trạng thái loading

    try {
      const data = {
        name,
        phone,
        email,
      };

      const response = await axios.put(
        `${backendUrl}/patient/update/${id}`, // Thêm ID vào URL
        data, // Gửi dữ liệu dưới dạng JSON
        {
          headers: {
            Authorization: `Bearer ${aToken}`,
            "Content-Type": "application/json", // Đảm bảo là application/json
          },
        }
      );

      if (response.data.success) {
        // Điều hướng về danh sách bệnh nhân với thông báo thành công
        navigate("/patient-list", { state: { successMessage: "Chỉnh sửa bệnh nhân thành công!" } });
      } else {
        toast.error("Chỉnh sửa bệnh nhân thất bại!");
      }
    } catch (error) {
      toast.error(error.response?.data.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false); // Kết thúc trạng thái loading
    }
  };

  const onCancelHandler = () => {
    navigate("/patient-list");
  };

  return (
    <form onSubmit={onSubmitHandler} className="m-5 w-full">
      <p className="mb-3 text-lg font-medium">Chỉnh sửa thông tin bệnh nhân</p>
      <div className="bg-white px-8 py-8 border rounded w-full max-w-7xl max-h-[80vh] overflow-y-scroll">
        <div className="flex flex-row items-start gap-10 text-gray-500">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <p className="font-bold">Tên:</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="border rounded px-3 py-2 w-full"
                type="text"
                placeholder="Tên"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p className="font-bold">Số điện thoại:</p>
              <input
                onChange={(e) => setPhone(e.target.value)}
                value={phone}
                className="border rounded px-3 py-2 w-full"
                type="tel"
                placeholder="Số điện thoại"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <p className="font-bold">Email:</p>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="border rounded px-3 py-2 w-full"
                type="email"
                placeholder="Email"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-4 justify-start">
          <button
            type="submit"
            className={`bg-primary px-10 py-3 text-white rounded-full ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
              </div>
            ) : (
              "Lưu"
            )}
          </button>
          <button
            type="button"
            onClick={onCancelHandler}
            className="bg-gray-300 px-10 py-3 text-black rounded-full"
          >
            Hủy
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditPatient;
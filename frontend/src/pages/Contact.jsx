import AOS from "aos";
import "aos/dist/aos.css";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VITE_BACKEND_URI = import.meta.env.VITE_BACKEND_URI;

const Contact = () => {
  const { user } = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: user ? user.name : "", 
    email: user ? user.email : "",
    message: "",
  });
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    if (!user) {
      e.preventDefault();
      toast.error("Bạn chưa đăng nhập!", {
        position: "top-right",
        autoClose: 3000,
        closeOnClick: true,
        draggable: false,
      });
      setFormData({ name: "", email: "", message: "" });
      return;
    }
    e.preventDefault();
    setIsSubmitting(true);
    setResponseMessage("");
  
    try {
      const response = await axios.post(
        `${VITE_BACKEND_URI}/send-email`,
        formData
      );
      setResponseMessage(
        response.data.message || "Email đã được gửi thành công!"
      );
      setFormData((prevData) => ({ ...prevData, message: "" }));
    } catch (error) {
      setResponseMessage("Gửi email thất bại, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-10 md:px-20 lg:px-40">
      {/* Header */}
      <div className="text-center mb-10" data-aos="fade-up">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-700">
          LIÊN HỆ <span className="text-[#219c9e]">VỚI CHÚNG TÔI</span>
        </h1>
        <p className="text-gray-500 mt-2">
          Chúng tôi luôn sẵn sàng hỗ trợ bạn!
        </p>
      </div>

      {/* Contact Info and Image */}
      <div className="flex flex-col md:flex-row gap-10 mb-16">
        <img
          className="w-full md:max-w-md rounded-lg shadow-lg"
          src={assets.contact_image}
          alt="Contact Us"
          data-aos="fade-right"
        />

        <div className="flex flex-col gap-6" data-aos="fade-left">
          <div>
            <h2 className="font-semibold text-lg text-gray-600">
              VĂN PHÒNG CỦA CHÚNG TÔI
            </h2>
            <div className="flex items-center gap-2">
              <img className="h-5 w-5" src={assets.Address} alt="Address" />
              <p className="text-gray-500">
                70 Nguyễn Huệ, phường Vĩnh Ninh, Thành Phố Huế
              </p>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-600">
              THÔNG TIN LIÊN HỆ
            </h2>
            <div className="flex items-center gap-2 text-gray-500">
              <img className="h-5 w-5" src={assets.Phone} alt="Phone" />
              <p>SĐT: +84-365-142-649</p>
            </div>
            <div className="flex items-center gap-2 text-gray-500 mt-2">
              <img className="h-5 w-5" src={assets.Email} alt="Email" />
              <p>Email: tripletcare@gmail.com</p>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-600">
              GIỜ LÀM VIỆC
            </h2>
            <div className="flex items-center gap-2 text-gray-500">
              <img className="h-5 w-5" src={assets.Clock} alt="Clock" />
              <p>
                Ca sáng: 07:30 - 11:30 <br />
                Ca Chiều: 13:30 - 17:30
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form and Map */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Contact Form */}
        <div
          className="bg-gray-100 rounded-lg p-8 shadow-lg w-full lg:w-1/2 h-full"
          data-aos="fade-right"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-6 text-center">
            GỬI TIN NHẮN CHO CHÚNG TÔI
          </h2>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Tên của bạn"
              className="p-3 border rounded-md"
              style={{ color: 'rgb(161, 167, 179)' }}
              value={formData.name}
              onChange={handleChange}
              disabled={!!user}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email của bạn"
              className="p-3 border rounded-md"
              style={{ color: 'rgb(161, 167, 179)' }}
              value={formData.email}
              onChange={handleChange}
              disabled={!!user}
              required
            />
            <textarea
              name="message"
              placeholder="Tin nhắn của bạn"
              className="p-3 border rounded-md h-32"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            <button
              type="submit"
              className={`p-3 font-bold rounded-md transition-colors ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#219c9e] text-white hover:bg-[#1b8285]"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gửi..." : "GỬI TIN NHẮN"}
            </button>
          </form>
          {responseMessage && (
            <p className="text-center mt-4 text-gray-600">{responseMessage}</p>
          )}
        </div>

        {/* Map */}
        <div
          className="bg-gray-100 rounded-lg p-8 shadow-lg w-full lg:w-1/2 h-full"
          data-aos="fade-left"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-6 text-center">
            BẢN ĐỒ
          </h2>
          <iframe
            className="w-full h-full rounded-lg shadow-lg border-4"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3819.459845056251!2d107.583388!3d16.4622236!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3141a127c53b59e9%3A0x2af4ebf3f8f0e7f8!2zNzAgTmfDtG4gSHXhuqE!5e0!3m2!1sen!2s!4v1699486753456!5m2!1sen!2s"
            allowFullScreen=""
            aria-hidden="false"
            tabIndex="0"
            style={{ height: "328px" }}
          ></iframe>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Contact;

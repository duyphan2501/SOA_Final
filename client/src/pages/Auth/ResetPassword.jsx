import PasswordTextField from "../../components/PasswordTextField";
import Button from "@mui/material/Button";
import { MyContext } from "../../Context/MyContext";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useState } from "react";
import BiLoader from "../../components/BiLoader";
import PasswordStrength from "../../components/PasswordStrength";
import useUserStore from "../../stores/useUserStore";

const ResetPassword = () => {
  const [passwordScore, setPasswordScore] = useState(0);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const token = useParams().token;
  const navigate = useNavigate();
  const { isLoading, resetPassword } = useUserStore();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwordScore < 5) {
      toast.info("Password strength is not strong enough.");
      return;
    }
    if (isLoading.reset) return;
    const success = await resetPassword(
      token,
      formData.password,
      formData.confirmPassword
    );
    if (success) navigate("/auth/login");
  };

  return (
    <div className="z-10 w-full max-w-md overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
      <div>
        <div className="w-full">
          <form className="p-4 sm:p-6" onSubmit={handleResetPassword}>
            <h3 className="title mb-5 text-center text-2xl font-bold uppercase sm:text-3xl">
              Reset Password
            </h3>
            <div className="flex gap-5 flex-col">
              <PasswordTextField
                size={"medium"}
                value={formData.password}
                handleChange={(value) => handleChange("password", value)}
                label="New Password"
              />
              <PasswordTextField
                size={"medium"}
                value={formData.confirmPassword}
                handleChange={(value) => handleChange("confirmPassword", value)}
                label="Confirm New Password"
              />
            </div>
            <div className="mt-5">
              <PasswordStrength
                password={formData.password}
                setPasswordScore={setPasswordScore}
              />
            </div>

            <Button
              className="!bg-gray-700 !text-white !min-h-10 !font-bold !uppercase gap-2 items-center !w-full !mt-5 hover:!bg-gray-900"
              type="submit"
            >
              {!isLoading.reset ? "Confirm" : <BiLoader size={20} />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

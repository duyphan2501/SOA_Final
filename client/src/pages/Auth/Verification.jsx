import { useContext, useState } from "react";
import FloatingShape from "../../components/FloatingShape";
import TextField from "@mui/material/TextField";
import PasswordTextField from "../../components/PasswordTextField";
import Button from "@mui/material/Button";
import { MyContext } from "../../Context/MyContext";
import PasswordStrength from "../../components/PasswordStrength";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import BiLoader from "../../components/BiLoader";
import useUserStore from "../../stores/useUserStore";
import VerificationEmailDialog from "../../components/VerificationEmailDialog";

const Verification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const navigate = useNavigate();
  const { verifyAccount, sendVerificationEmail, isLoading } = useUserStore();
  const { verifyUser } = useContext(MyContext);
  const [isOpenEmailDialog, setIsOpenEmailDialog] = useState(false);

  const [formData, setFormData] = useState({
    verificationToken: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResendCode = async () => {
    if (isLoading.resend) return;
    if (!verifyUser || !verifyUser.email) {
      setIsOpenEmailDialog(true);
    } else {
      await sendVerificationEmail(verifyUser.email);
    }
  };

  const handleVerifyAccount = async (e) => {
    e.preventDefault();
    if (isVerifying) return;
    setIsVerifying(true);
    if (passwordScore < 5) {
      toast.info("Mật khẩu chưa đủ mạnh!");
      setIsVerifying(false);
      return;
    }
    const result = await verifyAccount(formData);
    if (result) navigate("/auth/login");
    setIsVerifying(false);
  };

  return (
    <div className="z-10 w-full max-w-md overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
      <div>
        <div className="w-full">
          <form className="p-4 sm:p-6" onSubmit={handleVerifyAccount}>
            <h3 className="title mb-5 text-center text-2xl font-bold uppercase sm:text-3xl">
              Xác thực tài khoản
            </h3>
            <div className="flex gap-5 flex-col">
              <TextField
                id="outlined-basic"
                label="Mã xác thực"
                variant="outlined"
                value={formData.verificationToken}
                onChange={(e) =>
                  handleChange("verificationToken", e.target.value)
                }
              />
              <PasswordTextField
                size={"medium"}
                value={formData.password}
                handleChange={(value) => handleChange("password", value)}
                label="Đặt mật khẩu"
              />
              <PasswordTextField
                size={"medium"}
                value={formData.confirmPassword}
                handleChange={(value) => handleChange("confirmPassword", value)}
                label="Xác nhận mật khẩu"
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
              {!isLoading.verify ? "Xác thực" : <BiLoader size={20} />}
            </Button>
          </form>
        </div>
      </div>
      <div className="bg-gray-800 px-4 py-2 text-center text-sm text-white">
        Chưa nhận được mã?{" "}
        <button
          className="italic hover:underline cursor-pointer"
          onClick={handleResendCode}
        >
          {!isLoading.resend ? "Gửi lại mã" : "Đang gửi..."}
        </button>
      </div>
      {isOpenEmailDialog && (
        <VerificationEmailDialog
          closeDialog={() => setIsOpenEmailDialog(false)}
        />
      )}
    </div>
  );
};

export default Verification;

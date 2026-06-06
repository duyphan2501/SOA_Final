import { useContext, useState } from "react";
import TextField from "@mui/material/TextField";
import PasswordTextField from "../../components/PasswordTextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { MyContext } from "../../Context/MyContext";
import BiLoader from "../../components/BiLoader";
import useUserStore from "../../stores/useUserStore";

const Login = () => {
  const [user, setUser] = useState({
    account: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const { login, isLoading } = useUserStore();
  const { setVerifyUser, persist, setPersist } = useContext(MyContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading.login) return;
    const { loginUser, success } = await login(user);
    if (success) {
      navigate("/");
    } else {
      if (loginUser && !loginUser?.isVerified) {
        setVerifyUser(loginUser);
        navigate("/auth/verify-account");
      }
    }
  };

  const onPersistChange = (e) => {
    const checked = e.target.checked;
    setPersist(checked);
    localStorage.setItem("persist", JSON.stringify(checked));
  };

  return (
    <div className="z-10 w-full max-w-md overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
      <form className="p-4 sm:p-6" onSubmit={handleLogin}>
        <h3 className="title mb-5 text-center text-2xl font-bold uppercase sm:text-3xl">
          Login account
        </h3>
        <div className="flex gap-5 flex-col">
          <TextField
            id="outlined-basic"
            label="Email or username"
            variant="outlined"
            value={user.account}
            onChange={(e) => handleChange("account", e.target.value)}
          />
          <PasswordTextField
            size={"medium"}
            value={user.password}
            handleChange={(value) => handleChange("password", value)}
            label="Password"
          />
        </div>
        <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <FormControlLabel
            control={
              <Checkbox
                checked={persist}
                onChange={onPersistChange}
                sx={{
                  color: "black", // màu viền khi chưa chọn
                  "&.Mui-checked": {
                    color: "black", // màu tick khi được chọn
                  },
                  "&:hover": {
                    backgroundColor: "rgba(0, 43, 91, 0.08)", // hiệu ứng hover nhẹ
                  },
                }}
              />
            }
            label="Remember me"
            className="remember-me"
          />
          <a
            href="/auth/forgot-password"
            className="pb-2 text-sm font-semibold italic text-gray-600 hover:underline sm:pb-0"
          >
            Forgot password?
          </a>
        </div>
        <Button
          className="!bg-gray-700 !text-white !min-h-10 !font-bold !uppercase gap-2 items-center !w-full !mt-3"
          type="submit"
        >
          {!isLoading.login ? "Login" : <BiLoader size={20} />}
        </Button>
      </form>
      <div className="bg-gray-800 px-4 py-2 text-center text-sm text-white">
        Haven't any account?{" "}
        <a href="/auth/sign-up" className="italic hover:underline">
          Register now
        </a>
      </div>
    </div>
  );
};

export default Login;

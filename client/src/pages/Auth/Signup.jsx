import { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../stores/useUserStore";
import PasswordTextField from "../../components/PasswordTextField";
import BiLoader from "../../components/BiLoader";

const Signup = () => {
  const [user, setUser] = useState({
    email: "",
    fullname: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
 
  const navigate = useNavigate();

  const { signUp, isLoading } = useUserStore();

  const handleUserChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (isLoading.signUp) return;
    const { success } = await signUp(user);

    if (success) navigate("/auth/login");
  };

  return (
    <div className="z-10 w-full max-w-md overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
      <div>
        <div className="w-full">
          <form className="p-4 sm:p-6" onSubmit={handleSignUp}>
            <h3 className="title mb-5 text-center text-2xl font-bold uppercase sm:text-3xl">
              Register account
            </h3>
            <div className="flex gap-5 flex-col">
              <TextField
                id="outlined-basic"
                label="Email"
                variant="outlined"
                value={user.email}
                type="email"
                onChange={(e) => handleUserChange("email", e.target.value)}
              />

              <TextField
                id="outlined-basic"
                label="Username"
                variant="outlined"
                value={user.username}
                type="text"
                onChange={(e) => handleUserChange("username", e.target.value)}
              />

              <TextField
                id="outlined-basic"
                label="Full name"
                variant="outlined"
                value={user.fullname}
                onChange={(e) => handleUserChange("fullname", e.target.value)}
              />

              <PasswordTextField
                label="Password"
                value={user.password}
                type="password"
                handleChange={(value) => handleUserChange("password", value)}
              />

              <PasswordTextField
                label="Confirm Password"
                value={user.confirmPassword}
                type="password"
                handleChange={(value) =>
                  handleUserChange("confirmPassword", value)
                }
              />
            </div>

            <Button
              className="!bg-gray-700 !text-white !min-h-10 !font-bold !uppercase gap-2 items-center !w-full !mt-5 hover:!bg-gray-900"
              type="submit"
            >
              {!isLoading.signUp ? "Register" : <BiLoader size={20} />}
            </Button>
          </form>
        </div>
      </div>
      <div className="bg-gray-800 px-4 py-2 text-center text-sm text-white">
        Have an account?{" "}
        <a href="/auth/login" className="italic hover:underline">
          Login now
        </a>
      </div>
    </div>
  );
};

export default Signup;

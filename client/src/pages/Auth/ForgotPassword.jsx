import { Button, TextField } from "@mui/material";
import { useState } from "react";
import BiLoader from "../../components/BiLoader";
import useUserStore from "../../stores/useUserStore";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const { isLoading, sendForgotPasswordEmail } = useUserStore();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading.forgot) return;
    const success = await sendForgotPasswordEmail(email);
    setIsSuccess(success);
  };

  return (
    <div className="z-10 w-full max-w-md overflow-hidden rounded-xl border border-gray-100 bg-white shadow">
      <div>
        {isSuccess ? (
          <>
            <div className="flex w-full flex-col items-center p-4 sm:p-6">
              <h3 className="title mb-3 text-center text-2xl font-bold uppercase sm:text-3xl">
                Request successfully!
              </h3>
              <p className="text-center">
                Please check your email for the password reset link.
              </p>
              <div className="bg-gray-800 text-center py-2 text-white text-sm px-3 rounded-lg mt-3">
                <a href="/auth/login" className="italic hover:underline">
                  Back to Login
                </a>
              </div>
            </div>
            <form
              className="bg-gray-800 text-center py-2 text-white text-sm"
              onSubmit={handleSubmit}
            >
              Not receive email yet?{" "}
              <button
                className="italic hover:underline cursor-pointer"
                type="submit"
              >
                {!isLoading.forgot ? "Send again" : "Sending..."}
              </button>
            </form>
          </>
        ) : (
          <>
            <div>
              <div className="w-full">
                <form className="p-4 sm:p-6" onSubmit={handleSubmit}>
                  <h3 className="title mb-3 text-center text-2xl font-bold uppercase sm:text-3xl">
                    Forgot Password
                  </h3>
                  <p className="text-center mb-5">
                    Enter your email address below and we'll send you a link to
                    reset your password.
                  </p>
                  <div className="flex gap-5 flex-col">
                    <TextField
                      id="outlined-basic"
                      label="Email"
                      variant="outlined"
                      value={email}
                      type="email"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <Button
                    className="!bg-gray-700 !text-white !min-h-10 !font-bold !uppercase gap-2 items-center !w-full !mt-5 hover:!bg-gray-900"
                    type="submit"
                  >
                    {!isLoading.forgot ? (
                      "Send Reset Link"
                    ) : (
                      <BiLoader size={20} />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

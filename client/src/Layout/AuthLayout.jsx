import { Outlet } from "react-router-dom";
import FloatingShape from "../components/FloatingShape";

const AuthLayout = () => {
  return (
    <div className="relative z-1 flex min-h-dvh items-center justify-center overflow-x-hidden overflow-y-auto bg-linear-to-r from-gray-300 via-gray-500 to-gray-700 px-4 py-8 sm:px-6">
      <FloatingShape
        color={"bg-gray-400"}
        size={"size-64"}
        top={"top-[5%]"}
        left={"left-[2%]"}
        delay={0}
      />
      <FloatingShape
        color={"bg-gray-600"}
        size={"size-48"}
        top={"top-[60%]"}
        left={"left-[70%]"}
        delay={5}
      />
      <FloatingShape
        color={"bg-gray-600"}
        size={"size-32"}
        top={"top-[10%]"}
        left={"left-[80%]"}
        delay={5}
      />
      <Outlet />
    </div>
  );
};

export default AuthLayout;

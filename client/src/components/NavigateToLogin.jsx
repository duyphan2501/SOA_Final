import { useContext } from "react";
import { MyContext } from "../Context/MyContext";
import { Info, X } from "lucide-react";
import { Link } from "react-router-dom";

const NavigateToLogin = () => {
  const { setIsShowLoginNavigator, isShowLoginNavigator } =
    useContext(MyContext);
  if (!isShowLoginNavigator) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-100">
      <div className="p-5 bg-white rounded-lg z-200 w-80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Info />
            <p className="font-semibold text-lg subtitle">Announcement</p>
          </div>
          <button
            className="p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
            onClick={() => setIsShowLoginNavigator(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="my-3 text-center">
          <p>Please login first to use this feature</p>
        </div>
        <div className="flex justify-center">
          <Link
            to="/auth/login"
            onClick={() => setIsShowLoginNavigator(false)}
            className=" px-5 py-2 text-white bg-black hover:bg-gray-900 rounded-lg"
          >
            Login now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NavigateToLogin;

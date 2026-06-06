import { useContext, useEffect } from "react";
import useSocketStore from "../../stores/useSocketStore";
import { formatRelativeTime } from "../../utils/DateFormat";
import { MyContext } from "../../Context/MyContext";
import { ArrowLeft } from "lucide-react";

const ChatHeader = ({ isChatUserOnline, onBack }) => {
  const { mainSocket } = useSocketStore();
  const { chatUser, setChatUser } = useContext(MyContext);

  useEffect(() => {
    if (!mainSocket) return;

    mainSocket.on("user_last_active_updates", (data) => {
      if (chatUser.id === data.userId) {
        setChatUser((prev) => ({ ...prev, last_active_at: data.timestamp }));
      }
    });

    return () => {
      mainSocket.off("user_last_active_updates");
    };
  }, [mainSocket]);

  return (
    <div className="border-b border-gray-200 p-3 sm:p-4">
      <div className="flex items-center">
        {/*  */}

        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="mr-2 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 lg:hidden"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="flex min-w-0 gap-3">
          <a href={`/profile/${chatUser.username}`}>
            <div
              className={`avatar ${
                isChatUserOnline ? "avatar-online" : "avatar-offline"
              }`}
            >
              <div className="w-12 rounded-full">
                <img
                  src={
                    chatUser.avatar_url ||
                    "https://img.daisyui.com/images/profile/demo/gordon@192.webp"
                  }
                />
              </div>
            </div>
          </a>
          <div className="flex flex-1 flex-col justify-center">
            <p className="truncate font-medium">{chatUser.full_name}</p>
            <div className="text-xs text-gray-600">
              {isChatUserOnline ? (
                <p>Online</p>
              ) : (
                <p>
                  Online {formatRelativeTime(chatUser.last_active_at, true)}
                </p>
              )}
            </div>
          </div>
        </div>
        {/*  */}
      </div>
    </div>
  );
};

export default ChatHeader;

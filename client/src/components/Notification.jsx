import { useState } from "react";
import useNotificationStore from "../stores/useNotificationStore";
import { useEffect } from "react";
import useUserStore from "../stores/useUserStore";
import usePostStore from "../stores/usePostStore";
import { useNavigate } from "react-router-dom";

const NotificationItem = ({
  notification,
  handleAcceptRequest,
  handleDeclineRequest,
}) => {
  const [isLoadingAccept, setIsLoadingAccept] = useState(false);
  const [isLoadingDecline, setIsLoadingDecline] = useState(false);
  const navigator = useNavigate();

  const responseFriendRequest = useNotificationStore(
    (s) => s.responseFriendRequest
  );

  const acceptFriend = async () => {
    setIsLoadingAccept(true);
    const res = await responseFriendRequest(
      notification.sender_id,
      notification.id,
      "accept"
    );
    handleAcceptRequest(
      notification.id,
      notification.recipient_id,
      notification.sender_name,
      notification.sender_id,
      notification.avatar
    );
    setIsLoadingAccept(false);
  };

  const declineFriend = async () => {
    setIsLoadingDecline(true);
    const res = await responseFriendRequest(
      notification.sender_id,
      notification.id,
      "decline"
    );
    handleDeclineRequest(notification.id);
    setIsLoadingDecline(false);
  };

  if (notification.entity_type === "user") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex flex-col items-center flex-shrink-0">
          {notification?.avatar ? (
            <a
              href={`/profile/${notification.sender_name}`}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0 overflow-hidden cursor-pointer"
            >
              <img
                src={notification?.avatar}
                alt=""
                className="size-full object-cover"
              />
            </a>
          ) : (
            <a
              href={`/profile/${notification.sender_name}`}
              className="relative overflow-hidden bg-gray-300 rounded-full size-10 flex justify-center items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="180px"
                viewBox="0 -960 960 960"
                width="180px"
                fill="#797979ff"
                className="absolute top-2 size-full"
              >
                <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
              </svg>
            </a>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-gray-900 text-sm">
            <span className="font-semibold">{notification?.sender_name}</span>
            {notification?.others && (
              <span className="text-gray-600">
                {" "}
                + {notification.others} others
              </span>
            )}
            {notification.content && (
              <span
                className={`text-gray-600 ${
                  notification.is_read ? "" : "font-bold"
                }`}
              >
                {" "}
                {notification.content}
              </span>
            )}
            {notification.created_at && (
              <span className="text-gray-500"> {notification.createdAt}</span>
            )}
          </p>
        </div>

        {notification?.post?.media?.[0] && (
          <div className="w-11 h-11 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 text-xl">
            {notification.thumbnail}
            <img src={notification.post.media[0].media_url} alt="" />
          </div>
        )}

        {notification?.type === "friend_request" && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={acceptFriend}
              disabled={isLoadingAccept}
              className="px-5 py-1.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              {isLoadingAccept ? (
                <svg
                  className="w-4 h-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                  ></path>
                </svg>
              ) : (
                "Accept"
              )}
            </button>

            <button
              onClick={declineFriend}
              disabled={isLoadingDecline}
              className="px-5 py-1.5 bg-gray-200 text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              {isLoadingDecline ? (
                <svg
                  className="w-4 h-4 animate-spin text-gray-900"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                  ></path>
                </svg>
              ) : (
                "Decline"
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={`/post/${notification.entity_id || ""}/comments`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <div className="flex flex-col items-center flex-shrink-0">
        {notification?.avatar ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0 overflow-hidden cursor-pointer">
            <img
              src={notification?.avatar}
              alt=""
              className="size-full object-cover"
            />
          </div>
        ) : (
          <div className="relative overflow-hidden bg-gray-300 rounded-full size-10 flex justify-center items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="180px"
              viewBox="0 -960 960 960"
              width="180px"
              fill="#797979ff"
              className="absolute top-2 size-full"
            >
              <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-gray-900 text-sm">
          <span className="font-semibold">{notification?.sender_name}</span>
          {notification?.others && (
            <span className="text-gray-600">
              {" "}
              + {notification.others} others
            </span>
          )}
          {notification.content && (
            <span
              className={`text-gray-600 ${
                notification.is_read ? "" : "font-bold"
              }`}
            >
              {" "}
              {notification.content}
            </span>
          )}
          {notification.created_at && (
            <span className="text-gray-500"> {notification.createdAt}</span>
          )}
        </p>
      </div>

      {notification?.post?.media?.[0] && (
        <div className="w-11 h-11 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 text-xl">
          {notification.thumbnail}
          <img src={notification.post.media[0].media_url} alt="" />
        </div>
      )}

      {notification?.type === "friend_request" && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={acceptFriend}
            disabled={isLoadingAccept}
            className="px-5 py-1.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            {isLoadingAccept ? (
              <svg
                className="w-4 h-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                ></path>
              </svg>
            ) : (
              "Accept"
            )}
          </button>

          <button
            onClick={declineFriend}
            disabled={isLoadingDecline}
            className="px-5 py-1.5 bg-gray-200 text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            {isLoadingDecline ? (
              <svg
                className="w-4 h-4 animate-spin text-gray-900"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                ></path>
              </svg>
            ) : (
              "Decline"
            )}
          </button>
        </div>
      )}
    </a>
  );
};

const NotificationSection = ({
  title,
  notifications,
  hasBlueIndicator,
  handleAcceptRequest,
  handleDeclineRequest,
}) => (
  <div className="mb-2">
    <div className="flex items-center gap-2 px-4 py-2">
      <h3 className="text-gray-900 font-bold text-base">{title}</h3>
      {hasBlueIndicator && (
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </div>
    {notifications.map((notif) => (
      <NotificationItem
        handleAcceptRequest={handleAcceptRequest}
        handleDeclineRequest={handleDeclineRequest}
        key={notif.id}
        notification={notif}
      />
    ))}
  </div>
);

//Ham ho tro group theo ngay
const groupByDate = (items) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay()); // Chủ nhật đầu tuần
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const grouped = {
    friendRequest: [],
    new: [],
    today: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  items.forEach((item) => {
    const createdAt = new Date(item.created_at);
    if (item.type === "friend_request") {
      grouped.friendRequest.push({
        ...item,
        createdAt: formatTime(item.created_at),
      });
    } else if (!item.is_read) {
      grouped.new.push({ ...item, createdAt: formatTime(item.created_at) });
    } else if (createdAt >= todayStart) {
      grouped.today.push({ ...item, createdAt: formatTime(item.created_at) });
    } else if (createdAt >= weekStart) {
      grouped.thisWeek.push({
        ...item,
        createdAt: formatTime(item.created_at),
      });
    } else if (createdAt >= monthStart) {
      grouped.thisMonth.push({
        ...item,
        createdAt: formatTime(item.created_at),
      });
    } else {
      grouped.older.push({ ...item, createdAt: formatTime(item.created_at) });
    }
  });

  return grouped;
};

//Chuyen ngay sang kieu de doc
export function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  const diff = now - date; // milliseconds
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 30) return "now";
  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  if (weeks < 4) return `${weeks}w`;
  if (months < 12) return `${months}m`;
  return `${years}y`;
}

const Notification = ({isShow}) => {
  const notifications = useNotificationStore((s) => s.notifications);
  const getNotifications = useNotificationStore((s) => s.getNotifications);
  const viewNotifications = useNotificationStore((s) => s.viewNotifications);
  const [loading, setloading] = useState(false);

  const user = useUserStore((s) => s.user);
  const fetchUserIfNeeded = useUserStore((s) => s.fetchUserIfNeeded);

  const fetchPostIfNeeded = usePostStore((s) => s.fetchPostIfNeeded);

  const [notificationsData, setNotificationsData] = useState([]);
  const handleAcceptRequest = (
    notiId,
    recipient_id,
    sender_name,
    sender_id,
    avatar_url
  ) => {
    const tempNoti = {
      id: notiId,
      recipient_id,
      sender_name,
      sender_id,
      type: "friend_accepted",
      entity_id: sender_id,
      entity_type: "user",
      content: "and you are friends now",
      is_read: false,
      created_at: "now",
      avatar: avatar_url,
    };

    setNotificationsData((prev) => ({
      ...prev,
      // Xóa notification cũ khỏi friendRequest
      friendRequest: prev.friendRequest.filter((item) => item.id !== notiId),
      // Thêm notification mới vào new
      new: [tempNoti, ...prev.new],
    }));
  };

  const handleDeclineRequest = (notificationId) => {
    setNotificationsData((prev) => ({
      ...prev,
      friendRequest: prev.friendRequest.filter(
        (item) => item.id !== notificationId
      ),
    }));
  };

  useEffect(() => {
    if (!user || !isShow) return;
    const fetchNotificationData = async () => {
      if (!user?.id) return;

      setloading(true);
      const notifications = await getNotifications(user?.id);
      if (!notifications || notifications.length === 0) {
        setloading(false)
        return;
      }
      const notificationsWithData = await Promise.all(
        notifications.map(async (n) => {
          const userInfo = await fetchUserIfNeeded(n.sender_id);
          const postInfo = await fetchPostIfNeeded(n.entity_id);
          return {
            ...n,
            sender_name: userInfo?.username || "Anonymous",
            avatar: userInfo?.avatar_url || "",
            post: postInfo || null,
          };
        })
      );

      setNotificationsData(groupByDate(notificationsWithData));
      setloading(false);

      await viewNotifications(user?.id);
    };

    fetchNotificationData();

    return async () => {
      await getNotifications(user?.id);
    };
  }, [user, isShow]);

  // Skeleton khi notifications chưa load
  if (loading) {
    return (
      <div className="h-full p-4 space-y-4 bg-white">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-300 h-12 w-12"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (
    (notificationsData &&
    notificationsData.new?.length === 0 &&
    notificationsData.friendRequest?.length === 0 &&
    notificationsData.today?.length === 0 &&
    notificationsData.thisWeek?.length === 0 &&
    notificationsData.thisMonth?.length === 0) || !user || notificationsData.length === 0
  ) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 mb-4 text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-16 h-16"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6m0 6h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9
            4.03-9 9-9 9 4.03 9 9z"
            />
          </svg>
        </div>
        <p className="text-gray-400 text-lg font-semibold">No notifications</p>
      </div>
    );
  }

  // Khi có dữ liệu, render bình thường
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        {notificationsData.friendRequest?.length > 0 && (
          <NotificationSection
            handleAcceptRequest={handleAcceptRequest}
            handleDeclineRequest={handleDeclineRequest}
            title="Friend request"
            notifications={notificationsData.friendRequest}
          />
        )}
        {notificationsData.new?.length > 0 && (
          <NotificationSection
            handleAcceptRequest={handleAcceptRequest}
            handleDeclineRequest={handleDeclineRequest}
            title="New"
            notifications={notificationsData.new}
            hasBlueIndicator={true}
          />
        )}
        {notificationsData.today?.length > 0 && (
          <NotificationSection
            handleAcceptRequest={handleAcceptRequest}
            handleDeclineRequest={handleDeclineRequest}
            title="Today"
            notifications={notificationsData.today}
          />
        )}
        {notificationsData.yesterday?.length > 0 && (
          <NotificationSection
            handleAcceptRequest={handleAcceptRequest}
            handleDeclineRequest={handleDeclineRequest}
            title="Yesterday"
            notifications={notificationsData.yesterday}
          />
        )}
        {notificationsData.thisWeek?.length > 0 && (
          <NotificationSection
            handleAcceptRequest={handleAcceptRequest}
            handleDeclineRequest={handleDeclineRequest}
            title="This week"
            notifications={notificationsData.thisWeek}
          />
        )}
        {notificationsData.thisMonth?.length > 0 && (
          <NotificationSection
            handleAcceptRequest={handleAcceptRequest}
            handleDeclineRequest={handleDeclineRequest}
            title="This month"
            notifications={notificationsData.thisMonth}
          />
        )}
      </div>
    </div>
  );
};

export default Notification;

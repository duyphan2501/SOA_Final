import { useContext, useEffect, useState, useRef } from "react"; // Thêm useRef
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import useUserStore from "../stores/useUserStore";
import { MyContext } from "../Context/MyContext";
import useSocketStore from "../stores/useSocketStore";
import Notification from "../components/Notification";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import useNotificationStore from "../stores/useNotificationStore";

// Navigation Item Component
const NavItem = ({
  icon,
  label,
  isActive = false,
  isCollapsed,
  isMobile,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex items-center rounded-lg hover:bg-gray-100 transition-colors ${
        isMobile
          ? "h-14 flex-1 justify-center px-2"
          : isCollapsed
            ? "w-full justify-center px-0 py-3"
            : "w-full gap-4 px-3 py-3"
      } ${
        isActive ? "font-bold" : "font-normal"
      }`}
    >
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      {!isCollapsed && <span className="text-base">{label}</span>}
    </button>
  );
};

// Sidebar Component
const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { refreshToken, isLoading, refreshUser } = useUserStore();

  const { persist, setIsShowLoginNavigator, setIsOpenNewPostModal } =
    useContext(MyContext);
  const navigator = useNavigate();
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const { connectMainSocket, disconnectMainSocket } = useSocketStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mainSocket = useSocketStore((s) => s.mainSocket);

  //Fetch du lieu cho noti
  const getNotifications = useNotificationStore((s) => s.getNotifications);
  const notifications = useNotificationStore((s) => s.notifications);
  const [notificationsUnreadNumber, setNotificationsUnreadNumber] = useState(0);
  const isCompact = isMobile || isCollapsed;

  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showNotifications) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showNotifications]);

  //Audio
  const audioRef = useRef(new Audio("/sound/new_notification.mp3"));
  //Phat tin nhan
  const playSound = () => {
    audioRef.current.volume = 0.5;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  useEffect(() => {
    if (!user?.id) return;
    getNotifications(user?.id);
  }, [user]);

  //Set so unread notification
  useEffect(() => {
    setNotificationsUnreadNumber(notifications?.new?.length || 0);
  }, [notifications]);

  const handleNavigation = (href) => {
    if (!user) {
      setIsShowLoginNavigator(true);
      return;
    }
    navigator(href);
  };

  //Listen socket unread notification
  useEffect(() => {
    if (!mainSocket) return;

    const handleNewUnread = () => {
      setNotificationsUnreadNumber((prev) => prev + 1);
      playSound();
    };

    mainSocket.on("new_unread_notification", handleNewUnread);

    // Cleanup khi unmount hoặc re-render
    return () => {
      mainSocket.off("new_unread_notification", handleNewUnread);
    };
  }, [mainSocket]); // chỉ chạy lại khi socket thay đổi

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const refresh = async () => {
      try {
        if (user) return;
        if (persist) {
          await refreshToken();
        } else {
          await refreshUser();
        }
      } catch {
        if (isMounted) {
          const allowedPaths = ["/", "/post/"];
          const isAllowedPath =
            allowedPaths.includes(location.pathname) ||
            /^(\/post\/)([a-zA-Z0-9_-]+)(\/comments\/?)$/.test(
              location.pathname
            );

          if (isAllowedPath) return;

          toast.error("You have to login first!");
          navigator("/auth/login");
        }
      }
    };
    refresh();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = false;

    if (!isMounted) {
      connectMainSocket();
      isMounted = true;
    }

    const handleTabClose = () => {
      disconnectMainSocket();
    };

    window.addEventListener("beforeunload", handleTabClose);

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
      disconnectMainSocket();
    };
  }, [user, connectMainSocket, disconnectMainSocket]);

  const navItems = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: "Home",
      onClick: () => navigator("/"),
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <circle cx="10.5" cy="10.5" r="7.5" />
          <line x1="21" y1="21" x2="15.8" y2="15.8" />
        </svg>
      ),
      label: "Search",
      onClick: () => handleNavigation("/search"),
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      label: "Messages",
      onClick: () => handleNavigation("/inbox"),
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      label: "Notifications",
      hasIndicator: hasNewNotifications,
      onClick: (e) => {
        e.preventDefault();
        setShowNotifications(!showNotifications);
      },
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      label: "Create",
      onClick: () => {
        if (!user) {
          setIsShowLoginNavigator(true);
          return;
        }
        setIsOpenNewPostModal(true);
      },
    },
    {
      icon: (
        <div className="w-6 h-6 bg-gray-300 overflow-hidden rounded-full flex items-center justify-center">
          {user?.avatar_url ? (
            <img src={user?.avatar_url} className="w-full h-full" alt="" />
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>
      ),
      label: "Profile",
      onClick: () => handleNavigation("/profile/" + user?.username),
    },
  ];

  const handleLogout = async () => {
    const res = await logout();
    setIsOpen(false);
    if (res) {
      navigator("/auth/login");
    }
  };

  const handleSettings = () => {
    navigator("/settings");
    setIsOpen(false);
  };

  return (
    <>
      {isLoading.refresh ? (
        <Loading />
      ) : (
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside
            className={`fixed z-50 flex bg-white transition-all duration-300 ${
              isMobile
                ? "bottom-0 left-0 right-0 h-16 border-t border-gray-200"
                : `${isCollapsed ? "w-20" : "w-64"} top-0 left-0 h-full flex-col border-r border-gray-200`
            }`}
          >
            {/* Logo */}
            <div
              className={`h-24 items-center border-b border-gray-200 ${
                isMobile
                  ? "hidden"
                  : isCollapsed
                    ? "flex justify-center px-0"
                    : "flex px-6"
              }`}
            >
              {isCollapsed ? (
                <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M24 0C10.7 0 0 10.7 0 24s10.7 24 24 24 24-10.7 24-24S37.3 0 24 0zm0 43.2C13.4 43.2 4.8 34.6 4.8 24S13.4 4.8 24 4.8 43.2 13.4 43.2 24 34.6 43.2 24 43.2z"
                    fill="currentColor"
                  />
                  <circle cx="24" cy="24" r="6" fill="currentColor" />
                </svg>
              ) : (
                <h1
                  className="text-2xl font-semibold"
                  style={{ fontFamily: "Brush Script MT, cursive" }}
                >
                  {user ? (
                    user.full_name
                  ) : (
                    <a
                      className="bg-black text-white p-2 rounded-lg hover:underline"
                      href="/auth/login"
                    >
                      Login now
                    </a>
                  )}
                </h1>
              )}
            </div>
            <nav
              className={
                isMobile
                  ? "flex h-full w-full items-center justify-around px-1"
                  : "flex-1 space-y-1 px-3 py-4"
              }
            >
              {navItems.map((item, index) => {
                if (item.label === "Notifications") {
                  return (
                    <div
                      className={`relative ${isMobile ? "flex flex-1" : ""}`}
                      key={index}
                    >
                      <NavItem
                        icon={item.icon}
                        label={item.label}
                        isActive={location.pathname === item.href}
                        isCollapsed={isCompact}
                        isMobile={isMobile}
                        onClick={item.onClick}
                      />
                      {notificationsUnreadNumber !== 0 && (
                        <span
                          className={`absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-center text-xs font-bold text-white ${
                            isCompact ? "left-1/2 ml-1" : "left-1"
                          }`}
                        >
                          {notificationsUnreadNumber}
                        </span>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <NavItem
                      key={index}
                      icon={item.icon}
                      label={item.label}
                      isActive={location.pathname === item.href}
                      isCollapsed={isCompact}
                      isMobile={isMobile}
                      onClick={item.onClick}
                    />
                  );
                }
              })}
            </nav>

            {/* Bottom Section */}
            <div
              className={`p-3 border-t border-gray-200 space-y-1 ${
                isMobile ? "hidden" : ""
              }`}
            >
              {/* More Button with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                  }}
                  className={`w-full flex items-center py-3 rounded-lg hover:bg-gray-100 transition-colors ${
                    isCollapsed
                      ? "justify-center px-0"
                      : "gap-4 px-3"
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </div>
                  {!isCollapsed && <span className="text-base">More</span>}
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div
                    className={`absolute bottom-full mb-2 ${
                      isCollapsed ? "left-0" : "left-0"
                    } w-64 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden`}
                    style={{
                      animation: "slideUp 0.2s ease-out",
                    }}
                  >
                    {/* Settings */}
                    <button
                      onClick={handleSettings}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-150 text-left"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6m6-9h-6m-6 0H1m16.39-4.61l-4.24 4.24M7.76 16.24l-4.24 4.24M20.24 16.24l-4.24-4.24M7.76 7.76L3.52 3.52" />
                      </svg>
                      <span className="font-medium">Settings</span>
                    </button>

                    {/* Log out */}
                    {/* Log out */}
                    {user ? (
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-150 text-left"
                      >
                        <span className="font-medium text-red-700">
                          Log out
                        </span>
                      </button>
                    ) : (
                      <a
                        href="/auth/login"
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-800 font-semibold hover:bg-gray-100 transition-colors duration-150 text-left"
                      >
                        <span className="">Login/Sign up</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Toggle Button */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`w-full flex items-center py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 ${
                  isCollapsed
                    ? "justify-center px-0"
                    : "gap-3 px-3"
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {isCollapsed ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  )}
                </div>
                {!isCollapsed && <span className="text-base">Collapse</span>}
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main
            className={`flex-1 overflow-auto bg-gray-50 transition-all duration-300 ${
              isMobile
                ? "ml-0 pb-16"
                : isCollapsed
                  ? "ml-20"
                  : "ml-64"
            }`}
          >
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-40">
            {[0, 1, 2, 3].map((index) => (
              <a
                key={index}
                href={navItems[index].href}
                className="flex items-center justify-center w-12 h-12"
              >
                <div className="w-6 h-6">{navItems[index].icon}</div>
              </a>
            ))}
          </nav> */}

          {/* Notification Panel */}
          {showNotifications && (
            <>
              {isMobile && (
                <button
                  type="button"
                  aria-label="Close notifications"
                  className="fixed inset-x-0 top-0 bottom-16 z-[55] bg-black/40"
                  onClick={() => setShowNotifications(false)}
                />
              )}
              <section
                role="dialog"
                aria-modal={isMobile}
                aria-label="Notifications"
                className={`fixed flex flex-col bg-white shadow-2xl ${
                  isMobile
                    ? "inset-x-0 bottom-16 top-12 z-[60] overflow-hidden rounded-t-2xl"
                    : `top-0 z-40 h-full w-96 border-r border-gray-200 ${
                        isCollapsed ? "left-20" : "left-64"
                      }`
                }`}
              >
                <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Notifications
                  </h2>
                  <button
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => setShowNotifications(false)}
                    className="flex size-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-black"
                  >
                    <svg
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </header>
                <div className="min-h-0 flex-1">
                  <Notification isShow={showNotifications} />
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;

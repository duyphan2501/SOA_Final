import { useState, useEffect, useCallback, useContext } from "react";
import ConversationItem from "../components/ConversationItem";
import { SquarePen } from "lucide-react";
import ChatMain from "../components/ChatMain";
import useUserStore from "../stores/useUserStore";
import useConversationStore from "../stores/useConversationStore";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useSocketStore from "../stores/useSocketStore";

// Bọc ConversationItem bằng memo để tối ưu hiệu suất
import { memo } from "react";
import { MyContext } from "../Context/MyContext";
const MemoizedConversationItem = memo(ConversationItem);

const ChatPage = () => {
  const user = useUserStore((state) => state.user);
  const [conversationsWithUsers, setConversationsWithUsers] = useState([]);
  const {
    chatUser,
    setChatUser,
    setSelectedConversationId,
    setIsOpenNewMessage,
  } = useContext(MyContext);
  const [activeTab, setActiveTab] = useState(0); // 0: Messages, 1: Requests

  const mainSocket = useSocketStore((state) => state.mainSocket);
  const { getUserInfo } = useUserStore();
  const { getConversations } = useConversationStore();
  const axiosPrivate = useAxiosPrivate();
  const onlineUsers = useSocketStore((state) => state.onlineUsers);
  const [isLoading, setIsLoading] = useState(false);

  const processConversations = async (conversationsData) => {
    if (!conversationsData || conversationsData.length === 0) return [];
    const fetchPromises = conversationsData.map(async (item) => {
      const otherUser = await getUserInfo(item.other_user_id, axiosPrivate);
      return {
        ...item,
        otherUser: otherUser,
      };
    });
    const conversationsWithUsersData = await Promise.all(fetchPromises);

    return conversationsWithUsersData;
  };

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const status = activeTab === 0 ? "active" : "new";
    try {
      const rawConversationsData = await getConversations(
        user.id,
        status,
        axiosPrivate
      );
      const finalData = await processConversations(rawConversationsData);
      setConversationsWithUsers(finalData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [user, getConversations, axiosPrivate, getUserInfo, activeTab]);

  const handleClick = (conversation) => {
    setChatUser(conversation.otherUser);
    setSelectedConversationId(conversation.id);
  };

  const handleBackToConversations = () => {
    setChatUser(null);
    setSelectedConversationId(null);
  };

  const syncConversationPreview = useCallback((message) => {
    setConversationsWithUsers((prevConversations) => {
      const conversationIndex = prevConversations.findIndex(
        (conversation) =>
          String(conversation.id) === String(message.conversation_id)
      );

      if (conversationIndex === -1) return prevConversations;

      const updatedConversation = {
        ...prevConversations[conversationIndex],
        message_id: message.id,
        content: message.content,
        message_type: message.type,
        message_status: message.status || "sent",
        media_count: message.media_count ?? message.media?.length ?? 0,
        sender_id: message.sender_id,
        sent_at: message.sent_at,
      };

      return [
        updatedConversation,
        ...prevConversations.filter((_, index) => index !== conversationIndex),
      ];
    });
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, activeTab]);

  const updateMessageStatusInState = useCallback(
    ({ messageId, status }) => {
      setConversationsWithUsers((prevConversations) => {
        return prevConversations.map((conversation) => {
          if (conversation.message_id == messageId) {
            const newConversation = { ...conversation, message_status: status };
            return newConversation;
          }
          return conversation;
        });
      });
    },
    [setConversationsWithUsers]
  );

  // 2. Lắng nghe tin nhắn mới
  const handleReceiveMessage = useCallback(
    (newMessage) => {
      syncConversationPreview(newMessage);
    },
    [syncConversationPreview]
  );

  useEffect(() => {
    if (!mainSocket) return;
    mainSocket?.on("chat_notification", handleReceiveMessage);
    mainSocket?.on("status_updated", updateMessageStatusInState);
    return () => {
      mainSocket?.off("chat_notification", handleReceiveMessage);
      mainSocket?.off("status_updated", updateMessageStatusInState);
    };
  }, [mainSocket, user?.id, updateMessageStatusInState, handleReceiveMessage]);

  if (!user) return;

  return (
    <div className="flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] md:h-screen md:max-h-screen">
      <section
        className={`w-full border-r border-gray-300 lg:block lg:w-90 lg:shrink-0 ${
          chatUser ? "hidden" : "block"
        }`}
      >
        <div className="flex flex-col gap-6 p-5">
          <div className="mt-5 flex justify-between items-center">
            <h5 className="font-semibold text-2xl">
              {user.username}
            </h5>
            <span
              className="hover:-translate-y-[0.5px] cursor-pointer"
              onClick={() => setIsOpenNewMessage(true)}
            >
              <SquarePen />
            </span>
          </div>
          <div className="tabs tabs-box">
            <input
              type="radio"
              name="my_tabs_1"
              className="tab w-1/2 checked:bg-gray-100 checked:font-semibold"
              aria-label="Mesagesages"
              checked={activeTab === 0}
              onChange={() => setActiveTab(0)}
            />
            <input
              type="radio"
              name="my_tabs_1"
              className="tab w-1/2 checked:bg-gray-100 checked:font-semibold"
              aria-label="Requests"
              checked={activeTab === 1}
              onChange={() => setActiveTab(1)}
            />
          </div>
        </div>

        <div className="">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                className="flex gap-3 p-2 bg-gray-50 text-xs hover:bg-gray-200 cursor-pointer animate-pulse"
                key={index}
              >
                {/* Placeholder UI khi đang tải */}
                <div className="avatar">
                  <div className="w-13 rounded-full bg-gray-300"></div>
                </div>
                <div className="flex flex-1 flex-col justify-center gap-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : (
            <>
              {conversationsWithUsers.length > 0 ? (
                conversationsWithUsers.map((item) => (
                  <div
                    className="cursor-pointer"
                    key={item.id}
                    onClick={() => handleClick(item)}
                  >
                    <MemoizedConversationItem
                      conversation={item}
                      isYou={item.sender_id === user.id}
                      isChatUserOnline={onlineUsers.includes(
                        item.other_user_id.toString()
                      )}
                      otherUser={item.otherUser}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm px-5">
                  {activeTab === 0
                    ? "Chats will appear here after you send or receive a message"
                    : "No new message requests at the moment."}
                </p>
              )}
            </>
          )}
        </div>
      </section>
      {/* right */}
      <section
        className={`min-w-0 flex-1 md:block ${chatUser ? "block" : "hidden"}`}
      >
        <ChatMain
          onBack={handleBackToConversations}
          onConversationMessageUpdate={syncConversationPreview}
        />
      </section>
    </div>
  );
};

export default ChatPage;

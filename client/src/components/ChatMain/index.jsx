import { useState, useRef, useEffect, useCallback, useContext } from "react";
import ChatFooter from "./ChatFooter";
import ChatHeader from "./ChatHeader";
import MessageItem from "../MessageItem";
import { MessageCircleMore } from "lucide-react";
import useUserStore from "../../stores/useUserStore";
import useConversationStore from "../../stores/useConversationStore";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import useSocketStore from "../../stores/useSocketStore";
import useMessageStore from "../../stores/useMessageStore";
import { MyContext } from "../../Context/MyContext";

const ChatMain = ({ onBack, onConversationMessageUpdate }) => {
  const {
    chatUser,
    selectedConversationId,
    setSelectedConversationId,
    setIsOpenNewMessage,
  } = useContext(MyContext);

  const user = useUserStore((state) => state.user); // currentUser
  const { getConversationMessages, createNewConversation } =
    useConversationStore();

  const { uploadMessageImages, sendMessage, updateMessageStatus } =
    useMessageStore();
  const axiosPrivate = useAxiosPrivate();
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // pagination / loading older messages
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Lấy instance mainSocket từ store
  const mainSocket = useSocketStore((state) => state.mainSocket);
  const onlineUsers = useSocketStore((state) => state.onlineUsers);

  // Cuộn xuống cuối danh sách tin nhắn khi có tin nhắn mới
  const scrollToBottom = (smooth = true) => {
    // If we have a container, prefer scrolling container to keep consistent behavior
    const container = messagesContainerRef.current;
    if (container) {
      // scroll to bottom of container
      const behaviour = smooth ? { behavior: "smooth" } : undefined;
      // use scrollTop to avoid scrollIntoView oddities when we adjust scrollTop manually
      container.scrollTop = container.scrollHeight - container.clientHeight;
      // fallback: ensure messagesEndRef is in view
      messagesEndRef.current?.scrollIntoView(behaviour);
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Tải tin nhắn từ API ban đầu hoặc load thêm (beforeId)
  const fetchedMessages = async (limit = 20, beforeId = undefined) => {
    if (!selectedConversationId) return 0;

    const data = await getConversationMessages(
      selectedConversationId,
      limit,
      beforeId,
      axiosPrivate
    );

    if (!data) return;

    if (beforeId) {
      // Khi load thêm → prepend lên đầu
      setMessages((prev) => [...data, ...prev]);

      if (data.length < limit) setHasMore(false);
    } else {
      // Khi load lần đầu
      setMessages(data);
    }

    return data.length;
  };

  // Hàm cập nhật state tin nhắn khi có sự kiện mainSocket
  const updateMessageStatusInState = useCallback(({ messageId, status }) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        String(msg.id) === String(messageId) ? { ...msg, status } : msg
      )
    );
  }, []);

  useEffect(() => {
    // 1. Kết nối và tham gia phòng chat khi selectedConversationId thay đổi
    if (mainSocket && selectedConversationId) {
      mainSocket.emit("join_conversation", selectedConversationId);
    }

    // 2. Lắng nghe tin nhắn mới
    const handleReceiveMessage = (newMessage) => {
      if (!newMessage.status) newMessage.status = "sent";
      if (
        String(newMessage.conversation_id) !== String(selectedConversationId)
      ) {
        return;
      }
      // If the message was sent by current user
      if (String(newMessage.sender_id) === String(user.id)) {
        if (!newMessage.tempId) return;
        setMessages((prevMessages) => {
          const index = prevMessages.findIndex(
            (msg) => msg.id == newMessage.tempId
          );

          if (index !== -1) {
            const updatedMessages = [...prevMessages];
            updatedMessages[index] = {
              ...updatedMessages[index],
              id: newMessage.id,
              status: "sent",
            };
            return updatedMessages;
          } else {
            // fallback: append
            return [...prevMessages, newMessage];
          }
        });
      } else {
        setMessages((prev) => {
          const newArr = [...prev, newMessage];

          // if user is at (or near) bottom -> auto scroll
          const container = messagesContainerRef.current;
          const isAtBottom = container
            ? container.scrollHeight - container.scrollTop - container.clientHeight <
              150
            : true;

          // set state then scroll in next tick
          setTimeout(() => {
            if (isAtBottom) scrollToBottom();
          }, 50);

          return newArr;
        });

      }
    };

    // 3. Lắng nghe cập nhật trạng thái (dấu tích)
    mainSocket?.on("receive_message", handleReceiveMessage);
    mainSocket?.on("status_updated", updateMessageStatusInState);

    return () => {
      // Dọn dẹp listener khi component unmount hoặc selectedConversationId thay đổi
      mainSocket?.off("receive_message", handleReceiveMessage);
      mainSocket?.off("status_updated", updateMessageStatusInState);
      if (mainSocket && selectedConversationId) {
        mainSocket.emit("leave_conversation", selectedConversationId);
      }
    };
  }, [selectedConversationId, user.id, updateMessageStatusInState, mainSocket]);

  // Effect cho việc cuộn trang và fetch API ban đầu
  useEffect(() => {
    // reset
    setMessages([]);
    setHasMore(true);

    // Đảm bảo fetch lại messages khi đổi conversation/chatUser
    if (selectedConversationId) {
      (async () => {
        await fetchedMessages();
        // scroll to bottom after messages rendered
        setTimeout(() => scrollToBottom(false), 50);
      })();
    }
  }, [chatUser, selectedConversationId]);

  useEffect(() => {
    // mỗi khi messages thay đổi, nếu ở bottom thì scroll
    const container = messagesContainerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isAtBottom) {
      // small delay để DOM cập nhật
      setTimeout(() => scrollToBottom(), 50);
    }
  }, [messages, chatUser]);

  const addTempMessageToUI = (tempMessage) => {
    setMessages((prev) => [...prev, tempMessage]);
    // after adding temp message, scroll to bottom
    setTimeout(() => scrollToBottom(), 50);
  };

  const handleSendMessage = async (e, content, images) => {
    e.preventDefault();

    if (!content.trim() && images.length === 0) return;
    let tempId = null;

    let currentConversationId = selectedConversationId;

    if (!currentConversationId) {
      currentConversationId = await createNewConversation(
        chatUser.id,
        axiosPrivate
      );
      setSelectedConversationId(currentConversationId);
    } else {
      tempId = `temp-${Date.now()}`;
      const tempMessage = {
        id: tempId,
        conversation_id: selectedConversationId,
        sender_id: user.id,
        content: content,
        type: images.length > 0 ? "image" : "text",
        sent_at: new Date().toISOString(),
        status: "sending",
        media: images.map((file) => ({
          media_url: file.preview,
          media_file_type: "image",
        })),
      };
      addTempMessageToUI(tempMessage);
    }

    let uploadedImages = [];
    try {
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((file) => {
          formData.append("message_images", file);
        });

        uploadedImages = await uploadMessageImages(formData, axiosPrivate);
      }

      const messageData = {
        conversationId: currentConversationId,
        senderId: user.id,
        content: content.trim(),
        type: images.length > 0 ? "image" : "text",
        media: uploadedImages,
        tempId,
      };

      const savedMessage = await sendMessage(messageData, axiosPrivate);
      if (savedMessage) {
        onConversationMessageUpdate?.({
          ...savedMessage,
          status: "sent",
        });
      }
    } catch {
      // mark last message as error
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          updated[lastIndex] = { ...updated[lastIndex], status: "error" };
        }
        return updated;
      });
    }
  };

  const markChatAsRead = () => {
    if (
      !mainSocket ||
      !user.id ||
      !selectedConversationId ||
      messages.length === 0
    )
      return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender_id !== user.id && lastMessage.status !== "read") {
      updateMessageStatus(
        selectedConversationId,
        lastMessage.id,
        user.id,
        "read",
        axiosPrivate
      );
    }
  };

  // Handle scroll: load more when near top + mark as read
  const handleScroll = async () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // mark read on scroll
    markChatAsRead();

    if (isFetching || !hasMore) return;

    // if near top -> load older messages
    if (container.scrollTop < 50) {
      setIsFetching(true);

      const firstMessageId = messages[0]?.id;
      const oldHeight = container.scrollHeight;

      await fetchedMessages(20, firstMessageId);

      // preserve scroll position to avoid jump
      const newHeight = container.scrollHeight;
      container.scrollTop = newHeight - oldHeight + container.scrollTop; // keep user's viewport stable

      setIsFetching(false);
    }
  };

  return (
    <section className="h-full">
      {chatUser ? (
        <section className="h-full flex flex-col">
          <div className="">
            <ChatHeader
              isChatUserOnline={onlineUsers.includes(chatUser.id.toString())}
              onBack={onBack}
            />
          </div>

          {/* Phần hiển thị tin nhắn - Thêm onClick để bắt sự kiện người dùng tương tác */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 bg-gray-50"
            onClick={markChatAsRead}
            onScroll={handleScroll}
          >
            {messages &&
              messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  currentUser={user}
                  chatUser={chatUser}
                />
              ))}
            {/* Element neo để cuộn xuống */}
            <div ref={messagesEndRef} />
          </div>

          {/* Phần nhập liệu */}
          <div className="">
            <ChatFooter onSendMessage={handleSendMessage} />
          </div>
        </section>
      ) : (
        // ... (Phần UI khi chưa chọn chatUser) ...
        <section className="h-full lg:flex justify-center items-center hidden">
          <div className="flex flex-col justify-center items-center gap-1">
            <div className="p-4 rounded-full bg-black text-white size-20">
              <MessageCircleMore size={50} />
            </div>
            <h5 className="font-medium text-lg">Your Messages</h5>
            <p>Send images or messages to yout friends</p>
            <button
              className="bg-black py-1 px-2  rounded-lg text-white cursor-pointer hover:bg-gray-700 active:bg-gray-800"
              onClick={() => setIsOpenNewMessage(true)}
            >
              Send Messages
            </button>
          </div>
        </section>
      )}
    </section>
  );
};

export default ChatMain;

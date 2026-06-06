// Gateway Service: gateway.service.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import ENV from "../helpers/env.helper.js";
import socketAuth from "../middlewares/socketAuth.js";
import {
  consumeQueue,
  sendQueue,
  subscribeDirect,
} from "../messages/rabbitMQ.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // origin: ENV.CLIENT_URL,
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.use(socketAuth);

const userSocketMap = {};

const emitToUser = (userId, eventName, data) => {
  const socketId = userSocketMap[userId];
  if (socketId) {
    io.to(socketId).emit(eventName, data);
  }
};

io.on("connection", (socket) => {
  // socket.userId sẽ là userId thật (string) hoặc null (nếu là khách)
  const userId = socket.userId;

  console.log(
    `Socket connected. User ID: ${userId ? userId : "Guest"}, Socket ID: ${
      socket.id
    }`
  );

  // --- Xử lý cho người dùng ĐÃ ĐĂNG NHẬP ---
  if (userId) {
    userSocketMap[userId] = socket.id;

    //Cấp một room riêng thep userid
    socket.join(`user_${userId}`);
    console.log(`User ${userId} has joined his own room`);

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${userId} joined room conversation_${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.id} left room conversation_${conversationId}`);
    });
  }

  // --- Logic CHUNG cho cả KHÁCH và USER ĐĂNG NHẬP (VD: Public Post Updates) ---

  socket.on("join_postRoom", (postId) => {
    // Cả khách và user đều có thể join room này để nhận realtime like/comment
    console.log(
      `User ${userId ? userId : "Guest"} joining room post_${postId}`
    );
    socket.join(`post_${postId}`);
  });

  socket.on("leave_postRoom", (postId) => {
    console.log(`User ${socket.id} leaving room post_${postId}`);
    socket.leave(`post_${postId}`);
  });

  // --- Xử lý sự kiện ngắt kết nối (Disconnect) ---
  socket.on("disconnect", async () => {
    console.log(
      `User disconnected. Socket ID: ${socket.id}, User ID: ${
        userId ? userId : "Guest"
      }`
    );

    // Chỉ xử lý logic offline cho người dùng ĐÃ ĐĂNG NHẬP
    if (userId && userSocketMap[userId]) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));

      // Cập nhật trạng thái hoạt động lần cuối (chỉ cho user đăng nhập)
      await sendQueue(
        "user_last_active_updates",
        JSON.stringify({ userId: userId, timestamp: Date.now() })
      );
      io.emit("user_last_active_updates", {
        userId: userId,
        timestamp: Date.now(),
      });
    }
  });
});

async function connectRabbitMQ() {
  try {
    await consumeQueue("chat_events_to_client", async (msg) => {
      if (msg) {
        const event = JSON.parse(msg);
        // Phân loại event và phát sóng (emit) tới đúng phòng/client
        switch (event.type) {
          case "NEW_MESSAGE_SAVED":
            // Phát tin nhắn đã lưu tới phòng chat
            io.to(`conversation_${event.data.conversation_id}`).emit(
              "receive_message",
              event.data
            );

            // Gửi notification riêng cho người nhận
            io.to(`user_${event.data.receiverId}`).emit(
              "chat_notification",
              event.data
            );

            if (userSocketMap[event.data.receiverId]) {
              await sendQueue(
                "chat_message_status_updates",
                JSON.stringify({
                  conversationId: event.data.conversation_id,
                  messageId: event.data.id,
                  userId: event.data.receiverId,
                  status: "delivered",
                })
              );
            }

            break;
          case "MESSAGE_STATUS_UPDATED":
            // Phát cập nhật trạng thái
            io.to(`conversation_${event.data.conversationId}`).emit(
              "status_updated",
              event.data
            );
            break;
        }
      }
    });

    // ==================== FRIEND EVENTS ====================
    await consumeQueue("friend_events_to_client", (msg) => {
      if (msg) {
        const event = JSON.parse(msg);
        console.log("📨 [FRIEND]", event.type, event.data);

        const { targetUserId, ...eventData } = event.data;

        switch (event.type) {
          case "friend_request_received":
            // Emit to user nhận friend request
            emitToUser(targetUserId, "friend_request_received", {
              fromUserId: event.data.fromUserId,
              timestamp: event.data.timestamp,
            });
            break;

          case "friend_request_accepted":
            // Emit to user gửi request ban đầu
            emitToUser(targetUserId, "friend_request_accepted", {
              userId: event.data.userId,
              timestamp: event.data.timestamp,
            });
            break;

          case "unfriended":
            // Emit to user bị unfriend
            emitToUser(targetUserId, "unfriended", {
              userId: event.data.userId,
              timestamp: event.data.timestamp,
            });
            break;

          case "user_blocked":
            // Emit to user bị block
            emitToUser(targetUserId, "user_blocked", {
              userId: event.data.userId,
              timestamp: event.data.timestamp,
            });
            break;

          default:
            console.log("Unknown friend event type:", event.type);
        }
      }
    });

    // ==================== NOTIFICATION EVENTS ====================
    await consumeQueue("notification_events_to_client", (msg) => {
      if (msg) {
        const event = JSON.parse(msg);
        console.log("📨 [NOTIFICATION]", event.type);

        switch (event.type) {
          case "new_notification":
            emitToUser(event.data.userId, "new_notification", event.data);
            break;

          case "notification_read":
            emitToUser(event.data.userId, "notification_read", event.data);
            break;
        }
      }
    });

    //Ban be tạo bài post mới
    await subscribeDirect(
      "events_notificaiton",
      "new_friend_post",
      async (msg) => {
        const data = JSON.parse(msg);
        console.log("post data", msg);
      }
    );

    await subscribeDirect(
      "events_notificaiton",
      "new_unread_notification",
      async (msg) => {
        const data = JSON.parse(msg);
        if (Array.isArray(data)) {
          data.map((noti) => {
            io.to(`user_${noti.recipient_id}`).emit(
              "new_unread_notification",
              noti
            );
          });
        } else {
          io.to(`user_${data.recipient_id}`).emit(
            "new_unread_notification",
            data
          );
        }
      }
    );

    await subscribeDirect(
      "events_notificaiton",
      "new_friend_comment",
      async (msg) => {
        const data = JSON.parse(msg);
        console.log("post data", msg);
      }
    );

    await subscribeDirect(
      "post_events_pubsub",
      "post_like_updated",
      async (msg) => {
        const data = JSON.parse(msg);
        console.log("update data", data);
        io.to(`post_${data.postId}`).emit("update_post_likes", data);
      }
    );

    await subscribeDirect(
      "post_events_pubsub",
      "post_comment_created",
      async (msg) => {
        const data = JSON.parse(msg);
        io.to(`post_${data.postId}`).emit("receive_new_comment", data.comment);
      }
    );
  } catch (error) {
    console.error("Error connecting to RabbitMQ in Gateway:", error);
    setTimeout(connectRabbitMQ, 5000);
  }
}

connectRabbitMQ();

export { io, server, app };

import morgan from "morgan";
import { checkConnection } from "./database/connectDB.js";
import errorHandler from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";
import ENV from "./helpers/env.helper.js";
import conversationRouter from "./routes/conversation.route.js";
import messageRouter from "./routes/message.route.js";
import express from "express";
import { consumeQueue, sendQueue } from "./messages/rabbitMQ.js";
import MessageModel from "./models/message.model.js";

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/health", (_, res) => res.json({ success: true, service: "chat" }));

const PORT = ENV.PORT || 3002;

app.use("/conversations", conversationRouter);
app.use("/messages", messageRouter);

app.use(errorHandler);

const consumeMessageStatusUpdates = async () => {
  await consumeQueue("chat_message_status_updates", async (message) => {
    const { conversationId, messageId, userId, status } = JSON.parse(message);

    if (status !== "delivered") return;

    const wasUpdated = await MessageModel.markMessageStatus(
      messageId,
      userId,
      status
    );

    if (!wasUpdated) return;

    await sendQueue(
      "chat_events_to_client",
      JSON.stringify({
        type: "MESSAGE_STATUS_UPDATED",
        data: { conversationId, messageId, status },
      })
    );
  });
};

app.listen(PORT, async () => {
  console.log(`Chat service on ${PORT}`);
  await checkConnection();
  await consumeMessageStatusUpdates();
});

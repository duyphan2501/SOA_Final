import { createProxyMiddleware } from "http-proxy-middleware";
import { app, server } from "./config/socket.config.js";
import morgan from "morgan";
import cors from "cors";
import ENV from "./helpers/env.helper.js";

app.use(morgan("tiny"));
app.use(
  cors({
    origin: [ENV.CLIENT_URL, "http://localhost:5173"],
    credentials: true,
  }),
);

const PORT = ENV.GATEWAY_PORT || 3000;
const USER_TARGET = ENV.USER_TARGET || "http://localhost:3001";
const CHAT_TARGET = ENV.CHAT_TARGET || "http://localhost:3002";
const FRIEND_TARGET = ENV.FRIEND_TARGET || "http://localhost:3003";
const POST_TARGET = ENV.POST_TARGET || "http://localhost:3004";
const NOTIFICATION_TARGET = ENV.NOTIFICATION_TARGET || "http://localhost:3005";

app.get("/health", (_, res) => res.json({ ok: true, service: "gateway" }));

app.use(
  "/api/v1/users",
  createProxyMiddleware({
    target: USER_TARGET,
    changeOrigin: true,
    pathRewrite: { "^/api/v1/users": "" },
  }),
);
app.use(
  "/api/v1/chat",
  createProxyMiddleware({
    target: CHAT_TARGET,
    changeOrigin: true,
    pathRewrite: { "^/api/v1/chat": "" },
  }),
);
app.use(
  "/api/v1/friends",
  createProxyMiddleware({
    target: FRIEND_TARGET,
    changeOrigin: true,
    pathRewrite: { "^/api/v1/friends": "" },
  }),
);

app.use(
  "/api/v1/posts",
  createProxyMiddleware({
    target: POST_TARGET,
    changeOrigin: true,
    pathRewrite: { "^/api/v1/posts": "" },
  }),
);

app.use(
  "/api/v1/notifications",
  createProxyMiddleware({
    target: NOTIFICATION_TARGET,
    changeOrigin: true,
    pathRewrite: { "^/api/v1/notifications": "" },
  }),
);

server.listen(PORT, () => console.log(`API Gateway on ${PORT}`));

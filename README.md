# Microservice Social Network

A social networking platform built with a **microservices architecture**, containerized with Docker Compose. Each business domain runs as an independent service communicating via **RabbitMQ** (async events + RPC) and a centralized **API Gateway** that also hosts the **Socket.IO** real-time layer. Nginx sits in front routing HTTP and WebSocket traffic.

> **Stack:** React · Node.js · Express.js · MySQL · RabbitMQ · Socket.IO · Docker · Nginx

---

## System Architecture

```
                        ┌─────────────────────────────┐
Browser ──── Nginx :80 ─┤  /          → Client        │
                        │  /api/      → Gateway :3000  │
                        │  /socket.io → Gateway :3000  │
                        └─────────────┬───────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │       API Gateway        │
                         │  Express + Socket.IO     │
                         │  http-proxy-middleware   │
                         │  JWT socketAuth          │
                         └──┬──────────────┬────────┘
                            │ HTTP proxy   │ RabbitMQ consume
              ┌─────────────▼──────────────▼────────────┐
              │              RabbitMQ Broker              │
              │  Queues · Fanout Exchange · Direct Exch. │
              └──┬──────┬────────┬──────────┬────────────┘
                 │      │        │          │
          ┌──────▼──┐ ┌─▼──┐ ┌──▼──┐ ┌────▼──────┐ ┌───────────────┐
          │  users  │ │chat│ │posts│ │  friend   │ │ notifications │
          │  :3001  │ │3002│ │3004 │ │   :3003   │ │    :3005      │
          └────┬────┘ └──┬─┘ └──┬──┘ └────┬──────┘ └───────┬───────┘
               │         │      │          │                 │
               └─────────┴──────┴──────────┴─────────────────┘
                                      │
                              ┌───────▼────────┐
                              │  MySQL :3306   │
                              │  userdb        │
                              │  chatdb        │
                              │  postdb        │
                              │  frienddb      │
                              │  notificationdb│
                              └────────────────┘
```

---

## Technical Highlights

### API Gateway as the Single Entry Point
All client requests hit the **API Gateway** (Express + `http-proxy-middleware`), which path-rewrites and forwards to the appropriate downstream service. The Gateway also owns the **Socket.IO server**, making it the single point for both HTTP and WebSocket connections — no client needs to know individual service ports.

```
/api/v1/users        →  users-service   :3001
/api/v1/chat         →  chat-service    :3002
/api/v1/friends      →  friend-service  :3003
/api/v1/posts        →  post-service    :3004
/api/v1/notifications → notif-service  :3005
```

### RabbitMQ — Three Messaging Patterns

**1. Work Queue (Fire-and-forget)**  
Used for one-way tasks where no response is needed: updating `last_active_at` when a user disconnects, or publishing friend/chat events to the gateway.
```
Socket disconnect → Gateway → queue: user_last_active_updates → users-service
```

**2. RPC over RabbitMQ (Request-Reply)**  
Services that need data from another service send a message with a `replyTo` (exclusive reply queue) and `correlationId`. The owner service responds to that queue — full cross-service queries with no direct HTTP coupling.
```
friend-service → queue: user.get_by_ids → users-service → reply queue
posts-service  → queue: user.search     → users-service → reply queue
```

**3. Pub/Sub with Direct Exchange**  
Event fan-out for real-time updates. The Gateway subscribes to exchanges and emits to connected Socket.IO rooms:
```
post-service     → exchange: post_events_pubsub  (routing: post_like_updated, post_comment_created)
notifications-service → exchange: events_notification (routing: new_unread_notification)
friend-service   → exchange: friend_events       (fanout)
```

### Real-time with Socket.IO at the Gateway
The Gateway manages a `userSocketMap` (userId → socketId) and organizes connections into rooms:
- `user_{userId}` — private room for direct notifications (friend requests, chat alerts)
- `conversation_{id}` — chat room, users join/leave explicitly
- `post_{id}` — live like & comment updates, open to guests too

JWT is verified at the socket middleware layer (`socketAuth`) — unauthenticated connections are allowed but treated as guests with limited room access.

### Database-per-Service
Each microservice owns its own MySQL database schema (initialized via a shared `init.sql` on first boot). Services never query each other's DB directly — all cross-service data access goes through RabbitMQ.

```
userdb         → users, single_use_tokens
chatdb         → conversations, messages, message_statuses, message_media
postdb         → posts, comments, likes, media
frienddb       → friendships, friend_requests, blocks
notificationdb → notifications
```

### Fully Containerized with Docker Compose
All 8 services (nginx, mysql, rabbitmq, gateway, users, chat, friend, posts, notifications) are defined in a single `docker-compose.yml` with:
- **Health checks** on MySQL and RabbitMQ before dependent services start
- **Shared bridge network** (`finalsoa`) for inter-service DNS resolution
- **Named volume** for MySQL data persistence
- **Build-time env args** injected into the React client via Vite

---

## Features

**Users:** Register / Login / JWT auth (Access + Refresh Token) · Email verification · Avatar upload (Cloudinary) · Profile editing · Last active tracking

**Posts:** Create/edit/delete posts with images · Like · Comment · Real-time like & comment updates via Socket.IO

**Chat:** 1-on-1 messaging · Image messages · Message read status · Real-time delivery via Socket.IO rooms

**Friends:** Send / accept / decline friend requests · Unfriend · Block · Real-time friend request notifications

**Notifications:** Persistent notification store · Real-time push via Socket.IO · Mark as read

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS, Zustand, Socket.IO Client, MUI |
| **Gateway** | Node.js, Express, http-proxy-middleware, Socket.IO, JWT |
| **Services** | Node.js, Express.js v5, ES Modules |
| **Messaging** | RabbitMQ (amqplib) — Work Queue, RPC, Direct/Fanout Exchange |
| **Database** | MySQL 8 (database-per-service), mysql2 driver |
| **Auth** | JWT (Access + Refresh Token), bcryptjs |
| **Media** | Cloudinary, Multer |
| **Email** | Nodemailer |
| **Infra** | Docker, Docker Compose, Nginx (reverse proxy + WebSocket) |

---

## Project Structure

```
├── client/                    # React SPA
├── nginx.conf                 # Reverse proxy: HTTP + WebSocket routing
├── docker-compose.yml         # All 8 services, healthchecks, networks
├── scripts/init.sql           # All DB schemas initialized on first boot
└── server/
    ├── gateway/               # API Gateway + Socket.IO server
    │   ├── server.js          # Proxy routes
    │   ├── config/socket.config.js  # Socket rooms + RabbitMQ consumers
    │   ├── middlewares/socketAuth.js
    │   └── messages/rabbitMQ.js     # Queue/Exchange helpers
    └── services/
        ├── users/             # Auth, profile, RPC responder
        ├── chat/              # Conversations, messages
        ├── posts/             # Posts, likes, comments
        ├── friend/            # Friend graph, block list
        └── notifications/     # Notification store & push
```
# Guide to configuring a demo project with Docker Compose

# Requirements

Before running the project, you need to install the following:

* Docker
* Docker Compose

Checking command:

```bash
docker --version
docker compose version
```

---

# Project Structure

```
project
├── client
├── server
├── scripts
├── docker-compose.yml
├── .env
├── .gitignore
├── nginx.conf
└── README.md
```

---

# Run project with Docker

## 1. Clone project

```bash
git clone https://github.com/duyphan2501/microservice_social_network.git
```

```bash
cd microservice_social_network
```

---

## 2. Set up environment variables

Change file `.env.example` to `.env`.
```bash
cp .env.example .env
```

Adjust if needed. Example:

```
#For account registration, reset password
EMAIL_USERNAME=
EMAIL_APP_PASSWORD=

#For sending images, posts with media...
CLOUDINARY_API_KEY= 
CLOUDINARY_SECRET_KEY= 
CLOUDINARY_NAME= 
```

---

## 3. Build Docker Image

```bash
docker compose build
```

---

## 4. Run container

```bash
docker compose up -d
```

---

# Access the application 
After the container run is complete, open your browser:
```
http://localhost:5173
```

---

# Access MySQL

```bash
docker exec -it mysqldb mysql -u root -p
```
Enter Password: 123456

Database Information:
* View in scripts or server/sql
* Demo account:
    - username: jane_smith
    - username: john_doe
* Password: 1234


# Stop project

```bash
docker compose down
```

---

# Delete container + volume

```bash
docker compose down -v
```

# Troubleshooting

## Port is already in use

```
port is already allocated
```

Change port in `docker-compose.yml`.

---

## Build image error

Try:

```bash
docker compose build --no-cache
```

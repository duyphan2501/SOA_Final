SET NAMES utf8mb4;

-- =====================================================
-- USER DATABASE
-- =====================================================
CREATE DATABASE IF NOT EXISTS userdb
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE userdb;

DROP TABLE IF EXISTS single_use_tokens;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    refresh_token VARCHAR(255),
    refresh_token_expires_at TIMESTAMP NULL,
    last_active_at TIMESTAMP NULL
);

CREATE TABLE single_use_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('VERIFY_EMAIL','RESET_PASSWORD') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (username,email,password_hash,full_name,avatar_url,bio,last_active_at)
VALUES
('john_doe','john@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','John Doe','https://ui-avatars.com/api/?name=john&size=32&background=e3e8f0&color=0068FF&bold=true','I love coding and coffee',NOW()),
('jane_smith','jane@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','Jane Smith','https://ui-avatars.com/api/?name=jane&size=32&background=e3e8f0&color=0068FF&bold=true','Full-stack developer',NOW()),
('mike_nguyen','mike@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','Mike Nguyen','https://ui-avatars.com/api/?name=mike&size=32&background=e3e8f0&color=0068FF&bold=true','Tech blogger',NOW()),
('anna_tran','anna@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','Anna Tran','https://ui-avatars.com/api/?name=anna&size=32&background=e3e8f0&color=0068FF&bold=true','Designer',NOW()),

-- =====================================================
-- CHAT DATABASE
-- =====================================================
CREATE DATABASE IF NOT EXISTS chatdb
CHARACTER SET utf8mb4;

USE chatdb;

DROP TABLE IF EXISTS message_media;
DROP TABLE IF EXISTS message_statuses;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;

CREATE TABLE conversations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    creator_id BIGINT UNSIGNED NOT NULL,
    partner_id BIGINT UNSIGNED NOT NULL,
    last_message_id BIGINT UNSIGNED NULL,
    status ENUM('new','waiting','active','delete') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    sender_id BIGINT UNSIGNED NOT NULL,
    content TEXT,
    type ENUM('text','image') DEFAULT 'text',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    media_count SMALLINT DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE message_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT UNSIGNED NOT NULL,
    media_url VARCHAR(255) NOT NULL,
    media_type ENUM('image','video','file') DEFAULT 'image',
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE TABLE message_statuses (
    message_id BIGINT UNSIGNED,
    receiver_id BIGINT UNSIGNED,
    status ENUM('sent','delivered','read') DEFAULT 'sent',
    read_at TIMESTAMP NULL,
    PRIMARY KEY (message_id,receiver_id)
);

INSERT INTO conversations (creator_id,partner_id)
VALUES
(1,2),
(1,3),
(2,3);

INSERT INTO messages (conversation_id,sender_id,content)
VALUES
(1,1,'Chào Jane'),
(1,2,'Chào John'),
(2,1,'Hello Mike'),
(2,3,'Hi John'),
(3,2,'Hello Mike'),
(3,3,'Hi Jane');

UPDATE conversations SET last_message_id=2 WHERE id=1;
UPDATE conversations SET last_message_id=4 WHERE id=2;
UPDATE conversations SET last_message_id=6 WHERE id=3;

INSERT INTO message_statuses VALUES
(1,2,'read',NOW()),
(2,1,'read',NOW()),
(3,3,'delivered',NULL),
(4,1,'sent',NULL);

INSERT INTO messages (conversation_id,sender_id,content,type,media_count)
VALUES (1,1,'Hai ảnh mới nhé','image',2);

SET @mid = LAST_INSERT_ID();

INSERT INTO message_media (message_id,media_url)
VALUES
(@mid,'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d'),
(@mid,'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee');

UPDATE conversations SET last_message_id=@mid WHERE id=1;

-- =====================================================
-- FRIEND DATABASE
-- =====================================================
CREATE DATABASE IF NOT EXISTS frienddb
CHARACTER SET utf8mb4;

USE frienddb;

DROP TABLE IF EXISTS friend_relationships;

CREATE TABLE friend_relationships (
    user_id_1 BIGINT UNSIGNED,
    user_id_2 BIGINT UNSIGNED,
    status ENUM('pending','accepted','declined','blocked'),
    action_user_id BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id_1,user_id_2)
);

INSERT INTO friend_relationships
VALUES
(1,2,'accepted',1,NOW()),
(1,3,'accepted',3,NOW()),
(2,4,'pending',2,NOW());

-- =====================================================
-- NOTIFICATION DATABASE
-- =====================================================
CREATE DATABASE IF NOT EXISTS notificationdb
CHARACTER SET utf8mb4;

USE notificationdb;

DROP TABLE IF EXISTS notifications;

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recipient_id BIGINT UNSIGNED,
    sender_id BIGINT UNSIGNED,
    type ENUM('post_like','post_comment','friend_request','friend_accepted','new_message'),
    entity_type ENUM('post','comment','user','message'),
    entity_id BIGINT UNSIGNED,
    content VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notifications (recipient_id,sender_id,type,entity_type,entity_id,content)
VALUES
(1,2,'friend_request','user',2,'Jane sent you a friend request'),
(2,1,'friend_accepted','user',1,'John accepted your request'),
(1,3,'new_message','message',1,'Mike sent you a message');

-- =====================================================
-- POST DATABASE
-- =====================================================
CREATE DATABASE IF NOT EXISTS postdb
CHARACTER SET utf8mb4;

USE postdb;

DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS post_media;
DROP TABLE IF EXISTS posts;

CREATE TABLE posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    content TEXT,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE post_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED,
    media_url VARCHAR(255),
    media_type ENUM('image','video'),
    display_order INT DEFAULT 1,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED,
    user_id BIGINT UNSIGNED,
    parent_comment_id BIGINT UNSIGNED NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE likes (
    user_id BIGINT UNSIGNED,
    post_id BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id,post_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

INSERT INTO posts (user_id,content,likes_count,comments_count)
VALUES
(1,'Bài đăng đầu tiên của John',5,2),
(2,'Album ảnh phong cảnh',10,3),
(3,'Video lập trình MySQL',4,1);

INSERT INTO post_media (post_id,media_url,media_type,display_order)
VALUES
(2,'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee','image',1),
(2,'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d','image',2),
(3,'https://images.unsplash.com/photo-1492724441997-5dc865305da7','video',1);

INSERT INTO comments (post_id,user_id,content)
VALUES
(2,1,'Bộ ảnh đẹp quá'),
(2,2,'Cảm ơn nhé'),
(3,1,'Video hay');

INSERT INTO likes VALUES
(1,2,NOW()),
(2,1,NOW()),
(3,2,NOW());
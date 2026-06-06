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
('john_doe','john@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','John Doe','https://i.pravatar.cc/300?img=12','I love coding and coffee',NOW()),
('jane_smith','jane@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','Jane Smith','https://i.pravatar.cc/300?img=47','Full-stack developer and traveler',NOW()),
('mike_nguyen','mike@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','Mike Nguyen','https://i.pravatar.cc/300?img=11','Tech blogger and weekend photographer',NOW()),
('anna_tran','anna@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','Anna Tran','https://i.pravatar.cc/300?img=32','Product designer who loves minimal interfaces',NOW()),
('david_lee','david@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','David Lee','https://i.pravatar.cc/300?img=15','Building useful products one commit at a time',NOW()),
('sophia_park','sophia@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','Sophia Park','https://i.pravatar.cc/300?img=45','Food, books, and small adventures',NOW()),
('alex_wilson','alex@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','Alex Wilson','https://i.pravatar.cc/300?img=13','Frontend engineer and open-source contributor',NOW()),
('emma_brown','emma@example.com','$2b$10$GwA5olt2.T1c49riSxoxYeOzbrIZRqpe2GWBjR.pkiC6yuMS5E27y','Emma Brown','https://i.pravatar.cc/300?img=44','Exploring cities with a camera',NOW());

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

INSERT INTO posts (user_id,content,likes_count,comments_count,created_at)
VALUES
(1,'Starting the week with coffee and a clean task list.',2,1,NOW() - INTERVAL 11 DAY),
(2,'A quiet morning in the mountains. The early hike was worth it.',4,2,NOW() - INTERVAL 10 DAY),
(3,'A few photos from my weekend walk through the city.',3,1,NOW() - INTERVAL 9 DAY),
(4,'New dashboard concept: fewer distractions, clearer actions.',3,2,NOW() - INTERVAL 8 DAY),
(5,'Today I finally shipped the feature I have been working on all week.',4,1,NOW() - INTERVAL 7 DAY),
(6,'Found a small cafe with excellent pastries and an even better view.',3,2,NOW() - INTERVAL 6 DAY),
(7,'CSS tip: start with the smallest layout, then add complexity only when the screen needs it.',4,2,NOW() - INTERVAL 5 DAY),
(8,'Golden hour makes every street look cinematic.',3,1,NOW() - INTERVAL 4 DAY),
(1,'Learning something new is easier when you build a tiny project with it.',4,2,NOW() - INTERVAL 3 DAY),
(2,'Weekend escape: fresh air, blue water, and no notifications.',5,2,NOW() - INTERVAL 2 DAY),
(3,'My desk setup after a much-needed cleanup.',3,1,NOW() - INTERVAL 1 DAY),
(4,'Typography study for a new mobile app.',3,2,NOW() - INTERVAL 4 HOUR);

INSERT INTO post_media (post_id,media_url,media_type,display_order)
VALUES
(1,'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80','image',1),
(2,'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80','image',1),
(2,'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80','image',2),
(3,'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80','image',1),
(3,'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80','image',2),
(4,'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80','image',1),
(6,'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80','image',1),
(8,'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80','image',1),
(10,'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80','image',1),
(10,'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80','image',2),
(11,'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80','image',1),
(12,'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80','image',1);

INSERT INTO comments (post_id,user_id,parent_comment_id,content,created_at)
VALUES
(1,2,NULL,'A clean task list is the best way to start.',NOW() - INTERVAL 11 DAY),
(2,1,NULL,'That view is incredible.',NOW() - INTERVAL 10 DAY),
(2,4,2,'Adding this trail to my travel list.',NOW() - INTERVAL 10 DAY),
(3,8,NULL,'The light in the second photo is perfect.',NOW() - INTERVAL 9 DAY),
(4,7,NULL,'The spacing feels really balanced.',NOW() - INTERVAL 8 DAY),
(4,2,5,'Would love to see the mobile version too.',NOW() - INTERVAL 8 DAY),
(5,1,NULL,'Congratulations on the launch!',NOW() - INTERVAL 7 DAY),
(6,4,NULL,'What is the name of this cafe?',NOW() - INTERVAL 6 DAY),
(6,6,8,'It is called Corner House. Highly recommended.',NOW() - INTERVAL 6 DAY),
(7,5,NULL,'Mobile-first has saved me so much debugging time.',NOW() - INTERVAL 5 DAY),
(7,1,10,'Especially when the navigation gets complicated.',NOW() - INTERVAL 5 DAY),
(8,3,NULL,'Great colors in this shot.',NOW() - INTERVAL 4 DAY),
(9,7,NULL,'Tiny projects are the best documentation.',NOW() - INTERVAL 3 DAY),
(9,3,13,'And much easier to remember than tutorials.',NOW() - INTERVAL 3 DAY),
(10,6,NULL,'This looks peaceful.',NOW() - INTERVAL 2 DAY),
(10,1,15,'Perfect place for a weekend reset.',NOW() - INTERVAL 2 DAY),
(11,4,NULL,'The setup looks very focused now.',NOW() - INTERVAL 1 DAY),
(12,8,NULL,'The font pairing works beautifully.',NOW() - INTERVAL 3 HOUR),
(12,5,18,'A Storybook preview would be useful too.',NOW() - INTERVAL 2 HOUR);

INSERT INTO likes (user_id,post_id,created_at)
VALUES
(2,1,NOW()),(3,1,NOW()),
(1,2,NOW()),(3,2,NOW()),(4,2,NOW()),(6,2,NOW()),
(1,3,NOW()),(4,3,NOW()),(8,3,NOW()),
(2,4,NOW()),(5,4,NOW()),(7,4,NOW()),
(1,5,NOW()),(2,5,NOW()),(3,5,NOW()),(7,5,NOW()),
(1,6,NOW()),(4,6,NOW()),(8,6,NOW()),
(1,7,NOW()),(2,7,NOW()),(5,7,NOW()),(8,7,NOW()),
(2,8,NOW()),(3,8,NOW()),(6,8,NOW()),
(2,9,NOW()),(3,9,NOW()),(5,9,NOW()),(7,9,NOW()),
(1,10,NOW()),(3,10,NOW()),(4,10,NOW()),(6,10,NOW()),(8,10,NOW()),
(2,11,NOW()),(4,11,NOW()),(7,11,NOW()),
(1,12,NOW()),(6,12,NOW()),(8,12,NOW());

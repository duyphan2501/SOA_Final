import { pool } from "../database/connectDB.js";

const MessageModel = {
  saveNewMessage: async (messageData) => {
    const {
      conversationId,
      senderId,
      content,
      type = "text",
      media = [],
    } = messageData;
    let messageId = null;
    let receiverId = null;

    // 1. Lấy một kết nối cụ thể từ pool
    const connection = await pool.getConnection();

    try {
      // Bắt đầu transaction trên kết nối đó
      await connection.beginTransaction();

      // 1. Insert vào bảng messages (Dùng 'connection' thay vì 'pool' cho TẤT CẢ các query bên dưới)
      const messageInsertQuery = `
        INSERT INTO messages (conversation_id, sender_id, content, type, media_count)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [messageResult] = await connection.query(messageInsertQuery, [
        conversationId,
        senderId,
        content,
        type,
        media.length,
      ]);
      messageId = messageResult.insertId;

      // 2. Insert vào bảng message_media nếu có media
      if (media.length > 0) {
        const mediaInsertQuery = `
          INSERT INTO message_media (message_id, media_url, media_public_id, media_type)
          VALUES ?
        `;
        const mediaValues = media.map((m) => [
          messageId,
          m.url,
          m.publicId,
          m.type,
        ]);
        
        await connection.query(mediaInsertQuery, [mediaValues]); // <-- Dùng connection
      }

      // 3. Cập nhật last_message_id trong bảng conversations
      const updateConversationQuery = `
        UPDATE conversations
        SET last_message_id = ?
        WHERE id = ?
      `;
      await connection.query(updateConversationQuery, [
        messageId,
        conversationId,
      ]); // <-- Dùng connection

      // 4. Thêm trạng thái tin nhắn cho người gửi và người nhận (giả định 1-1 chat)
      const [convoRows] = await connection.query(
        // <-- Dùng connection
        "SELECT creator_id, partner_id FROM conversations WHERE id = ?",
        [conversationId]
      );

      if (convoRows.length > 0) {
        receiverId =
          convoRows[0].creator_id === senderId
            ? convoRows[0].partner_id
            : convoRows[0].creator_id;

        const statusInsertQuery = `
          INSERT INTO message_statuses (message_id, receiver_id, status)
          VALUES (?, ?, 'sent')
        `;
        await connection.query(statusInsertQuery, [messageId, receiverId]);
      }

      const updateActiveConvQuery =
        "UPDATE conversations SET status = ? WHERE id = ? AND creator_id != ? AND status = ?";
      await connection.query(updateActiveConvQuery, [
        "active",
        conversationId,
        senderId,
        "new",
      ]);

      // Commit transaction
      await connection.commit();

      return { messageId, receiverId };
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await connection.rollback();
      console.error("Lỗi khi lưu tin nhắn mới:", error);
      return null;
    } finally {
      connection.release();
    }
  },

  getMessageById: async (messageId) => {
    const query = `
      SELECT 
          m.id,
          m.conversation_id,
          m.sender_id,
          m.content,
          m.type,
          m.sent_at,
          m.media_count,
          COALESCE(
              JSON_ARRAYAGG(
                  JSON_OBJECT('id', mm.id, 'media_url', mm.media_url, 'media_file_type', mm.media_type)
              ), 
              '[]'
          ) AS media
          
      FROM messages m
      LEFT JOIN message_media mm ON m.id = mm.message_id
      WHERE m.id = ?
      GROUP BY m.id
    `;

    // Giả định `pool` là đối tượng kết nối DB của bạn
    const [rows] = await pool.query(query, [messageId]);

    if (rows.length === 0) {
      return null;
    }

    const message = rows[0];
    // Đảm bảo media_details được parse thành JSON nếu driver DB trả về dưới dạng chuỗi
    if (typeof message.media === "string") {
      message.media = JSON.parse(message.media);
    }
    return message;
  },

  markMessageStatus: async (messageId, userId, status) => {
    const query = `
      UPDATE message_statuses
      SET 
          status = ?,
          read_at = CASE WHEN ? = 'read' THEN CURRENT_TIMESTAMP ELSE read_at END
      WHERE message_id = ? AND receiver_id = ?
        AND FIELD(status, 'sent', 'delivered', 'read')
          < FIELD(?, 'sent', 'delivered', 'read')
    `;

    const [result] = await pool.query(query, [
      status,
      status,
      messageId,
      userId,
      status,
    ]);

    return result.affectedRows > 0;
  },
};

export default MessageModel;

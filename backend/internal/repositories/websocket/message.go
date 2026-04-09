package websocket

import (
	"database/sql"
	"log"
	"social/internal/models"

	uuid "github.com/gofrs/uuid"
	_ "github.com/mattn/go-sqlite3"
)



type MessageRepository struct {
	db *sql.DB
}

func NewMessageRepository(db *sql.DB) *MessageRepository {
	return &MessageRepository{
		db: db,
	}
}

func (mr *MessageRepository) CreateMessage(message *models.Message) error {
	ID, err := uuid.NewV4()
	if err != nil {
		log.Printf("❌ Failed to generate UUID: %v", err)
	}
	message.ID = ID.String()
	_, err = mr.db.Exec(
		"INSERT INTO message (id, senderID, receiverID, content) VALUES (?, ?, ?, ?)",
		message.ID,
		message.SenderID,
		message.ReceiverID,
		message.Text,
	)
	return err
}

func (mr *MessageRepository) GetMessageByID(messageID string) (*models.Message, error) {
	var message models.Message
	row := mr.db.QueryRow(`
		SELECT id, senderID, receiverID, content, createDate
		FROM message
		WHERE id = ?`, messageID)
	err := row.Scan(&message.ID, &message.SenderID, &message.ReceiverID, &message.Text, &message.CreateDate)
	if err != nil {
		return nil, err
	}
	return &message, nil
}

func (mr *MessageRepository) GetMessagesBetween(userID string, otherUserID string) ([]*models.Message, error) {
	var messages []*models.Message
	rows, err := mr.db.Query(`
		SELECT id, senderID, receiverID, content, createDate
		FROM message
		WHERE (senderID = ? AND receiverID = ?) OR (senderID = ? AND receiverID = ?)
		ORDER BY createDate ASC`,
		userID, otherUserID, otherUserID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var message models.Message
		if err := rows.Scan(&message.ID, &message.SenderID, &message.ReceiverID, &message.Text, &message.CreateDate); err != nil {
			return nil, err
		}
		messages = append(messages, &message)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return messages, nil
}

package notifications

import (
	"database/sql"
	"time"

	"social/internal/models"

	"github.com/gofrs/uuid"
)

type NotificationRepository struct {
	db *sql.DB
}

func NewNotificationRepository(db *sql.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (nr *NotificationRepository) Create(notification *models.Notification) error {
	if notification.ID == "" {
		ID, err := uuid.NewV4()
		if err == nil {
			notification.ID = ID.String()
		}
	}
	if notification.CreatedAt == "" {
		notification.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	}

	_, err := nr.db.Exec(
		`INSERT INTO notification
			(id, user_id, actor_id, type, entity_id, entity_type, content, is_read, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		notification.ID,
		notification.UserID,
		nullable(notification.ActorID),
		notification.Type,
		nullable(notification.EntityID),
		nullable(notification.EntityType),
		notification.Content,
		boolToInt(notification.IsRead),
		notification.CreatedAt,
	)
	return err
}

func (nr *NotificationRepository) ListByUser(userID string, limit int) ([]models.Notification, error) {
	if limit <= 0 {
		limit = 50
	}

	rows, err := nr.db.Query(`
		SELECT id, user_id, actor_id, type, entity_id, entity_type, content, is_read, created_at
		FROM notification
		WHERE user_id = ?
		ORDER BY created_at DESC
		LIMIT ?
	`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var n models.Notification
		var actorID, entityID, entityType sql.NullString
		var isReadInt int
		if err := rows.Scan(
			&n.ID,
			&n.UserID,
			&actorID,
			&n.Type,
			&entityID,
			&entityType,
			&n.Content,
			&isReadInt,
			&n.CreatedAt,
		); err != nil {
			return nil, err
		}
		if actorID.Valid {
			n.ActorID = actorID.String
		}
		if entityID.Valid {
			n.EntityID = entityID.String
		}
		if entityType.Valid {
			n.EntityType = entityType.String
		}
		n.IsRead = isReadInt == 1
		notifications = append(notifications, n)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return notifications, nil
}

func (nr *NotificationRepository) MarkAllRead(userID string) error {
	_, err := nr.db.Exec(`UPDATE notification SET is_read = 1 WHERE user_id = ?`, userID)
	return err
}

func (nr *NotificationRepository) MarkRead(userID, notificationID string) error {
	_, err := nr.db.Exec(`UPDATE notification SET is_read = 1 WHERE user_id = ? AND id = ?`, userID, notificationID)
	return err
}

func boolToInt(v bool) int {
	if v {
		return 1
	}
	return 0
}

func nullable(value string) interface{} {
	if value == "" {
		return nil
	}
	return value
}

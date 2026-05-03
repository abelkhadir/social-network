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

func (nr *NotificationRepository) ListUnreadMessageCounts(userID string) ([]models.ChatUnreadCounter, error) {
	rows, err := nr.db.Query(`
		SELECT actor_id, COUNT(*) AS unread_count
		FROM notification
		WHERE user_id = ?
		  AND type = 'message'
		  AND is_read = 0
		  AND actor_id IS NOT NULL
		  AND actor_id != ''
		GROUP BY actor_id
		ORDER BY MAX(created_at) DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var counters []models.ChatUnreadCounter
	for rows.Next() {
		var item models.ChatUnreadCounter
		if err := rows.Scan(&item.ActorID, &item.UnreadCount); err != nil {
			return nil, err
		}
		counters = append(counters, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return counters, nil
}

func (nr *NotificationRepository) MarkMessageThreadRead(userID, actorID string) error {
	_, err := nr.db.Exec(`
		UPDATE notification
		SET is_read = 1
		WHERE user_id = ?
		  AND type = 'message'
		  AND actor_id = ?
	`, userID, actorID)
	return err
}

func (nr *NotificationRepository) ListUnreadGroupMessageCounts(userID string) ([]models.GroupUnreadCounter, error) {
	rows, err := nr.db.Query(`
		SELECT entity_id, COUNT(*) AS unread_count
		FROM notification
		WHERE user_id = ?
		  AND type = 'group_message'
		  AND is_read = 0
		  AND entity_id IS NOT NULL
		  AND entity_id != ''
		GROUP BY entity_id
		ORDER BY MAX(created_at) DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var counters []models.GroupUnreadCounter
	for rows.Next() {
		var item models.GroupUnreadCounter
		if err := rows.Scan(&item.GroupID, &item.UnreadCount); err != nil {
			return nil, err
		}
		counters = append(counters, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return counters, nil
}

func (nr *NotificationRepository) MarkGroupThreadRead(userID, groupID string) error {
	_, err := nr.db.Exec(`
		UPDATE notification
		SET is_read = 1
		WHERE user_id = ?
		  AND type = 'group_message'
		  AND entity_id = ?
	`, userID, groupID)
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

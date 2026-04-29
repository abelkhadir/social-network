package groupsrepos

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"social/internal/models"
)

type MessageRepository struct {
	db *sql.DB
}

func NewMessageRepository(db *sql.DB) *MessageRepository {
	return &MessageRepository{
		db: db,
	}
}

func (r *MessageRepository) GetInfoGroupeRepo(GrpID string, sessionID int) (*models.Group, error) {
	query := `SELECT 
				g.id, 
				g.title, 
				COUNT(gr.member_id) AS count_members,
				(
					SELECT GROUP_CONCAT(CAST(gm.member_id AS TEXT), ',')
					FROM group_members gm
					WHERE gm.group_id = $1
				) AS members
			FROM groups g 
			INNER JOIN group_members gr ON g.id = gr.group_id
			WHERE gr.group_id = $1
			GROUP BY g.id, g.title;

	`
	var groupInfo models.Group
	var ids sql.NullString
	err := r.db.QueryRow(query, GrpID).Scan(&groupInfo.ID, &groupInfo.Title, &groupInfo.Count_Members, &ids)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if ids.Valid {
		groupInfo.Members = strings.Split(ids.String, ",")
	} else {
		groupInfo.Members = []string{}
	}
	return &groupInfo, nil
}

func (r *GroupRepository) GetGroupMessagesRepo(GrpID string) ([]models.GroupMessages, error) {
	query := `
			SELECT 
				g.id, 
				g.sender_id, 
				g.group_id, 
				g.content,
				g.sent_at,
				u.avatarURL, 
				u.firstname || ' ' || u.lastname AS fullName
				
			FROM 
			group_messages g
			INNER JOIN user u ON u.id = g.sender_id
			WHERE g.group_id = ?
			ORDER BY g.sent_at ASC;
		
			`
	fmt.Println("the query is correct", query)
	rows, err := r.db.Query(query, GrpID)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	defer rows.Close()
	var messges []models.GroupMessages
	for rows.Next() {
		var messge models.GroupMessages
		var sentAt time.Time
		rows.Scan(&messge.ID, &messge.SenderID, &messge.GroupID, &messge.Message, &sentAt, &messge.Avatar, &messge.FullName)
		messge.SentAt = sentAt.Format(time.DateTime)
		messges = append(messges, messge)
	}
	return messges, nil
}

func (mr *GroupRepository) SaveMessagesGrpRepo(groupID, senderID, message string) (string, error) {
	query := `INSERT INTO group_messages(sender_id, group_id, content) VALUES (?, ?, ?) RETURNING id`
	var idMsg string

	err := mr.db.QueryRow(query, senderID, groupID, message).Scan(&idMsg)
	if err != nil {
		return "", err
	}

	return idMsg, nil
}

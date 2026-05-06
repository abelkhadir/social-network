package groupsrepos

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"social/internal/models"

	"github.com/google/uuid"
)

type GroupRepository struct {
	db *sql.DB
}

func NewGroupRepo(db *sql.DB) *GroupRepository {
	return &GroupRepository{db: db}
}

func (r *GroupRepository) SaveGroup(group *models.Group) (string, *models.GroupError) {
	id := uuid.New().String()

	query := `
		INSERT INTO groups(id, user_id, title, description, created_at)
		VALUES (?, ?, ?, ?, ?)
	`

	_, err := r.db.Exec(query,
		id,
		group.UserID,
		group.Title,
		group.Description,
		time.Now(),
	)
	if err != nil {
		return "", &models.GroupError{
			Message: err.Error(),
			Code:    http.StatusInternalServerError,
		}
	}
	queryGroupMember := `
		INSERT INTO group_members(group_id, member_id) VALUES (?, ?)
	`

	_, err = r.db.Exec(queryGroupMember, id, group.UserID)
	if err != nil {
		return "", &models.GroupError{
			Message: err.Error(),
			Code:    http.StatusInternalServerError,
		}
	}

	return id, nil
}

func (r *GroupRepository) GetJoinedGroups(userID string) ([]*models.Group, error) {
	query := `
		SELECT g.id, g.user_id, g.title, g.description, g.created_at
		FROM groups g
		INNER JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.member_id = ?
		ORDER BY g.created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []*models.Group
	for rows.Next() {
		var group models.Group
		if err := rows.Scan(&group.ID, &group.UserID, &group.Title, &group.Description, &group.CreatedAt); err != nil {
			return nil, err
		}
		groups = append(groups, &group)
	}
	return groups, rows.Err()
}

func (r *GroupRepository) GetSuggestedGroups(userID string) ([]*models.Group, error) {
	query := `
		SELECT g.id, g.user_id, g.title, g.description, g.created_at,
			COALESCE(gr.id, 0) AS request_id
		FROM groups g
		LEFT JOIN group_requests gr ON gr.group_id = g.id AND gr.sender_id = ?
		WHERE g.id NOT IN (
			SELECT group_id FROM group_members WHERE member_id = ?
		)
		ORDER BY g.created_at DESC
	`

	rows, err := r.db.Query(query, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []*models.Group
	for rows.Next() {
		var group models.Group
		if err := rows.Scan(&group.ID, &group.UserID, &group.Title, &group.Description, &group.CreatedAt, &group.RequestID); err != nil {
			return nil, err
		}
		groups = append(groups, &group)
	}
	return groups, rows.Err()
}

func (r *GroupRepository) SaveJoinRequest(groupID, senderID string) error {
	_, err := r.db.Exec(
		`INSERT OR IGNORE INTO group_requests(group_id, sender_id) VALUES (?, ?)`,
		groupID, senderID,
	)
	return err
}

func (r *GroupRepository) GetGroupAdmin(groupID string) (string, error) {
	var userID string

	err := r.db.QueryRow(
		`SELECT user_id FROM groups WHERE id = ?`,
		groupID,
	).Scan(&userID)
	if err != nil {
		return "", err
	}

	return userID, nil
}

// save user to groups_members
func (r *GroupRepository) SaveMemberToGroup(groupID, userID string) error {
	_, err := r.db.Exec(
		`INSERT INTO group_members (group_id, member_id) VALUES (?, ?)`,
		groupID, userID,
	)
	return err
}

// remove user form request
func (r *GroupRepository) CancelGroupRequest(groupId, userID string) error {
	query := `
		DELETE FROM group_requests 
		WHERE group_id = ? AND sender_id = ?;
	`

	_, err := r.db.Exec(query, groupId, userID)
	if err != nil {
		return err
	}

	return nil
}

func (r *GroupRepository) GetPendingMembers(groupID string) ([]string, error) {
	rows, err := r.db.Query(
		`SELECT sender_id FROM group_requests WHERE group_id = ?`,
		groupID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userIDs []string

	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			return nil, err
		}
		userIDs = append(userIDs, userID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return userIDs, nil
}

func (r *GroupRepository) GetGroup(groupID, userID string) (models.GroupIfo, *models.GroupError) {
	_, err := r.IsMember(groupID, userID)
	if err != nil {
		return models.GroupIfo{}, &models.GroupError{
			Message: "Invalid URL",
			Code:    http.StatusNotFound,
		}
	}
	query := `
		SELECT 
			g.id, g.title, g.description, g.created_at,
			u.id, u.nickname, u.firstname, u.lastname, u.avatarURL,
			(
				SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id
			) AS total_members
		FROM groups g
		JOIN user u ON g.user_id = u.id
		WHERE g.id = ?
	`

	groupInfo := models.GroupIfo{}
	var nickname sql.NullString
	//
	err = r.db.QueryRow(query, groupID).Scan(
		&groupInfo.Group.ID,
		&groupInfo.Group.Title,
		&groupInfo.Group.Description,
		&groupInfo.Group.CreatedAt,
		&groupInfo.Author.ID,
		&nickname,
		&groupInfo.Author.Firstname,
		&groupInfo.Author.Lastname,
		&groupInfo.Author.Avatar,
		&groupInfo.TotalMembers,
	)
	if err != nil {
		fmt.Println(err)
		if err == sql.ErrNoRows {
			return models.GroupIfo{}, &models.GroupError{
				Message: "Invalid URL",
				Code:    http.StatusNotFound,
			}
		}
		return models.GroupIfo{}, &models.GroupError{
			Message: "Internal Server Error",
			Code:    http.StatusInternalServerError,
		}
	}
	groupInfo.Author.Nickname = nickname.String

	return groupInfo, nil
}

func (r *GroupRepository) SaveJoinGroupRequest(groupReq *models.GroupRequest) ([]int, error) {
	query := `
		INSERT INTO group_requests (group_id, requested_id, sender_id, type) VALUES (?,?,?,?) RETURNING id
	`

	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}

	stmt, err := tx.Prepare(query)
	if err != nil {
		tx.Rollback()
		return nil, err
	}
	defer stmt.Close()

	ids := []int{}
	for _, requestedID := range groupReq.RequestedID {
		var id int
		err := stmt.QueryRow(groupReq.GroupID, requestedID, groupReq.SenderID, groupReq.Type).Scan(&id)
		if err != nil && err != sql.ErrNoRows {
			tx.Rollback()
			return nil, err
		}

		ids = append(ids, id)
	}

	return ids, tx.Commit()
}

func (r *GroupRepository) GetGroupNotifs(requestedID int) ([]*models.GroupRequest, error) {
	query := `
		select u.id, u.first_name, u.last_name, u.avatar, rq.id,rq.group_id, rq.sender_id, rq.type, g.title from users u 
		inner join group_requests rq ON u.id = rq.sender_id 
		INNER JOIN groups g ON rq.group_id = g.id
		where rq.requested_id = ?
		ORDER BY rq.id DESC;
	`

	rows, err := r.db.Query(query, requestedID)
	if err != nil {
		return nil, err
	}

	var groupNotifs []*models.GroupRequest
	for rows.Next() {
		var groupNotif models.GroupRequest
		var user models.User
		var group models.Group
		err = rows.Scan(&user.ID, &user.Lastname,
			&user.Avatar, &groupNotif.ID, &groupNotif.GroupID, &groupNotif.SenderID, &groupNotif.Type, &group.Title)
		if err != nil {
			return nil, err
		}

		groupNotif.UserInfos = &user
		groupNotif.GroupInfos = &group

		groupNotifs = append(groupNotifs, &groupNotif)
	}

	return groupNotifs, nil
}

func (r *GroupRepository) IsMember(GrpID string, sessionID string) (bool, error) {
	var exists bool
	fmt.Println(sessionID)

	fmt.Println(GrpID)

	query := `
		SELECT EXISTS(
			SELECT 1
			FROM group_members
			WHERE group_id = ? AND member_id = ?
		);
	`

	err := r.db.QueryRow(query, GrpID, sessionID).Scan(&exists)
	if err != nil {
		return exists, err
	}

	//if !exists {
	//	fmt.Println(exists)
	//	return exists, errors.New("Want to join? Send a request to the admin!")
	//}

	return exists, nil
}

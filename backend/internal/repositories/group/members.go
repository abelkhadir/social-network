package groupsrepos

import (
	"database/sql"
	"net/http"

	"social/internal/models"
)

func (r *GroupRepository) GetGroupMembers(groupID string) (*models.GroupMembers, models.GroupError) {
	query := `
	SELECT 
	gm.member_id,
	u.id, 
	u.firstname, 
	u.lastname,
	avatarURL
	,u.nickname  
	 FROM group_members AS gm LEFT JOIN user AS u ON u.id = gm.member_id 
	WHERE gm.group_id= ? ;
	`

	rows, err := r.db.Query(query, groupID)
	if err != nil {
		return nil, models.GroupError{
			Code:    http.StatusInternalServerError,
			Message: "Internal server errror",
		}
	}
	defer rows.Close()

	members := &models.GroupMembers{Members: []models.User{}}

	for rows.Next() {
		var member models.User
		var nickname sql.NullString
		var avatar sql.NullString

		err := rows.Scan(
			&member.ID,
			&member.ID,
			&member.Firstname,
			&member.Lastname,
			&avatar,
			&nickname,
		)
		if err != nil {
			return nil, models.GroupError{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
			}
		}

		if nickname.Valid {
			member.Nickname = nickname.String
		}
		if avatar.Valid {
			member.AvatarURL = avatar.String
		}

		members.Members = append(members.Members, member)
	}
	return members, models.GroupError{
		Code:    http.StatusOK,
		Message: "succefully fetchd members",
	}
}

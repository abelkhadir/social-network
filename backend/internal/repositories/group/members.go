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
		// var ugroup, userid string
		var nickname sql.NullString
		var avatar sql.NullString

		err := rows.Scan(
			&member.ID,
			&member.ID,
			&nickname,
			&member.Firstname,
			&avatar,
			&member.Lastname,
			// &groupID,
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
			member.Avatar = avatar.String
		}
		members.Members = append(members.Members, member)
	}
	// fmt.Println("--------------------------------------------")
	// fmt.Println("------------thaat is memebrs from db ", members)
	// fmt.Println("--------------------------------------------")
	return members, models.GroupError{
		Code:    http.StatusOK,
		Message: "succefully fetchd members",
	}
}

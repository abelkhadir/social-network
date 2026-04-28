package profilerepo

import (
	"database/sql"
	"fmt"
	"net/http"

	"social/internal/models"
)

func (r *ProfileRepository) GetUserFollowersrepo(userID string) (*models.Followers, models.FollowerError) {
	query := `
	SELECT 
    u.id,
    u.firstname,
    u.lastname,
    u.nickname,
    u.avatarURL
	FROM followers f
	JOIN user u ON u.id = f.follower_id
	WHERE f.following_id = ?
	AND f.status = 'DSD';
	`
	rows, err := r.db.Query(query, userID)	
	if err != nil {
		return nil, models.FollowerError{
			Code:    http.StatusInternalServerError,
			Message: "Internal server errror",
		}
	}
	defer rows.Close()
					fmt.Println("the rowwwwwwwwws",rows.Next())

	followers := &models.Followers{Followers: []models.User{}}

	for rows.Next() {
		var member models.User
		var nickname sql.NullString
		var avatar sql.NullString

		err := rows.Scan(
			&member.ID,
			&member.Firstname,
			&member.Lastname,
			&nickname,
			&avatar,
		)
		if err != nil {
					fmt.Println("there is an errrorrr",err)

			return nil, models.FollowerError{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
			}
		}
		
		fmt.Println("there is an errrorrr",member.Firstname)
		if nickname.Valid {
			member.Nickname = nickname.String
		}

		if avatar.Valid {
			member.Avatar = avatar.String
		}

		followers.Followers = append(followers.Followers, member)
	}
	fmt.Println("the folllowwwwwwwwwwwwwwwws ",followers)
	return followers, models.FollowerError{
		Code:    http.StatusOK,
		Message: "succefully fetchd members",
	}
}

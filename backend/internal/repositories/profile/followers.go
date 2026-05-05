package profile

import (
	"database/sql"
	"fmt"
	"net/http"

	"social/internal/models"
)

func (r *ProfileRepository) GetUserFollowersRepo(action string, userID string) (*models.Followers, models.FollowerError) {
	var err error
	var query string
	var rows *sql.Rows
	var flag bool
	switch action {

	case "followers":
		query = `
		SELECT 
			u.id,
			u.firstname,
			u.lastname,
			u.nickname,
			u.avatarURL
		FROM followers f
		JOIN user u ON u.id = f.follower_id
		WHERE f.following_id = ?
		AND f.status = 'accepted';
		`

	case "following":
		query = `
		SELECT 
			u.id,
			u.firstname,
			u.lastname,
			u.nickname,
			u.avatarURL
		FROM followers f
		JOIN user u ON u.id = f.following_id
		WHERE f.follower_id = ?
		AND f.status = 'accepted';
		`
		case "discover":
	query = `
	SELECT 
		u.id,
		u.firstname,
		u.lastname,
		u.nickname,
		u.avatarURL
	FROM user u
	WHERE u.id != ?
	AND u.id NOT IN (
		SELECT following_id 
		FROM followers 
		WHERE follower_id = ? 
		AND status = 'accepted'

		UNION

		SELECT follower_id 
		FROM followers 
		WHERE following_id = ? 
		AND status = 'accepted'
	);
	`
	rows, err = r.db.Query(query, userID,userID,userID)
	if err != nil {
			fmt.Println("1",err)

		return nil, models.FollowerError{
			Code:    http.StatusInternalServerError,
			Message: "Internal server error",
		}
	}
	defer rows.Close()

	flag=true
	default:
		return nil, models.FollowerError{
			Code:    http.StatusBadRequest,
			Message: "Invalid action (must be followers or following)",
		}
	}

if !flag{
	rows, err = r.db.Query(query, userID)
	if err != nil {
			fmt.Println("1",err)

		return nil, models.FollowerError{
			Code:    http.StatusInternalServerError,
			Message: "Internal server error",
		}
	}
	defer rows.Close()

}

	result := &models.Followers{
		Followers: []models.User{},
	}

	for rows.Next() {

		var user models.User
		var nickname sql.NullString
		var avatar sql.NullString

		err := rows.Scan(
			&user.ID,
			&user.Firstname,
			&user.Lastname,
			&nickname,
			&avatar,
		)

		if err != nil {
			fmt.Println("2")
			return nil, models.FollowerError{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
			}
		}

		// nickname safe
		if nickname.Valid {
			user.Nickname = nickname.String
		}

		// avatar safe
		if avatar.Valid {
			user.Avatar = avatar.String
		}

		result.Followers = append(result.Followers, user)
	}
	return result, models.FollowerError{
		Code:    http.StatusOK,
		Message: "successfully fetched users",
	}
}

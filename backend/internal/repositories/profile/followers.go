package profile

import (
	"database/sql"
	"net/http"

	"social/internal/models"
)

func (r *ProfileRepository) GetUserFollowersRepo(action string, userID string) (*models.Followers, models.FollowerError) {

	var query string

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

	default:
		return nil, models.FollowerError{
			Code:    http.StatusBadRequest,
			Message: "Invalid action (must be followers or following)",
		}
	}

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, models.FollowerError{
			Code:    http.StatusInternalServerError,
			Message: "Internal server error",
		}
	}
	defer rows.Close()

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

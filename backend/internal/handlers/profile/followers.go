package profile

import (
	"database/sql"
	"net/http"

	"social/internal/models"
)

func (r *ProfileRepository) GetUserFollowers(action string, userID string) (*models.Followers, models.FollowerError) {

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
			Message: "invalid action",
		}
	}

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, models.FollowerError{
			Code:    http.StatusInternalServerError,
			Message: "db error",
		}
	}
	defer rows.Close()

	result := &models.Followers{
		Followers: []models.User{},
	}

	for rows.Next() {

		var u models.User
		var nickname sql.NullString
		var avatar sql.NullString

		if err := rows.Scan(
			&u.ID,
			&u.Firstname,
			&u.Lastname,
			&nickname,
			&avatar,
		); err != nil {

			return nil, models.FollowerError{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
			}
		}

		if nickname.Valid {
			u.Nickname = nickname.String
		}

		if avatar.Valid {
			u.Avatar = avatar.String
		}

		result.Followers = append(result.Followers, u)
	}

	return result, models.FollowerError{
		Code:    http.StatusOK,
		Message: "success",
	}
}
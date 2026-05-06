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
	u.avatarURL,
	u.is_private,

	CASE 
		WHEN f1.status = 'accepted' AND f2.status = 'accepted' THEN 'mutual'
		WHEN f1.status = 'accepted' THEN 'following'
		WHEN f1.status = 'pending' THEN 'requested'
		WHEN f2.status = 'accepted' THEN 'follower'
		ELSE 'none'
	END AS relationship

FROM user u

-- You → them
LEFT JOIN followers f1 
	ON f1.following_id = u.id 
	AND f1.follower_id = ?

-- Them → you
LEFT JOIN followers f2 
	ON f2.follower_id = u.id 
	AND f2.following_id = ?

WHERE u.id != ?;
	`
		rows, err = r.db.Query(query, userID, userID, userID)
		if err != nil {
			fmt.Println("1", err)

			return nil, models.FollowerError{
				Code:    http.StatusInternalServerError,
				Message: "Internal server error",
			}
		}
		defer rows.Close()

		flag = true
	default:
		fmt.Println("saaaaaaaaaaaaaa march m3leeeeeeeeeeem")
		return nil, models.FollowerError{
			Code:    http.StatusBadRequest,
			Message: "Invalid action (must be followers or following ,discover)",
		}
	}

	if !flag {
		rows, err = r.db.Query(query, userID)
		if err != nil {
			fmt.Println("1", err)

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
		var err error
		if action == "discover"{
			err = rows.Scan(
			&user.ID,
			&user.Firstname,
			&user.Lastname,
			&nickname,
			&avatar,
			&user.IsPrivate,
			&user.Relationship,
		)
		}else{
			err = rows.Scan(
			&user.ID,
			&user.Firstname,
			&user.Lastname,
			&nickname,
			&avatar,
		)
		}
		
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
	// fmt.Println("*****************************************",result.Followers)
	return result, models.FollowerError{
		Code:    http.StatusOK,
		Message: "successfully fetched users",
	}
}

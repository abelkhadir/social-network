<<<<<<< HEAD
package profile

import (
	"database/sql"
=======
package profilerepo

import (
	"database/sql"
	"fmt"
>>>>>>> 8d06227bb4e592b4936f6b26a8d92cd8af73a3e0
	"net/http"

	"social/internal/models"
)

<<<<<<< HEAD
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
=======
func (r *ProfileRepository) GetUserFollowersrepo(action string , userID string) (*models.Followers, models.FollowerError) {
	var query string
	fmt.Println("action---------------------------------------------------",action)
	switch action{
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
	AND f.status = 'DSD';
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
	WHERE f.followers_id = ?
	AND f.status = 'DSD';`
	}
	
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
>>>>>>> 8d06227bb4e592b4936f6b26a8d92cd8af73a3e0
		var nickname sql.NullString
		var avatar sql.NullString

		err := rows.Scan(
<<<<<<< HEAD
			&user.ID,
			&user.Firstname,
			&user.Lastname,
			&nickname,
			&avatar,
		)

		if err != nil {
=======
			&member.ID,
			&member.Firstname,
			&member.Lastname,
			&nickname,
			&avatar,
		)
		if err != nil {
					fmt.Println("there is an errrorrr",err)

>>>>>>> 8d06227bb4e592b4936f6b26a8d92cd8af73a3e0
			return nil, models.FollowerError{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
			}
		}
<<<<<<< HEAD

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
=======
		
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
>>>>>>> 8d06227bb4e592b4936f6b26a8d92cd8af73a3e0
	}
}

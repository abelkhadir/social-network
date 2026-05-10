package profile

import (
	"database/sql"

	"social/internal/models"
	"social/pkg/utils"
)

type ProfileRepository struct {
	db *sql.DB
}

func NewProfileRepository(db *sql.DB) *ProfileRepository {
	return &ProfileRepository{db: db}
}

func (repo *ProfileRepository) GetProfile(viewerID, profileID string) (*models.CommunInfoProfile, error) {
	var user models.User
	var isPrivate int

	query := `SELECT id, nickname, firstname, lastname, age, gender, email, avatarURL,
		COALESCE(about_me, ''), COALESCE(is_private, 0)
		FROM user WHERE id = ?`

	err := repo.db.QueryRow(query, profileID).Scan(
		&user.ID,
		&user.Nickname,
		&user.Firstname,
		&user.Lastname,
		&user.Age,
		&user.Gender,
		&user.Email,
		&user.AvatarURL,
		&user.AboutMe,
		&isPrivate,
	)
	if err != nil {
		return nil, err
	}

	isMyAccount := viewerID == profileID

	profile := &models.CommunInfoProfile{
		User:      user,
		IsPrivate: isPrivate == 1,
		MyAccount: isMyAccount,
	}

	if err := repo.db.QueryRow(`
		SELECT COUNT(*) FROM post p
		WHERE p.authorID = ?
		AND (
			p.Privecytype = 'public'
			OR p.authorID = ?
			OR (
				p.Privecytype = 'almost_private'
				AND EXISTS (
					SELECT 1 FROM followers f
					WHERE f.following_id = p.authorID AND f.follower_id = ? AND f.status = 'accepted'
				)
			)
			OR (
				p.Privecytype = 'private'
				AND EXISTS (
					SELECT 1 FROM post_shared_users pau
					WHERE pau.post_id = p.id AND pau.user_id = ?
				)
			)
		)`, profileID, viewerID, viewerID, viewerID,
	).Scan(&profile.PostsCount); err != nil {
		return nil, err
	}

	if profile.IsPrivate && !isMyAccount {
		profile.User.Email = ""
		profile.User.Age = 0
		profile.User.Gender = ""
		profile.User.AboutMe = ""
		return profile, nil
	}

	posts, err := repo.listProfilePosts(viewerID, profileID)
	if err != nil {
		return nil, err
	}
	profile.Posts = posts

	return profile, nil
}

func (repo *ProfileRepository) GetProfilePosts(viewerID, authorID string) ([]models.ProfilePost, error) {
	return repo.listProfilePosts(viewerID, authorID)
}

func (repo *ProfileRepository) UpdateProfile(userID, nickname, aboutMe, avatarURL string, isPrivate int) error {
	_, err := repo.db.Exec(
		`UPDATE user SET nickname = ?, about_me = ?, avatarURL = ?, is_private = ? WHERE id = ?`,
		nickname, aboutMe, avatarURL, isPrivate, userID,
	)
	return err
}

func (repo *ProfileRepository) listProfilePosts(viewerID, authorID string) ([]models.ProfilePost, error) {
	rows, err := repo.db.Query(`
		SELECT p.id, p.title, p.description, p.createDate, COALESCE(p.Image, ''),
			(SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 1) AS likes,
			(SELECT COUNT(*) FROM comment WHERE postID = p.id) AS comments
		FROM post p
		WHERE p.authorID = ?
		AND (
			p.Privecytype = 'public'
			OR p.authorID = ?
			OR (
				p.Privecytype = 'almost_private'
				AND EXISTS (
					SELECT 1 FROM followers f
					WHERE f.following_id = p.authorID AND f.follower_id = ? AND f.status = 'accepted'
				)
			)
			OR (
				p.Privecytype = 'private'
				AND EXISTS (
					SELECT 1 FROM post_shared_users pau
					WHERE pau.post_id = p.id AND pau.user_id = ?
				)
			)
		)
		ORDER BY p.createDate DESC`,
		authorID, viewerID, viewerID, viewerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.ProfilePost
	for rows.Next() {
		var post models.ProfilePost
		var createDate string
		var image string

		if err := rows.Scan(
			&post.ID,
			&post.Title,
			&post.Content,
			&createDate,
			&image,
			&post.Likes,
			&post.Comments,
		); err != nil {
			return nil, err
		}

		post.Date = utils.FormatDateDB(createDate)
		if image != "" {
			post.Image = "/uploads/images/" + image
		}
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

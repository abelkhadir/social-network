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
	user.Avatar = user.AvatarURL

	profile := &models.CommunInfoProfile{
		User:      user,
		IsPrivate: isPrivate == 1,
		MyAccount: viewerID == profileID,
	}

	if err := repo.db.QueryRow("SELECT COUNT(*) FROM post WHERE authorID = ?", profileID).Scan(&profile.PostsCount); err != nil {
		return nil, err
	}

	if profile.IsPrivate && !profile.MyAccount {
		profile.User.Email = ""
		profile.User.Age = 0
		profile.User.Gender = ""
		profile.User.AboutMe = ""
		return profile, nil
	}

	posts, err := repo.listProfilePosts(profileID)
	if err != nil {
		return nil, err
	}
	profile.Posts = posts

	return profile, nil
}

func (repo *ProfileRepository) UpdateProfile(userID, nickname, aboutMe, avatarURL string, isPrivate int) error {
	_, err := repo.db.Exec(`UPDATE user SET nickname = ?, about_me = ?, avatarURL = ?, is_private = ? WHERE id = ?`,
		nickname,
		aboutMe,
		avatarURL,
		isPrivate,
		userID,
	)
	return err
}

func (repo *ProfileRepository) listProfilePosts(userID string) ([]models.ProfilePost, error) {
	rows, err := repo.db.Query(`
		SELECT p.id, p.title, p.description, p.createDate, COALESCE(p.imageURL, ''),
			(SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 1) AS likes,
			(SELECT COUNT(*) FROM comment WHERE postID = p.id) AS comments
		FROM post p
		WHERE p.authorID = ?
		ORDER BY p.createDate DESC`, userID)
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

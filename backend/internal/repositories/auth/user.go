package auth

import (
	"database/sql"
	"fmt"
	"log"
	"social/internal/models"
	"social/pkg/utils"
	"strings"

	"github.com/gofrs/uuid"
)

var DEFAULT_AVATAR = "/uploads/avatar.1.jpeg"

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{
		db: db,
	}
}

// Create a new user in the database
func (ur *UserRepository) CreateUser(user *models.User) error {
	ID, err := uuid.NewV4()
	if err != nil {
		log.Printf("❌ Failed to generate UUID: %v", err)
	}
	user.ID = ID.String()
	user.Email = strings.ToLower(user.Email)
	user.Nickname = strings.ToLower(user.Nickname)
	if user.AvatarURL == "" {
		user.AvatarURL = DEFAULT_AVATAR
	}
	_, err = ur.db.Exec("INSERT INTO user (id, nickname, firstname, lastname, age, gender, email, password, avatarURL, about_me, is_private) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		user.ID,
		user.Nickname,
		user.Firstname,
		user.Lastname,
		user.Age,
		user.Gender,
		user.Email,
		user.Password,
		user.AvatarURL,
		user.AboutMe,
		user.IsPrivate,
	)
	return err
}

// Get a user by ID from the database
func (ur *UserRepository) GetUserByID(userID string) (*models.User, error) {
	var user models.User
	row := ur.db.QueryRow("SELECT id, nickname, firstname, lastname, age, gender, email, avatarURL, COALESCE(about_me, ''), COALESCE(is_private, 0) FROM user WHERE id = ?", userID)
	err := row.Scan(&user.ID, &user.Nickname, &user.Firstname, &user.Lastname, &user.Age, &user.Gender, &user.Email, &user.AvatarURL, &user.AboutMe, &user.IsPrivate)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // User not found
		}
		return nil, err
	}
	user.Avatar = user.AvatarURL
	return &user, nil
}

// Get a user by email from the database
func (ur *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	row := ur.db.QueryRow("SELECT id, nickname, firstname, lastname, age, gender, email, avatarURL, COALESCE(about_me, ''), COALESCE(is_private, 0) FROM user WHERE email = ?", email)
	err := row.Scan(&user.ID, &user.Nickname, &user.Firstname, &user.Lastname, &user.Age, &user.Gender, &user.Email, &user.AvatarURL, &user.AboutMe, &user.IsPrivate)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // User not found
		}
		return nil, err
	}
	user.Avatar = user.AvatarURL
	return &user, nil
}

// Get a user by email from the database
func (ur *UserRepository) GetUserByNickname(nickname string) (*models.User, error) {
	fmt.Printf("get user by neckname")
	var user models.User
	row := ur.db.QueryRow("SELECT id, nickname, firstname, lastname, age, gender, email, avatarURL, COALESCE(about_me, ''), COALESCE(is_private, 0) FROM user WHERE nickname = ?", nickname)
	err := row.Scan(&user.ID, &user.Nickname, &user.Firstname, &user.Lastname, &user.Age, &user.Gender, &user.Email, &user.AvatarURL, &user.AboutMe, &user.IsPrivate)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // User not found
		}
		return nil, err
	}
	user.Avatar = user.AvatarURL
	return &user, nil
}

// Select All users
func (ur *UserRepository) SelectAllUsers(userID string) ([]models.UserItem, error) {
	var users []models.UserItem
	rows, err := ur.db.Query(`
	SELECT
		u.ID,
		u.nickname,
		COALESCE(u.avatarURL, '') AS avatar_url,
		COALESCE(m.content, '') AS last_message,
		COALESCE(m.createDate, '') AS last_message_time
	FROM user u
	LEFT JOIN (
		SELECT
			CASE
				WHEN senderID = ? THEN receiverID
				WHEN receiverID = ? THEN senderID
			END AS otherUserID,
			MAX(createDate) AS maxCreateDate
		FROM message
		WHERE senderID = ? OR receiverID = ?
		GROUP BY otherUserID
	) latestMessages ON u.ID = latestMessages.otherUserID
	LEFT JOIN message m ON (latestMessages.otherUserID = m.senderID OR latestMessages.otherUserID = m.receiverID) AND latestMessages.maxCreateDate = m.createDate
	WHERE u.ID != ?
	ORDER BY last_message_time DESC, u.nickname 
	`, userID, userID, userID, userID, userID)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var ID, nickname, avatarURL, lastMessage, lastMessageTime string

		err = rows.Scan(&ID, &nickname, &avatarURL, &lastMessage, &lastMessageTime)
		if err != nil {
			log.Fatal(err)
		}

		user := models.UserItem{
			ID:              ID,
			Nickname:        nickname,
			AvatarURL:       avatarURL,
			LastMessage:     lastMessage,
			LastMessageTime: lastMessageTime,
		}

		if user.LastMessageTime != "" {
			user.LastMessageTime = utils.FormatDateDB(user.LastMessageTime)
		}

		users = append(users, user)
	}
	return users, nil
}

func (ur *UserRepository) ListUsersExcept(userID string) ([]models.User, error) {
	var users []models.User
	rows, err := ur.db.Query("SELECT id, nickname, avatarURL FROM user WHERE id != ? ORDER BY nickname", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.ID, &user.Nickname, &user.AvatarURL); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

// Select All users
func (ur *UserRepository) SelectAllUsersOfPost(postID string) ([]models.User, error) {
	var user []models.User
	row, err := ur.db.Query("SELECT u.id AS user_id, u.avatarURL AS user_avatar, u.nickname FROM \"comment\" c INNER JOIN \"user\" u ON c.authorID = u.id WHERE c.postID = ?;", postID)
	if err != nil {
		log.Fatal(err)
	}
	for row.Next() {
		var ID string
		var AvatarUrl string
		var nickname string

		err = row.Scan(&ID, &AvatarUrl, &nickname)

		if err != nil {
			log.Fatal(err)
		}

		var tab = models.User{
			ID:        ID,
			AvatarURL: AvatarUrl,
			Nickname:  nickname,
		}

		user = append(user, tab)
	}
	return user, nil
}

// Check if user exists
func (ur *UserRepository) IsExistedByIdentifiant(identifiant string) (*models.User, bool) {
	var user models.User
	identifiant = strings.ToLower(identifiant)
	// fmt.Println("the indentifiant",identifiant)
	row := ur.db.QueryRow("SELECT id, nickname, firstname, lastname, age, gender, email, avatarURL, COALESCE(about_me, ''), COALESCE(is_private, 0), password FROM user WHERE nickname = ? OR email = ?", identifiant, identifiant)
	// fmt.Print("the row where user ",row)
	err := row.Scan(&user.ID, &user.Nickname, &user.Firstname, &user.Lastname, &user.Age, &user.Gender, &user.Email, &user.AvatarURL, &user.AboutMe, &user.IsPrivate, &user.Password)
	fmt.Println("the user nickname", user)
	if err != nil {
		log.Println("❌ ", err)
		if err == sql.ErrNoRows {
			return nil, false
		}
		return nil, false
	}
	user.Avatar = user.AvatarURL
	return &user, true
}

// Check if user exists
func (ur *UserRepository) IsExistedByID(ID string) (*models.User, bool) {
	var user models.User
	row := ur.db.QueryRow("SELECT id FROM user WHERE id = ?", ID)
	err := row.Scan(&user.ID)
	if err != nil {
		log.Println("❌ ", err)
		if err == sql.ErrNoRows {
			return nil, false
		}
		return nil, false
	}
	return &user, true
}

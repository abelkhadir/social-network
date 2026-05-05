package post

import (
	"database/sql"
	"fmt"

	"social/internal/models"
	"social/pkg/utils"

	_ "github.com/mattn/go-sqlite3"
)

type CommentRepository struct {
	db *sql.DB
}

func NewCommentRepository(db *sql.DB) *CommentRepository {
	return &CommentRepository{
		db: db,
	}
}

// Create a new comment in the database
func (cr *CommentRepository) CreateComment(comment *models.Comment, img *models.Image) (*models.Comment, error) {
	var fullPath string
	if img != nil {
		fileName, err := utils.HandleImage(img, "uploads/groupimages")
		if err != nil {
			// return models.Post{}, models.GroupError{Code: 500, Message: "Image upload failed"}
		}
		fullPath = "uploads/groupimages/" + fileName.String // assuming string
	}
	_, err := cr.db.Exec("INSERT INTO comment (id, text, authorID, postID, image) VALUES (?, ?, ?, ?, ?)",
		comment.ID, comment.Text, comment.AuthorID, comment.PostID, fullPath)
	if err != nil {
		return nil, err
	}
	// fmt.Println("-----------")
	// fmt.Println("the comment infoo",comment.AuthorID)
	// fmt.Println("the comment infoo",comment.ID)
	// fmt.Println("the comment infoo",comment.Image)
	// fmt.Println("the comment infoo",comment.PostID)
	// fmt.Println("the comment infoo",comment.Text)
	// fmt.Println("-----------")

	return comment, err
}

// Get a comment by ID from the database
func (cr *CommentRepository) GetCommentByID(id string) (models.CommentItem, error) {
	var comment models.CommentItem
	fmt.Println("el 9aaaamar zaaarna ")
	row := cr.db.QueryRow(`
		SELECT 
			c.id, c.text, c.authorID, c.createDate, u.nickname, u.avatarURL,
			(SELECT COUNT(*) FROM comment_vote WHERE comment_id = c.id AND vote = 1) AS likes,
			(SELECT COUNT(*) FROM comment_vote WHERE comment_id = c.id AND vote = 0) AS dislikes
		FROM comment c 
		LEFT JOIN user u ON c.authorID = u.id 
		WHERE c.id = ?`, id)
	err := row.Scan(&comment.ID,
		&comment.Text,
		&comment.AuthorID,
		&comment.LastCreateDate,
		&comment.AuthorName,
		&comment.AuthorAvatar,
		&comment.Likes,
		&comment.Dislikes)
	if err != nil {
		return comment, err
	}
	comment.LastCreateDate = utils.FormatDateDB(comment.LastCreateDate)

	return comment, nil
}

func (cr *CommentRepository) GetCommentsOfPost(postID string) ([]*models.CommentItem, error) {
	var comments []*models.CommentItem
	rows, err := cr.db.Query(`
		SELECT 
			c.id, c.text, c.authorID, c.createDate, c.image, u.nickname, u.avatarURL,
			(SELECT COUNT(*) FROM comment_vote WHERE comment_id = c.id AND vote = 1) AS likes,
			(SELECT COUNT(*) FROM comment_vote WHERE comment_id = c.id AND vote = 0) AS dislikes
		FROM comment c 
		LEFT JOIN user u ON c.authorID = u.id 
		WHERE c.PostID = ? 
		ORDER BY createDate DESC`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var comment models.CommentItem
		err := rows.Scan(&comment.ID, &comment.Text, &comment.AuthorID, &comment.LastCreateDate, &comment.Image, &comment.AuthorName, &comment.AuthorAvatar, &comment.Likes, &comment.Dislikes)
		if err != nil {
			return nil, err
		}
		comments = append(comments, &comment)
		// fmt.Println("maaar3aaftch ", err)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return comments, nil
}

// RateComment adds, updates, or removes a user's vote on a comment
func (cr *CommentRepository) RateComment(commentID string, userID string, vote int) error {
	var existingVote int

	err := cr.db.QueryRow("SELECT vote FROM comment_vote WHERE comment_id = ? AND user_id = ?", commentID, userID).Scan(&existingVote)
	if err == sql.ErrNoRows {
		_, err = cr.db.Exec("INSERT INTO comment_vote (comment_id, user_id, vote) VALUES (?, ?, ?)", commentID, userID, vote)
		return err
	} else if err != nil {
		return err
	}

	if existingVote == vote {
		_, err = cr.db.Exec("DELETE FROM comment_vote WHERE comment_id = ? AND user_id = ?", commentID, userID)
		return err
	}

	_, err = cr.db.Exec("UPDATE comment_vote SET vote = ? WHERE comment_id = ? AND user_id = ?", vote, commentID, userID)
	return err
}

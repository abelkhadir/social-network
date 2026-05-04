package groupsrepos

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"social/internal/models"
	"social/pkg/utils"
	"strings"
	"time"

	"github.com/gofrs/uuid"
)

func (s *GroupRepository) SaveGroupeComment(comments models.Comment, img *models.Image) (*models.Comment, error) {
	// Validate text or image
	// fmt.Println("bghaaaa save ")

	if (len(strings.Fields(comments.Text)) == 0 || len(strings.Fields(comments.Text)) > 500) && (img == nil || img.ImgHeader == nil) {
		return nil, errors.New("Comment must be between 1 and 500 words or an image must be provided")
	}
	fmt.Println("bghaaaa save ", comments.Author.ID)

	if comments.PostID == "" || comments.AuthorID == "" {
		// fmt.Println("tbaaaaarkllaaah ")
		return nil, errors.New(("Invalid PostID or Author ID."))

	}

	// Check image ()
	// 	// if img != nil {
	// 	ImgErr := utils.CheckImage(img)
	// 	if ImgErr.Code != http.StatusOK {
	// 		return nil, ImgErr
	// 	}
	// }
	savedComment, err := s.AddGroupComment(comments, img)

	// هذا هو المنطق الصحيح
	if err != nil {
		return nil, errors.New(err.Error())
	}
	return savedComment,nil
}
func (r *GroupRepository) AddGroupComment(comments models.Comment, img *models.Image) (*models.Comment, error) {
	var fullPath string
	if img != nil {
		fileName, err := utils.HandleImage(img, "uploads/groupimages")
		if err != nil {
			// return models.Post{}, models.GroupError{Code: 500, Message: "Image upload failed"}
		}
		fullPath = "uploads/groupimages/" + fileName.String // assuming string
	}
	ID, err := uuid.NewV4()
	if err != nil {
		log.Printf("❌ Failed to generate UUID: %v", err)
	}
	query := `
	INSERT INTO group_comments (id, group_post_id, member_id, content, image, created_at)
	VAlUES (?, ?, ?, ?, ?, ?)`

	stmt, err := r.db.Prepare(query)
	if err != nil {
		return &comments, errors.New(err.Error())
	}
	defer stmt.Close()

	_, err = stmt.Exec(ID, comments.PostID, comments.AuthorID, comments.Text, fullPath, time.Now())
	if err != nil {
		return &comments, errors.New(err.Error())
	}
	// fmt.Println("haaada raah zmeeel ")
	comments.ID = string(ID.String())
	fmt.Println("ajiii yaaa",comments.AuthorID)
	fmt.Println("ajiii yaaa",comments.CreateDate)
	fmt.Println("ajiii yaaa",comments.ID)
	fmt.Println("ajiii yaaa",comments.Text)
	fmt.Println("ajiii yaaa",comments.PostID)

	return &comments, nil
}

func (r *GroupRepository) GetGRouupComment(post_id int) ([]models.Comment, models.GroupError) {
	query := `
  SELECT 
	c.group_post_id, 
	c.member_id, 
	c.content, 
	c.image, 
	c.created_at,
	u.firstname,
	u.lastname,
	u.nickname,
	u.avatar
FROM group_comments c
JOIN user u ON u.id = c.member_id
WHERE c.group_post_id = ?
ORDER BY c.created_at DESC;

	`
	rows, rowsErr := r.db.Query(query, post_id)
	if rowsErr != nil {
		return []models.Comment{}, models.GroupError{
			Code:    http.StatusInternalServerError,
			Message: rowsErr.Error(),
		}
	}
	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		if err := rows.Scan(
			&comment.PostID,
			&comment.Author.ID,
			&comment.Text,
			&comment.CreateDate,
			&comment.Author.Firstname,
			&comment.Author.Lastname,
			&comment.Author.Nickname,
			&comment.Author.Avatar,
		); err != nil {
			return []models.Comment{}, models.GroupError{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
			}
		}
		comments = append(comments, comment)
	}

	return comments, models.GroupError{
		Code:    200,
		Message: "Getting the comments went smouthly",
	}
}

func (r *GroupRepository) GetGroupPostComments(postID string) ([]*models.CommentItem, error) {
	rows, err := r.db.Query(`
		SELECT
			c.id,
			c.content,
			c.member_id,
			c.created_at,
			u.nickname,
			COALESCE(u.avatarURL, ''),
			(SELECT COUNT(*) FROM comment_vote WHERE comment_id = c.id AND vote = 1),
			(SELECT COUNT(*) FROM comment_vote WHERE comment_id = c.id AND vote = 0)
		FROM group_comments c
		JOIN user u ON u.id = c.member_id
		WHERE c.group_post_id = ?
		ORDER BY c.created_at DESC
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*models.CommentItem
	for rows.Next() {
		var c models.CommentItem
		if err := rows.Scan(&c.ID, &c.Text, &c.AuthorID, &c.LastCreateDate, &c.AuthorName, &c.AuthorAvatar, &c.Likes, &c.Dislikes); err != nil {
			return nil, err
		}
		comments = append(comments, &c)
	}
	return comments, rows.Err()
}

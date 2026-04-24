package groupsrepos

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	"social/internal/models"
	"social/pkg/utils"

	"github.com/google/uuid"
)

func (r *GroupRepository) SaveGroupPostRepo(ctx context.Context, group *models.GroupPost, img *models.Image) (models.Post, models.GroupError) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return models.Post{}, models.GroupError{Code: 500, Message: "Database error"}
	}
	defer tx.Rollback()

	fileName, err := utils.HandleImage(img, "uploads/grouupimages")
	if err != nil {
		return models.Post{}, models.GroupError{Code: 500, Message: "Image upload failed"}
	}

	postID := uuid.New().String()
	userID := group.Post.AuthorID

	fmt.Printf("INSERTING: GroupID=%s, MemberID=%s\n", group.GroupId, userID)

	const insertQuery = `
		INSERT INTO group_posts (id, group_id, member_id, title, content, media, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	_, err = tx.Exec(insertQuery,
		postID,
		group.GroupId,
		userID,
		group.Post.Title,
		group.Post.Description,
		fileName,
		time.Now(),
	)
	if err != nil {
		fmt.Println("inserttt faaild :", err)
		return models.Post{}, models.GroupError{Code: 500, Message: "Constraint failed: Check if Group/User exists"}
	}
	var id, nickname, first, last string
	err = tx.QueryRow(
		`SELECT id, nickname, firstname, lastname FROM user WHERE id = ?`,
		userID,
	).Scan(&id, &nickname, &first, &last)
	if err != nil {
		fmt.Println("USER QUERY FAILED:", err)
		return models.Post{}, models.GroupError{Code: 500, Message: "User not found"}
	}

	if err := tx.Commit(); err != nil {
		return models.Post{}, models.GroupError{Code: 500, Message: "Transaction commit failed"}
	}

	return models.Post{
		ID: postID,
		Author: models.User{
			ID:        id,
			Nickname:  nickname,
			Firstname: first,
			Lastname:  last,
		},
		MediaLink:   fileName.String,
		Title:       group.Post.Title,
		Description: group.Post.Description,
		CreateDate:  time.Now().Format(time.RFC3339),
	}, models.GroupError{Code: 200, Message: "Success"}
}

func (r *GroupRepository) SaveGroupePost(ctx context.Context, group *models.GroupPost, img *models.Image) (models.Post, models.GroupError) {
	if strings.TrimSpace(group.Post.Title) == "" {
		return models.Post{}, models.GroupError{Code: 400, Message: "Title is required"}
	}
	if strings.TrimSpace(group.Post.Description) == "" {
		return models.Post{}, models.GroupError{Code: 400, Message: "Content is required"}
	}
	// paaasit liha dakxi howaa haadaaak
	return r.SaveGroupPostRepo(ctx, group, img)
}

func (r *GroupRepository) GetGroupPosts(reg models.PaginationRequest, groupid string) ([]models.Post, models.GroupError) {
	fmt.Println("dkhaalt njiiib posts min database  🃏🃏🃏🃏🃏")

	GetQuery := `
	SELECT 
		p.id,
		p.member_id,
		p.title,
		p.content,
		p.media,
		p.comments,
		p.created_at,
		u.firstname,
		u.lastname,
		u.nickname
	FROM group_posts p
	INNER JOIN user u ON p.member_id = u.id 
	WHERE p.group_id = ?
	ORDER BY p.created_at DESC
	LIMIT ? OFFSET ?
`

	rows, rowsErr := r.db.Query(GetQuery, groupid, reg.Limit, reg.Offset)
	// fmt.Println("check wisdfndskfn 🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏 ",rows)

	if rowsErr != nil {
		fmt.Println("Database error:", rowsErr)
		if rowsErr == sql.ErrNoRows {
			return []models.Post{}, models.GroupError{
				Code:    http.StatusNotFound,
				Message: rowsErr.Error(),
			}
		}

		return []models.Post{}, models.GroupError{
			Code:    http.StatusInternalServerError,
			Message: rowsErr.Error(),
		}
	}
	var (
		posts []models.Post
		media sql.NullString
	)

	for rows.Next() {
		var post models.Post
		if err := rows.Scan(

			&post.ID,
			&post.Author.ID,
			&post.Title,
			&post.Description,
			&media,
			&post.TotalComments,
			&post.CreateDate,
			&post.Author.Firstname,
			&post.Author.Lastname,
			&post.Author.Nickname,
		); err != nil {
			fmt.Println("dbbbb errrr 🃏🃏🃏🃏", err)
			fmt.Println("the imaage", post.MediaLink)
			return []models.Post{}, models.GroupError{
				Code:    http.StatusInternalServerError,
				Message: err.Error(),
			}
		}
		if media.Valid {
			post.MediaLink = media.String
		}
		posts = append(posts, post)

	}

	return posts, models.GroupError{
		Code:    http.StatusOK,
		Message: "Posts fetched successfully",
	}
}

func (r *GroupRepository) AddGroupComment(comments models.Comment, img *models.Image) (*models.Comment, models.GroupError) {
	query := `
	INSERT INTO group_comments (group_post_id , member_id, content, media, created_at)
	VAlUES (?, ?, ?, ?, ?)

	`
	fileName, ImageErr := utils.HandleImage(img, "pkg/db/images/comments")
	if ImageErr != nil {
		fmt.Println("i know what is the errror ")
		return nil, models.GroupError{
			Code:    http.StatusInternalServerError,
			Message: ImageErr.Error(),
		}
	}
	stmt, err := r.db.Prepare(query)
	if err != nil {
		return nil, models.GroupError{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}
	}
	defer stmt.Close()

	_, err = stmt.Exec(comments.PostID, comments.Author.ID, comments.Text, fileName, time.Now())
	if err != nil {
		return nil, models.GroupError{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}
	}
	return &models.Comment{
			MediaLink: fileName.String,
		}, models.GroupError{
			Code:    http.StatusOK,
			Message: "adding comment went smouthly ",
		}
}

func (r *GroupRepository) GetGRoupComment(post_id int) ([]models.Comment, models.GroupError) {
	query := `
  SELECT 
	c.group_post_id, 
	c.member_id, 
	c.content, 
	c.media, 
	c.created_at,
	u.first_name,
	u.last_name,
	u.nickname,
	u.avatar
FROM group_comments c
JOIN users u ON u.id = c.member_id
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
	var (
		comments []models.Comment
		media    sql.NullString
	)
	for rows.Next() {
		var comment models.Comment
		if err := rows.Scan(
			&comment.PostID,
			&comment.Author.ID,

			&comment.Text,
			&media,

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
		if media.Valid {
			comment.MediaLink = media.String
		}
		comments = append(comments, comment)
	}

	return comments, models.GroupError{
		Code:    200,
		Message: "Getting the comments went smouthly",
	}
}

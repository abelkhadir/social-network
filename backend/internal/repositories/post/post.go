package post

import (
	"database/sql"
	"fmt"
	"log"
	"strings"

	"social/internal/models"
	"social/pkg/utils"

	"github.com/gofrs/uuid"
)

type PostRepository struct {
	db *sql.DB
}

func NewPostRepository(db *sql.DB) *PostRepository {
	return &PostRepository{
		db: db,
	}
}

// Create a new post in the database
func (pr *PostRepository) CreatePost(post *models.PostCreation) error {
	ID, err := uuid.NewV4()
	if err != nil {
		log.Printf("Failed to generate UUID: %v", err)
	}
	tx, err := pr.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	// fmt.Println("baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaakhchaa")
	// if len(post.AllowedUsres)>0{
	// _, err = pr.db.Exec("INSERT INTO post () VALUES (?)",
	// 	post.ID, post.Title, post.Description, post.AuthorID, post.Image)
	// }
	post.ID = ID.String()
	_, err = pr.db.Exec("INSERT INTO post (id, title, description, authorID, Image, Privecytype) VALUES (?,?, ?, ?, ?, ?)",
		post.ID, post.Title, post.Description, post.AuthorID, post.Image, post.Privecytype)
	if err != nil {
		fmt.Println("asdbfdsjfbsjdfbsjd", err)
		return err
	}
	if post.Privecytype == "private" && len(post.AllowedUsres) > 0 {
		const insertAllowedUsers = `
            INSERT INTO post_shared_users (post_id, user_id) VALUES (?, ?)
        `
		stmt, err2 := tx.Prepare(insertAllowedUsers)
		// fmt.Println("theeeee ", err2)
		if err2 != nil {
			return fmt.Errorf("prepare audience stmt: %w", err2)
		}
		defer stmt.Close()

		for _, useriddd := range post.AllowedUsres {
			if _, err2 = stmt.Exec(post.ID, useriddd); err2 != nil {
				return fmt.Errorf("insert user in private post  (%d): %w", useriddd, err2)
			}
		}
		fmt.Println("kolxxxi normaaaal daaaba")
	}
	return tx.Commit()
}

// Get a post by ID from the database
func (pr *PostRepository) GetPostByID(postID, viewerID string) (*models.CompletePost, error) {
	var post models.CompletePost
	row := pr.db.QueryRow(`
  SELECT
    p.id,
    p.title,
    p.description,
    p.authorID,
    u.nickname,
    COALESCE(u.avatarURL, ''),
    p.createDate,
    COALESCE(p.Image, ''),
    (SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 1) AS likes,
    (SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 0) AS dislikes
FROM post p
JOIN user u ON u.id = p.authorID
WHERE p.id = ?
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
)`, postID, viewerID, viewerID, viewerID)
	err := row.Scan(
		&post.ID,
		&post.Title,
		&post.Description,
		&post.AuthorID,
		&post.AuthorName,
		&post.AuthorAvatar,
		&post.CreateDate,
		&post.Image,
		&post.Likes,
		&post.Dislikes,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, err // Post not found
		}
		return nil, err
	}
	if post.Image != "" {
		post.Image = "/uploads/images/" + post.Image
	}
	return &post, nil
}

func (pr *PostRepository) GetUserOwnPosts(userId, nickName string) ([]models.PostItem, error) {
	var posts []*models.Post
	var numberComments []int

	rows, err := pr.db.Query(`
	SELECT p.id AS id, title, description, p.authorID AS authorID, p.createDate AS createDate, COUNT(*) AS numberComment FROM post p
	LEFT JOIN comment c ON c.postID = p.ID
	WHERE p.authorID = ? 
	GROUP BY p.ID ;
	`, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post models.Post
		var nbComment int
		err := rows.Scan(&post.ID, &post.Title, &post.Description, &post.AuthorID, &post.CreateDate, &nbComment)
		if err != nil {
			return nil, err
		}
		posts = append(posts, &post)
		numberComments = append(numberComments, nbComment)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	tabPostItem := []models.PostItem{}

	for i := 0; i < len(posts); i++ {
		lastModificationDate := strings.ReplaceAll(posts[i].CreateDate, "T", " ")
		lastModificationDate = strings.ReplaceAll(lastModificationDate, "Z", "")
		postItem := models.PostItem{
			ID:               posts[i].ID,
			Title:            posts[i].Title,
			AuthorName:       nickName,
			CreateDate:       utils.FormatDateDB(lastModificationDate),
			NumberOfComments: numberComments[i],
		}
		tabPostItem = append(tabPostItem, postItem)

	}

	return tabPostItem, nil
}

func (pr *PostRepository) GetAllPosts(userID string) ([]*models.Post, error) {
	var postItems []*models.Post

	request := `
		SELECT 
			p.id,
			p.title,
			u.nickname AS authorName,
			p.createDate AS lastEditionDate,
			COUNT(DISTINCT cm.id) AS numberOfComments,
			COALESCE(p.Image, '') AS image,
			(SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 1) AS likes,
			(SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 0) AS dislikes,
			MAX(pv.vote) AS vote_status
		FROM post p
		JOIN user u ON p.authorID = u.id
		LEFT JOIN comment cm ON p.id = cm.postID
		LEFT JOIN post_vote pv ON pv.post_id = p.id AND pv.user_id = ?

		WHERE 
			p.Privecytype = 'public'

			OR p.authorID = ?

			OR (
				p.Privecytype = 'almost_private'
				AND EXISTS (
					SELECT 1 FROM followers f
					WHERE f.following_id = p.authorID
					AND f.follower_id = ?
				)
			)

			OR (
				p.Privecytype = 'private'
				AND EXISTS (
					SELECT 1 FROM post_shared_users pau
					WHERE pau.post_id = p.id 
					AND pau.user_id = ?
				)
			)

		GROUP BY p.id
		ORDER BY p.createDate DESC
	`

	rows, err := pr.db.Query(request,
		userID,
		userID,
		userID,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post models.Post
		var voteStatus sql.NullInt64

		err := rows.Scan(
			&post.ID,
			&post.Title,
			&post.AuthorName,
			&post.CreateDate,
			&post.TotalComments,
			&post.Image,
			&post.Likes,
			&post.Dislikes,
			&voteStatus,
		)
		if err != nil {
			return nil, err
		}

		post.CreateDate = utils.FormatDateDB(post.CreateDate)

		if voteStatus.Valid {
			v := int(voteStatus.Int64)
			post.VoteStatus = &v
		} else {
			post.VoteStatus = nil
		}

		if post.Image != "" {
			post.Image = "/uploads/images/" + post.Image
		}

		postItems = append(postItems, &post)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return postItems, nil
}


func (pr *PostRepository) GetPostItemByID(postID string) (models.PostItem, error) {
	request := `
		SELECT 
			p.id, p.title,
			u.nickname AS authorName,
			p.createDate AS lastEditionDate,
			COUNT(DISTINCT cm.id) AS numberOfComments,
			COALESCE(p.Image, '')
		FROM post p
		JOIN user u ON p.authorID = u.id
		LEFT JOIN "comment" cm ON p.id = cm.postID
		WHERE p.id = ?
		GROUP BY p.id
		ORDER BY p.createDate DESC
	`
	row := pr.db.QueryRow(request, postID)
	// fmt.Println("i don't knooow ")

	var post models.PostItem
	err := row.Scan(
		&post.ID,
		&post.Title,
		&post.AuthorName,
		&post.CreateDate,
		&post.NumberOfComments,
		&post.Image,
	)
	if err != nil {
		return post, err
	}

	post.CreateDate = utils.FormatDateDB(post.CreateDate)
	if post.Image != "" {
		post.Image = post.Image
	}

	return post, nil
}

// Get the number of posts in the database
func (pr *PostRepository) GetNumberOfPosts() int {
	var numberOfPosts int

	row := pr.db.QueryRow("SELECT COUNT(*) FROM post")
	err := row.Scan(&numberOfPosts)
	if err != nil {
		return 0
	}
	return numberOfPosts
}

// RatePost adds, updates, or removes a user's vote on a post
func (pr *PostRepository) RatePost(postID string, userID string, vote int) error {
	var existingVote int

	err := pr.db.QueryRow("SELECT vote FROM post_vote WHERE post_id = ? AND user_id = ?", postID, userID).Scan(&existingVote)

	if err == sql.ErrNoRows {
		_, err = pr.db.Exec("INSERT INTO post_vote (post_id, user_id, vote) VALUES (?, ?, ?)", postID, userID, vote)
		return err
	} else if err != nil {
		return err // Database error
	}

	// If the user clicks the SAME button, remove the vote (Unlike / Undislike)
	if existingVote == vote {
		_, err = pr.db.Exec("DELETE FROM post_vote WHERE post_id = ? AND user_id = ?", postID, userID)
		return err
	}

	//  If they clicked a different button, UPDATE the vote (Change Like to Dislike)
	_, err = pr.db.Exec("UPDATE post_vote SET vote = ? WHERE post_id = ? AND user_id = ?", vote, postID, userID)
	return err
}

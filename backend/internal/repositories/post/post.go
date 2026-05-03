package post

import (
	"database/sql"
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
		log.Printf("❌ Failed to generate UUID: %v", err)
	}
	post.ID = ID.String()
	_, err = pr.db.Exec("INSERT INTO post (id, title, description, authorID, Image) VALUES (?, ?, ?, ?, ?)",
		post.ID, post.Title, post.Description, post.AuthorID, post.Image)
	return err
}

// Get a post by ID from the database
func (pr *PostRepository) GetPostByID(postID string) (*models.CompletePost, error) {
	var post models.CompletePost
	row := pr.db.QueryRow(`
  SELECT 
    p.id, 
    p.title, 
    p.description,
    p.authorID,
    p.createDate,
    COALESCE(p.Image, ''),
    (SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 1) AS likes,
    (SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 0) AS dislikes
FROM post p
WHERE p.id = ?`, postID)
	err := row.Scan(
		&post.ID,
		&post.Title,
		&post.Description,
		&post.AuthorID,
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

func (pr *PostRepository) GetAllPosts(userID string) ([]*models.PostItem, error) {
	var postItems []*models.PostItem
	request := `
		SELECT 
			p.id, p.title,
			u.nickname AS authorName,
			p.createDate AS lastEditionDate,
			COUNT(DISTINCT cm.id) AS numberOfComments,
			COALESCE(p.Image, ''),
			(SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 1) AS likes,
			(SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 0) AS dislikes,
			pv.vote AS vote_status
		FROM post p
		JOIN user u ON p.authorID = u.id
		LEFT JOIN "comment" cm ON p.id = cm.postID
		LEFT JOIN post_vote pv ON pv.post_id = p.id AND pv.user_id = ?
		GROUP BY p.id
		ORDER BY p.createDate DESC
	`
	rows, err := pr.db.Query(request, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post models.PostItem
		var voteStatus sql.NullInt64
		err := rows.Scan(
			&post.ID,
			&post.Title,
			&post.AuthorName,
			&post.CreateDate,
			&post.NumberOfComments,
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

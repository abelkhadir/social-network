package post

import (
	"database/sql"
	"log"
	"social/internal/models"
	"social/pkg/utils"
	"strings"

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
	_, err = pr.db.Exec("INSERT INTO post (id, title, description, authorID, imageURL) VALUES (?, ?, ?, ?, ?)",
		post.ID, post.Title, post.Description, post.AuthorID, post.ImageURL)
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
    COALESCE(p.imageURL, ''),
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
		&post.ImageURL,
		&post.Likes,
		&post.Dislikes,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, err // Post not found
		}
		return nil, err
	}
	if post.ImageURL != "" {
		post.ImageURL = "/uploads/images/" + post.ImageURL
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
			ListOfCategories: []string{},
		}
		tabPostItem = append(tabPostItem, postItem)

	}

	return tabPostItem, nil
}

// Get all posts as PostItems with author name and category names
func (pr *PostRepository) GetAllPosts(userID string) ([]*models.PostItem, error) {
	var postItems []*models.PostItem
	request := `
		SELECT 
			p.id, p.title,
			u.nickname AS authorName,
			p.createDate AS lastEditionDate,
			COUNT(DISTINCT cm.id) AS numberOfComments,
			COALESCE(GROUP_CONCAT(c.name, ', '), '') AS listOfCategories,
			COALESCE(p.imageURL, ''),
			(SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 1) AS likes,
			(SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 0) AS dislikes,
			pv.vote AS vote_status
		FROM post p
		JOIN user u ON p.authorID = u.id
		LEFT JOIN "comment" cm ON p.id = cm.postID
		LEFT JOIN post_category pc ON p.id = pc.post_id
		LEFT JOIN category c ON pc.category_id = c.id
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
		ListOfCategories := ""
		var voteStatus sql.NullInt64
		err := rows.Scan(
			&post.ID,
			&post.Title,
			&post.AuthorName,
			&post.CreateDate,
			&post.NumberOfComments,
			&ListOfCategories,
			&post.ImageURL,
			&post.Likes,
			&post.Dislikes,
			&voteStatus,
		)
		if err != nil {
			return nil, err
		}

		post.CreateDate = utils.FormatDateDB(post.CreateDate)
		if ListOfCategories == "" {
			post.ListOfCategories = []string{}
		} else {
			post.ListOfCategories = strings.Split(ListOfCategories, ", ")
		}
		if voteStatus.Valid {
			v := int(voteStatus.Int64)
			post.VoteStatus = &v
		} else {
			post.VoteStatus = nil
		}
		if post.ImageURL != "" {
			post.ImageURL = "/uploads/images/" + post.ImageURL
		}
		postItems = append(postItems, &post)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return postItems, nil
}

// Get all posts as PostItems with author name and category names
func (pr *PostRepository) GetPostItemByID(postID string) (models.PostItem, error) {
	request := `
		SELECT 
			p.id, p.title,
			u.nickname AS authorName,
			p.createDate AS lastEditionDate,
			COUNT(DISTINCT cm.id) AS numberOfComments,
			COALESCE(GROUP_CONCAT(c.name, ', '), '') AS listOfCategories,
			COALESCE(p.imageURL, '')
		FROM post p
		JOIN user u ON p.authorID = u.id
		LEFT JOIN "comment" cm ON p.id = cm.postID
		LEFT JOIN post_category pc ON p.id = pc.post_id
		LEFT JOIN category c ON pc.category_id = c.id
		WHERE p.id = ?
		GROUP BY p.id
		ORDER BY p.createDate DESC
	`
	row := pr.db.QueryRow(request, postID)

	var post models.PostItem
	ListOfCategories := ""
	err := row.Scan(
		&post.ID,
		&post.Title,
		&post.AuthorName,
		&post.CreateDate,
		&post.NumberOfComments,
		&ListOfCategories,
		&post.ImageURL,
	)
	if err != nil {
		return post, err
	}

	post.CreateDate = utils.FormatDateDB(post.CreateDate)
	if ListOfCategories == "" {
		post.ListOfCategories = []string{}
	} else {
		post.ListOfCategories = strings.Split(ListOfCategories, ", ")
	}
	if post.ImageURL != "" {
		post.ImageURL = "/uploads/images/" + post.ImageURL
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

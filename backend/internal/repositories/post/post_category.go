package post

import (
	"database/sql"
	"log"
	"social/internal/models"
	"social/pkg/utils"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

type PostCategoryRepository struct {
	db *sql.DB
}

func NewPostCategoryRepository(db *sql.DB) *PostCategoryRepository {
	return &PostCategoryRepository{
		db: db,
	}
}

// Create a new post-category relationship in the database
func (pcr *PostCategoryRepository) CreatePostCategory(categoryID, postID string) error {
	postCategory := models.PostCategory{
		CategoryID: categoryID,
		PostID:     postID,
	}
	_, err := pcr.db.Exec("INSERT INTO post_category (category_id, post_id) VALUES (?, ?)",
		postCategory.CategoryID, postCategory.PostID)
	return err
}

// Get categories of a post from the database
func (pcr *PostCategoryRepository) GetCategoriesOfPost(postID string) ([]models.Category, error) {
	rows, err := pcr.db.Query(`
		SELECT c.id, c.name
		FROM category c
		INNER JOIN post_category pc ON c.id = pc.category_id
		WHERE pc.post_id = ?
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var category models.Category
		err := rows.Scan(&category.ID, &category.Name)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// Get posts of a category from the database
func (pcr *PostCategoryRepository) GetPostsOfCategory(categoryName string) ([]models.PostItem, error) {
	rows, err := pcr.db.Query(`
		SELECT
			p.id,
			p.title,
			u.nickname AS authorName,
			p.createDate,
			COALESCE(cm.comment_count, 0) AS numberOfComments,
			COALESCE(GROUP_CONCAT(c.name, ', '), '') AS listOfCategories,
			COALESCE(p.imageURL, ''),
			(SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 1) AS likes,
			(SELECT COUNT(*) FROM post_vote WHERE post_id = p.id AND vote = 0) AS dislikes
		FROM post p
		JOIN user u ON p.authorID = u.id
		JOIN post_category pc_filter ON p.id = pc_filter.post_id
		JOIN category c_filter ON pc_filter.category_id = c_filter.id AND c_filter.name = ?
		LEFT JOIN post_category pc ON p.id = pc.post_id
		LEFT JOIN category c ON pc.category_id = c.id
		LEFT JOIN (
			SELECT postID, COUNT(*) AS comment_count
			FROM comment
			GROUP BY postID
		) cm ON p.id = cm.postID
		GROUP BY p.id
		ORDER BY p.createDate DESC
	`, categoryName)
	if err != nil {
		log.Println("❌ SQL ERROR ", err.Error())
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostItem
	for rows.Next() {
		listOfCategories := ""
		var post models.PostItem
		err := rows.Scan(
			&post.ID,
			&post.Title,
			&post.AuthorName,
			&post.CreateDate,
			&post.NumberOfComments,
			&listOfCategories,
			&post.ImageURL,
			&post.Likes,
			&post.Dislikes,
		)
		if err != nil {
			log.Println("❌ SQL ERROR ", err.Error())
			return nil, err
		}
		if listOfCategories == "" {
			post.ListOfCategories = []string{}
		} else {
			post.ListOfCategories = strings.Split(listOfCategories, ", ")
		}
		post.CreateDate = utils.FormatDateDB(post.CreateDate)
		if post.ImageURL != "" {
			post.ImageURL = "/uploads/images/" + post.ImageURL
		}
		posts = append(posts, post)
	}

	return posts, nil
}

// Delete a category from the database
func (cr *PostCategoryRepository) DeletePostCategory(categoryID, postID string) error {
	_, err := cr.db.Exec("DELETE FROM post_category WHERE category_id = ? AND post_id = ?", categoryID, postID)
	return err
}

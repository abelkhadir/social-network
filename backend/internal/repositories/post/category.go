package post

import (
	"database/sql"
	"log"
	"social/internal/models"
	"strings"

	uuid "github.com/gofrs/uuid"
	_ "github.com/mattn/go-sqlite3"
)

type CategoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) *CategoryRepository {
	return &CategoryRepository{
		db: db,
	}
}

// Get a category by ID from the database
func (cr *CategoryRepository) GetCategoryByID(categoryID string) (*models.Category, error) {
	var category models.Category
	row := cr.db.QueryRow("SELECT id, name FROM category WHERE id = ?", categoryID)
	err := row.Scan(&category.ID, &category.Name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Category not found
		}
		return nil, err
	}
	return &category, nil
}

// Get a category by ID from the database
func (cr *CategoryRepository) GetCategoryByName(name string) (*models.Category, error) {
	var category models.Category
	row := cr.db.QueryRow("SELECT id, name FROM category WHERE name = ?", name)
	err := row.Scan(&category.ID, &category.Name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Category not found
		}
		return nil, err
	}
	return &category, nil
}

// Create a new category in the database
func (cr *CategoryRepository) CreateCategory(category *models.Category) error {
	ID, err := uuid.NewV4()
	if err != nil {
		log.Printf("❌ Failed to generate UUID: %v", err)
	}
	category.ID = ID.String()
	category.Name = strings.TrimSpace(category.Name)
	_, err = cr.db.Exec("INSERT INTO category (id, name) VALUES (?, ?)", category.ID, category.Name)
	return err
}

// Get all category in the database
func (pr *CategoryRepository) GetAllCategory() ([]*models.Category, error) {
	var categories []*models.Category

	rows, err := pr.db.Query("SELECT id, name FROM category ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var category models.Category
		err := rows.Scan(&category.ID, &category.Name)
		if err != nil {
			return nil, err
		}
		categories = append(categories, &category)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return categories, nil
}

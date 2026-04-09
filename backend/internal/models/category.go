package models
type Category struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
type PostCategory struct {
	ID         string
	CategoryID string
	PostID     string
}
package models

type Comment struct {
	ID         string `json:"id"`
	Text       string `json:"text"`
	AuthorID   string `json:"authorID"`
	PostID     string `json:"postID"`
	CreateDate string `json:"createDate"`
	Author    User   `json:"author"` // or `UserID`
	MediaLink string `json:"media_link,omitempty"`
}

type CommentItem struct {
	ID             string `json:"id"`
	Text           string `json:"text"`
	AuthorID       string `json:"authorID"`
	AuthorName     string `json:"authorName"`
	AuthorAvatar   string `json:"authorAvatar"`
	LastCreateDate string `json:"lastCreateDate"`
	Likes          int    `json:"likes"`
	Dislikes       int    `json:"dislikes"`
}

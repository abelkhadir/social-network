package models

import "mime/multipart"

type PostItem struct {
	ID               string   `json:"id"`
	Title            string   `json:"title"`
	AuthorName       string   `json:"authorName"`
	CreateDate       string   `json:"createDate"`
	NumberOfComments int      `json:"numberOfComments"`
	ListOfCategories []string `json:"listOfCategories"`
	Likes            int      `json:"likes"`
	Dislikes         int      `json:"dislikes"`
	VoteStatus       *int     `json:"vote_status"`
	ImageURL         string   `json:"image"`
}

type CompletePost struct {
	Post
	Comments []*CommentItem
}

type ComentPaginationRequest struct {
	PostId int `json:"post_id"`
	Offset int `json:"offset"` // 0‑based index
	Limit  int `json:"limit"`  // page size
}

type Post struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	AuthorID    string `json:"authorID"`
	CreateDate  string `json:"createDate"`
	Likes       int    `json:"likes"`
	Dislikes    int    `json:"dislikes"`
	VoteStatus  *int   `json:"vote_status"`
	ImageURL    string `json:"image"`
}

type PostCreation struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	AuthorID    string   `json:"authorID"`
	ImageURL    string   `json:"image"`
	Categories  []string `json:"categories"`
	CreateDate  string   `json:"createDate"`
}
type Image struct {
	ImgHeader  *multipart.FileHeader
	ImgContent multipart.File
}

type PaginationRequest struct {
	Offset int `json:"offset"` // 0‑based index
	Limit  int `json:"limit"`  // page size
}

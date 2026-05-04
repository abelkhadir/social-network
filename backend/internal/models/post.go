package models

import "mime/multipart"

type PostItem struct {
	ID               string `json:"id"`
	Title            string `json:"title"`
	AuthorName       string `json:"authorName"`
	CreateDate       string `json:"createDate"`
	NumberOfComments int    `json:"numberOfComments"`
	Likes            int    `json:"likes"`
	Dislikes         int    `json:"dislikes"`
	VoteStatus       *int   `json:"vote_status"`
	Image            string `json:"image"`
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
	ID            string `json:"id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	AuthorID      string `json:"authorID"`
	AuthorName    string `json:"authorName"`
	AuthorAvatar  string `json:"authorAvatar"`
	CreateDate    string `json:"createDate"`
	Likes         int    `json:"likes"`
	Dislikes      int    `json:"dislikes"`
	VoteStatus    *int   `json:"vote_status"`
	Image         string `json:"image"`
	AllowedUsres  []int  `json:"omitempty"` // if the post is private
	Author        User   `json:"author"`
	TotalComments int    `json:"total_comments"`
}

type PostCreation struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	AuthorID    string `json:"authorID"`
	Image       string `json:"image"`
	CreateDate  string `json:"createDate"`
}
type Image struct {
	ImgHeader  *multipart.FileHeader
	ImgContent multipart.File
}

type PaginationRequest struct {
	Offset int `json:"offset"` // 0‑based index
	Limit  int `json:"limit"`  // page size
}

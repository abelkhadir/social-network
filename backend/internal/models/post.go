package models

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

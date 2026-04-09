package models

type CommunInfoProfile struct {
	User       User          `json:"user"`
	IsPrivate  bool          `json:"isPrivate"`
	Followers  int           `json:"followers"`
	Following  int           `json:"following"`
	PostsCount int           `json:"postsCount"`
	MyAccount  bool          `json:"myAccount"`
	Posts      []ProfilePost `json:"posts,omitempty"`
}

type ProfilePost struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Content  string `json:"content"`
	Likes    int    `json:"likes"`
	Comments int    `json:"comments"`
	Date     string `json:"date"`
	Image    string `json:"image,omitempty"`
}

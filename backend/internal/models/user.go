package models

type User struct {
	ID        string `json:"id"`
	Nickname  string `json:"nickname"`
	Firstname string `json:"firstname"`
	Lastname  string `json:"lastname"`
	Age       int    `json:"age"`
	Gender    string `json:"gender"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	AvatarURL string `json:"avatar_url"`
	Avatar    string `json:"avatar,omitempty"`
	AboutMe   string `json:"aboutMe"`
	IsPrivate int    `json:"isPrivate"`
}

type UserSignIn struct {
	Identifiant string
	Password    string
}

type AuthUser struct {
	ID         string `json:"id"`
	Nickname   string `json:"nickname"`
	Username   string `json:"username,omitempty"`
	Firstname  string `json:"firstname"`
	Lastname   string `json:"lastname"`
	Age        int    `json:"age"`
	Gender     string `json:"gender"`
	IsLoggedIn bool   `json:"is_logged_in"`
	Email      string `json:"email"`
	AvatarURL  string `json:"avatar_url"`
	Avatar     string `json:"avatar,omitempty"`
	AboutMe    string `json:"aboutMe,omitempty"`
	IsPrivate  bool   `json:"isPrivate"`
}

type UserItem struct {
	ID              string `json:"id"`
	Nickname        string `json:"nickname"`
	AvatarURL       string `json:"avatar_url"`
	IsConnected     bool   `json:"is_connected"`
	LastMessage     string `json:"last_message"`
	LastMessageTime string `json:"last_message_time"`
}
type UserError struct {
	Nickname    string
	Email       string
	PassWord    string
	FirstName   string
	Lastname    string
	DateofBirth string
	AboutMe     string
	HasErro     bool
}
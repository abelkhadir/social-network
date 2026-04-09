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
}

type UserSignIn struct {
	Identifiant string
	Password    string
}

type AuthUser struct {
	ID         string `json:"id"`
	Nickname   string `json:"nickname"`
	Firstname  string `json:"firstname"`
	Lastname   string `json:"lastname"`
	Age        int    `json:"age"`
	Gender     string `json:"gender"`
	IsLoggedIn bool   `json:"is_logged_in"`
	Email      string `json:"email"`
	AvatarURL  string `json:"avatar_url"`
}

type UserItem struct {
	ID              string `json:"id"`
	Nickname        string `json:"nickname"`
	AvatarURL       string `json:"avatar_url"`
	IsConnected     bool   `json:"is_connected"`
	LastMessage     string `json:"last_message"`
	LastMessageTime string `json:"last_message_time"`
}
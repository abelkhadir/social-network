package models

import "time"
type Following struct {
	UserID     string    `json:"user_id"`
	FollowerID string    `json:"follower_id"`
	Status     string    `json:"status"`
	FollowedAt time.Time `json:"followed_at"`
}
type FollowerError struct {
	Message string
	Code    int
}
type Followers struct {
	Followers []User `json:"followers"`
}

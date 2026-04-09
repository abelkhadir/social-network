package models

import "time"

type Session struct {
	Token    string
	UserID   string
	ExpireAt time.Time
}

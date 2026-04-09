package models

type Notification struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	ActorID    string `json:"actor_id,omitempty"`
	Type       string `json:"type"`
	EntityID   string `json:"entity_id,omitempty"`
	EntityType string `json:"entity_type,omitempty"`
	Content    string `json:"content"`
	IsRead     bool   `json:"is_read"`
	CreatedAt  string `json:"created_at"`
}

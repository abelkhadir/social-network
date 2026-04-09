package models

type NewStatusEvent struct {
	Type   string `json:"type"`
	UserID string `json:"userID"`
	Online bool   `json:"online"`
}

type TypingEvent struct {
	Type     string `json:"type"`
	From     string `json:"from"`
	To       string `json:"to"`
	IsTyping bool   `json:"isTyping"`
}

type NewMessageEvent struct {
	Type    string  `json:"type"`
	Message Message `json:"message"`
}

type NewNotificationEvent struct {
	Type         string       `json:"type"`
	Notification Notification `json:"notification"`
}
type WsInput struct {
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}

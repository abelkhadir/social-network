package models
type Message struct {
	ID         string `json:"id"`
	SenderID   string `json:"senderID"`
	ReceiverID string `json:"receiverID"`
	Text       string `json:"text"`
	CreateDate string `json:"createDate"`
}
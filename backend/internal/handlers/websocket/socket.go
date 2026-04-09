package websockethandler

import (
	"encoding/json"
	"log"
	"net/http"
	"social/internal/models"
	"sync"

	"github.com/gorilla/websocket"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	UserConnections = &sync.Map{}
)

func HandleWebSocket(res http.ResponseWriter, req *http.Request) {
	conn, err := upgrader.Upgrade(res, req, nil)
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}

	UserConnections.Store(conn, "")

	defer func() {
		userID, ok := UserConnections.Load(conn)
		if ok && userID.(string) != "" {
			SendStatus(userID.(string), false)
		}
		UserConnections.Delete(conn)
		conn.Close()
	}()

	for {
		_, incoming, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var data models.WsInput
		if err := json.Unmarshal(incoming, &data); err != nil {
			log.Println("Error unmarshalling message:", err)
			continue
		}

		switch data.Type {
		case "login":
			userID, ok := data.Data["userID"].(string)
			if ok && userID != "" {
				UserConnections.Store(conn, userID)
				SendStatus(userID, true) // Tell everyone else this user is online
				log.Println("User logged into socket:", userID)
			}

		case "logout":
			userID, ok := data.Data["userID"].(string)
			if ok && userID != "" {
				UserConnections.Store(conn, "")
				SendStatus(userID, false)
			}

		case "typing":
			from, _ := data.Data["from"].(string)
			to, _ := data.Data["to"].(string)
			isTyping, _ := data.Data["isTyping"].(bool)
			SendTyping(from, to, isTyping)
		}
	}
}

// SendStatus tells ALL other users that someone came online or went offline
func SendStatus(userID string, online bool) {
	data := models.NewStatusEvent{Type: "status", UserID: userID, Online: online}
	output, _ := json.Marshal(data)

	UserConnections.Range(func(key, value interface{}) bool {
		conn := key.(*websocket.Conn)
		connectedUser := value.(string)

		if connectedUser != "" && connectedUser != userID {
			conn.WriteMessage(websocket.TextMessage, output)
		}
		return true
	})
}

// SendTyping tells ONE specific user that someone is typing to them
func SendTyping(from string, to string, isTyping bool) {
	data := models.TypingEvent{Type: "typing", From: from, To: to, IsTyping: isTyping}
	output, _ := json.Marshal(data)

	UserConnections.Range(func(key, value interface{}) bool {
		conn := key.(*websocket.Conn)
		connectedUser := value.(string)

		if connectedUser == to {
			conn.WriteMessage(websocket.TextMessage, output)
			return false // We found them, no need to keep looping!
		}
		return true
	})
}

// SendMessage sends a new chat message to BOTH the sender and the receiver
// You call this function from your post.go HTTP handler after saving to DB!
func SendMessage(message models.Message) {
	data := models.NewMessageEvent{Type: "message", Message: message}
	output, _ := json.Marshal(data)

	UserConnections.Range(func(key, value interface{}) bool {
		conn := key.(*websocket.Conn)
		connectedUser := value.(string)

		if connectedUser == message.SenderID || connectedUser == message.ReceiverID {
			conn.WriteMessage(websocket.TextMessage, output)

			if message.SenderID == message.ReceiverID {
				return false
			}
		}
		return true
	})
}

// SendNotification sends a notification to a specific user if connected
func SendNotification(notification models.Notification) {
	data := models.NewNotificationEvent{Type: "notification", Notification: notification}
	output, _ := json.Marshal(data)

	UserConnections.Range(func(key, value interface{}) bool {
		conn := key.(*websocket.Conn)
		connectedUser := value.(string)

		if connectedUser == notification.UserID {
			conn.WriteMessage(websocket.TextMessage, output)
		}
		return true
	})
}

// IsUserConnected checks if a user currently has a socket connection
func IsUserConnected(userID string) bool {
	isOnline := false
	UserConnections.Range(func(_, value interface{}) bool {
		connectedUser := value.(string)
		if connectedUser == userID {
			isOnline = true
			return false
		}
		return true
	})
	return isOnline
}

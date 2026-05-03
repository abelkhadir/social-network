package websockethandler

import (
	"errors"

	"social/internal/app"
	"social/internal/models"
)

// PushNotification stores the notification and optionally broadcasts it over websocket.
func PushNotification(application *app.Application, notification *models.Notification, broadcast bool) error {
	if notification == nil {
		return errors.New("notification is nil")
	}

	if err := application.NotificationRepo.Create(notification); err != nil {
		return err
	}

	if broadcast {
		SendNotification(*notification)
	}

	return nil
}

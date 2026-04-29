package utils

import (
	"fmt"
	"net/http"
	"strings"
)

func GetGroupId(r *http.Request, endpoint string) (string, error) {
	path := r.URL.Path
	parts := strings.Split(path, "/")

	if len(parts) < 4 || parts[1] != "groups" || parts[2] != "joined" {
		return "", fmt.Errorf("Invalid URL")
	}
	id := parts[4]
	id = strings.TrimSpace(id)
	return id, nil
}

func GetGroupIdA(r *http.Request, endpoint string) (string, error) {
	path := r.URL.Path
	parts := strings.Split(path, "/")
	id := parts[3]
	id = strings.TrimSpace(id)
	return id, nil
}

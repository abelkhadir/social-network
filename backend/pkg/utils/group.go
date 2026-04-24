package utils

import (
	"fmt"
	"net/http"
	"strings"
)

func GetGroupId(r *http.Request, endpoint string) (string, error) {
	path := r.URL.Path
	fmt.Println("the url ",path)
	parts := strings.Split(path, "/")
	// fmt.Println("the part in 🃏",parts[0])
	// fmt.Println("the part in 🃏🃏",parts[1])
	// fmt.Println("the part in 🃏🃏",parts[2])
	// fmt.Println("the part in 🃏🃏",parts[3])
	// fmt.Println("the part in 🃏🃏",parts[4])

	if len(parts)<4|| parts[1] != "groups" ||parts[2] != "joined" ||parts[3] != "post" {
	fmt.Println("check wisdfndskfn 🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏🃏 ")
		return "", fmt.Errorf("Invalid URL")
	}
	id := parts[4]
	id = strings.TrimSpace(id)
	return id, nil
}

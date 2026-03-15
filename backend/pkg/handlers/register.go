package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"social/pkg/db/queries"
)

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req queries.RegisterRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	err = queries.CreateUser(req)
	if err != nil {
		http.Error(w, "failed to create user", http.StatusInternalServerError)
		return
	}

	fmt.Println("User registered:", req.Email)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "user created"})
}

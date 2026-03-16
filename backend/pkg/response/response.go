package response

import (
	"encoding/json"
	"log"
	"net/http"
)

func Success(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(map[string]string{"message": message}); err != nil {
		log.Printf("failed to encode success response: %v", err)
	}
}

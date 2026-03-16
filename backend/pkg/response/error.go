package response

import (
	"encoding/json"
	"log"
	"net/http"
)

func Error(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(map[string]string{"error": message}); err != nil {
		log.Printf("failed to encode error response: %v", err)
	}
}

func MultiError(w http.ResponseWriter, errs map[string]string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(map[string]map[string]string{"errors": errs}); err != nil {
		log.Printf("failed to encode error response: %v", err)
	}
}

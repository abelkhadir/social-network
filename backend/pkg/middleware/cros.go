package middleware

import "net/http"

func CORSMiddleware(allowedOrigin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
			res.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			res.Header().Set("Access-Control-Allow-Credentials", "true")
			res.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			res.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if req.Method == http.MethodOptions {
				res.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(res, req)
		})
	}
}

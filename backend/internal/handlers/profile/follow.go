package profile

import (
	"encoding/json"
	"fmt"
	"net/http"

	"social/internal/app"
	"social/internal/repositories/profile"
)

type FollowHandler struct {
	repo *profile.ProfileRepository
}

func NewFollowHandler(repo *profile.ProfileRepository) *FollowHandler {
	return &FollowHandler{repo: repo}
}

func (h *FollowHandler) FollowUser(a *app.Application, w http.ResponseWriter, r *http.Request) {
	user, err := a.SessionRepo.GetUserFromSession(r)
	if err != nil{
		fmt.Println("err from follow user handelr:-------------------------",err)
		return 
	}
	followerID := r.URL.Query().Get("followerId")
	fmt.Println("follwerId:",followerID,"followingId:",user.ID)
	err = h.repo.FollowUser(user.ID,followerID)
	fmt.Println(err)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "followed",
	})
}


func (h *FollowHandler) GetContactHandler(application *app.Application, w http.ResponseWriter, r *http.Request) {
	action := r.URL.Query().Get("action")
	user, err := application.SessionRepo.GetUserFromSession(r)
	if err != nil {
		fmt.Println("get user inf err:", err)
		return
		//
	}
	data, errorr := h.repo.GetUserFollowersRepo(action, user.ID)
	if errorr.Code != 200 {
		http.Error(w, errorr.Message, errorr.Code)
		return
	}
	fmt.Println(data, "²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²")
	json.NewEncoder(w).Encode(data)
}

package profile

import (
	"fmt"
	"net/http"

	"social/internal/app"
	"social/pkg/middleware"
	"social/pkg/utils"
)

func GetUserFollowers(app *app.Application, res http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		utils.SendJSONResponse(res, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}

	// groupIDStr, errId := utils.GetGroupId(r, "members")
	userID, ok := req.Context().Value(middleware.UserIDKey).(string)
	fmt.Println("the id in the profile", userID)
	if !ok {
		// fmt.Println("userID not found in context")
		// fmt.Printf("CTX KEY TYPE HANDLER: %T\n",userID)
		utils.SendJSONResponse(res, http.StatusUnauthorized, map[string]any{
			"error": "Unauthorized",
		})
		return
	}

	folowers, err := app.ProfileRepo.GetUserFollowersrepo(userID)
	fmt.Println("--------------------------------------------")
	fmt.Println("the followers from data base", folowers)
	fmt.Println("--------------------------------------------")

	if err.Code != http.StatusOK {
		// 		fmt.Println("--------------------------------------------")
		// fmt.Println("errrrror sdfsdafsdfsdfsdgsdgfdsfg", err)
		// fmt.Println("--------------------------------------------")
		utils.SendJSONResponse(res, err.Code, map[string]any{
			"error": err.Message,
		})
		return
	}
	// fmt.Println("the memberssssssssssssssssss fuck ",Members)
	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"data": folowers,
	})
}

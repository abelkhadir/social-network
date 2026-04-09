package posthandler

import (
	"fmt"
	"net/http"
	"social/internal/app"
	"social/pkg/utils"
)

func GetaAllCategory(application *app.Application, res http.ResponseWriter, req *http.Request) {
	Categories, err := application.CategoryRepo.GetAllCategory()
	if err != nil {
		fmt.Println("the is an error in catygories", err)
	}
	utils.SendJSONResponse(res, http.StatusOK, map[string]any{"message": "Categories retrieved successfully", "Categories": Categories})
	// for _, cat := range Categories {
	// 	fmt.Print("ID:", cat.ID, "catname:", cat.Name)
	// }
	// fmt.Println("Categories",&Categories[0])
}

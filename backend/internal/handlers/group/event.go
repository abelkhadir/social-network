package groupshandler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"social/internal/app"
	"social/internal/models"
	"social/pkg/middleware"
	"social/pkg/utils"
)

func CreateEventHandler(app *app.Application, w http.ResponseWriter, r *http.Request) {
	fmt.Println("---------------------------------------")
	fmt.Println("we talkiiing about greating event now ")
	fmt.Println("---------------------------------------")

	if r.Method != http.MethodPost {
		// utils.ResponseJSON(w, http.StatusMethodNotAllowed, map[string]any{
		// 	"error": "Method not allowed",
		// })
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}

	// 	fmt.Printf("KEY TYPE IN HANDLER: %T\n", middleware.UserIDKey)
	// fmt.Printf("VALUE: %#v\n", r.Context().Value(middleware.UserIDKey))
	var event models.Event
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		fmt.Println("tha event", event)
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
    "error": err.Error(),
		})
		return
	}
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	fmt.Println("===========c23afc9c-af2e-49c5-be57-88576ddada0d===============", userID)
	if !ok {
		fmt.Println("--1112-----------------111-1userID not found in context")
		// fmt.Printf("CTX KEY TYPE HANDLER: %T\n",userID)
		utils.SendJSONResponse(w, http.StatusUnauthorized, map[string]any{
			"error": "Unauthorized",
		})
		return
	}
	fmt.Println("===========c23afc9c-af2e-49c5-be57-88576ddada0d===============")
	fmt.Println("===========c23afc9c-af2e-49c5-be57-88576ddada0d===============")
		event.UserID = userID

	// newevent, err := h.service.SaveEvent(r.Context(), event)
	newevent, err := app.GroupPostRepo.SaveEvent(r.Context(), &event)
	// fmt.Println("---------------------------------------")
	// fmt.Println("the grouuuup was createeeeed  ", newevent)
	// fmt.Println("---------------------------------------")

	if err.Code != http.StatusOK {
		utils.SendJSONResponse(w, err.Code, map[string]any{
			"error": err.Message,
		})
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"message": "Event created succefully!",
		"data":    newevent,
	})
}

func  GetGroupEventsHandler(app *app.Application, w http.ResponseWriter, r *http.Request) {
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	if r.Method != http.MethodGet {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}

	groupIDStr, errId := utils.GetGroupId(r, "events")
	fmt.Println("---------------------------------------",groupIDStr)

	if errId != nil {
		fmt.Println("---------------------------------------")
			fmt.Println("the user group id ",groupIDStr)
		fmt.Println("---------------------------------------")
		utils.SendJSONResponse(w, http.StatusNotFound, map[string]any{
			"error": errors.New(errId.Error()),
		})
		return
	}
	UserID := r.Context().Value(middleware.UserIDKey).(string)
	fmt.Println("---------------------------------------",UserID)
	// fmt.Println("---------------------------------------")
	// fmt.Println("---------------------------------------")
	// fmt.Println("the user group id ",)
	// fmt.Println("the user group id ",UserID)
	// fmt.Println("---------------------------------------")
	// // events, err := h.service.GetGroupEvents(UserID, groupIDStr)
	events, err := app.GroupPostRepo.GetGroupEvents(UserID, groupIDStr)
	fmt.Println("---------------------------------------")
	fmt.Println("eveeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeent",events)
	fmt.Println("---------------------------------------")
	if err.Code != http.StatusOK {
		utils.SendJSONResponse(w, err.Code, map[string]any{
			"error": err.Message,
		})
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"data": events,
	})
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
}

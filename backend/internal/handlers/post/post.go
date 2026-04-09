package posthandler

import (
	"bytes"
	"errors"
	"fmt"
	"html"
	"io"
	"os"
	"path/filepath"
	"social/internal/app"
	"social/internal/models"
	"social/pkg/utils"
	"strings"

	// "errors"

	"net/http"

	uuid "github.com/gofrs/uuid"
)

func CreatePost(application *app.Application, res http.ResponseWriter, req *http.Request) {
	fmt.Println("rah dkhaal daba")

	if utils.ValidateRequest(req, res, "/post", http.MethodPost) {
		isLogin := application.SessionRepo.ValidSession(req)

		if isLogin {
			userInSession, _ := application.SessionRepo.GetUserFromSession(req)
			const maxImageSize = int64(5 << 20)
			req.Body = http.MaxBytesReader(res, req.Body, maxImageSize+(1<<20))
			if err := req.ParseMultipartForm(maxImageSize + (1 << 20)); err != nil {
				utils.HandleError(res, http.StatusBadRequest, "Invalid multipart form: "+err.Error())
				return
			}

			title := strings.TrimSpace(req.FormValue("title"))
			description := strings.TrimSpace(req.FormValue("description"))
			categories := req.MultipartForm.Value["categories"]
			postInfo := models.PostCreation{
				Title:       title,
				Description: description,
				Categories:  categories,
			}

			if err := validatePostInput(&postInfo); err != nil {
				utils.HandleError(res, http.StatusBadRequest, err.Error())
				return
			}

			file, header, err := req.FormFile("image")
			if err != nil {
				utils.HandleError(res, http.StatusBadRequest, "Image is required")
				return
			}
			defer file.Close()

			if header.Size > maxImageSize {
				utils.HandleError(res, http.StatusBadRequest, "Image must be under 5MB")
				return
			}

			headerBytes := make([]byte, 512)
			n, err := file.Read(headerBytes)
			if err != nil && err != io.EOF {
				utils.HandleError(res, http.StatusBadRequest, "Failed to read image")
				return
			}
			mimeType := http.DetectContentType(headerBytes[:n])
			ext := ""
			switch mimeType {
			case "image/jpeg":
				ext = ".jpg"
			case "image/png":
				ext = ".png"
			case "image/gif":
				ext = ".gif"
			default:
				utils.HandleError(res, http.StatusBadRequest, "Invalid image type. Only JPEG, PNG, GIF allowed")
				return
			}

			if err := os.MkdirAll("./uploads/images", 0755); err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Failed to prepare uploads directory")
				return
			}

			imageID, err := uuid.NewV4()
			if err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Failed to generate image id")
				return
			}
			filename := imageID.String() + ext
			dstPath := filepath.Join("./uploads/images", filename)
			dstFile, err := os.Create(dstPath)
			if err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Failed to save image")
				return
			}
			defer dstFile.Close()

			reader := io.MultiReader(bytes.NewReader(headerBytes[:n]), file)
			if _, err := io.Copy(dstFile, reader); err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Failed to write image")
				return
			}

			postInfo.AuthorID = userInSession.ID
			postInfo.ImageURL = filename
			listOfCategories := postInfo.Categories

			if err := application.PostRepo.CreatePost(&postInfo); err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Error creating post : "+err.Error())
				return
			}
			fmt.Println("the list of category", listOfCategories)
			for i := 0; i < len(listOfCategories); i++ {
				name := strings.TrimSpace(listOfCategories[i])
				if name != "" {
					category, _ := application.CategoryRepo.GetCategoryByName(name)
					fmt.Println("the name of cat", category)
					if category == nil {
						category = &models.Category{
							Name: name,
						}
						if err := application.CategoryRepo.CreateCategory(category); err != nil {
							utils.HandleError(res, http.StatusInternalServerError, "Failed to create category")
							return
						}
					}
					if err := application.PostCategoryRepo.CreatePostCategory(category.ID, postInfo.ID); err != nil {
						utils.HandleError(res, http.StatusInternalServerError, "Failed to link category to post")
						return
					}
				}
			}
			// post, err := models.PostRepo.GetPostItemByID(postInfo.ID)
			// if err != nil {
			// 	utils.HandleError(res, http.StatusInternalServerError, "Error getting post : "+err.Error())
			// 	return
			// }
			utils.SendJSONResponse(res, http.StatusOK, map[string]any{
				"message": "post created successfully",
				"post":    "",
			})
			// SendPost(post)
		} else {
			utils.HandleError(res, http.StatusUnauthorized, "not connected")
		}
	}
}

func GetPost(application *app.Application, res http.ResponseWriter, req *http.Request) {
	fmt.Println("rah dkhaal daba")
	if strings.HasSuffix(req.URL.Path, "/like") || strings.HasSuffix(req.URL.Path, "/dislike") {
		RatePostHandler(application, res, req)
		return
	}
	if utils.ValidateRequest(req, res, "/post/*", http.MethodGet) {
		if application.SessionRepo.ValidSession(req) {
			path := req.URL.Path
			pathPart := strings.Split(path, "/")
			postid := pathPart[2]
			// fmt.Println("the post id",postid)
			post, err := application.PostRepo.GetPostByID(postid)
			fmt.Println("there is any likes here,", post.Dislikes)
			fmt.Println("there is any likes here,", post.Dislikes)
			if err != nil {
				utils.HandleError(res, http.StatusInternalServerError, err.Error())
				return
			}
			// fmt.Println("rah jab posts ")
			comments, err := application.CommentRepo.GetCommentsOfPost(post.ID)
			if err != nil {
				utils.HandleError(res, http.StatusInternalServerError, err.Error())
				return
			}

			post.Comments = comments

			utils.SendJSONResponse(res, http.StatusOK, map[string]any{"message": "post retrieved successfully", "post": post})
			fmt.Println("daba eaja3 response hada how post", post)
		} else {
			utils.HandleError(res, http.StatusUnauthorized, "No active session")
		}
	}
}

func GetAllPosts(application *app.Application, res http.ResponseWriter, req *http.Request) {
	fmt.Println("the user need the posts")
	if utils.ValidateRequest(req, res, "/posts", http.MethodGet) {
		if application.SessionRepo.ValidSession(req) {
			userInSession, _ := application.SessionRepo.GetUserFromSession(req)
			posts, err := application.PostRepo.GetAllPosts(userInSession.ID)
			if err != nil {
				utils.HandleError(res, http.StatusInternalServerError, err.Error())
			}

			utils.SendJSONResponse(res, http.StatusOK, map[string]any{"message": "posts retrieved successfully", "posts": posts})
		} else {
			utils.HandleError(res, http.StatusUnauthorized, "No active session")
		}
	}
}

func validatePostInput(post *models.PostCreation) error {
	if post.Title == "" || post.Description == "" || len(post.Categories) == 0 {
		return errors.New("ErrMissingRequiredFields")
	}
	post.Title = html.EscapeString(post.Title)
	post.Description = html.EscapeString(post.Description)
	return nil
}

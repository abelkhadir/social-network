package posthandler

import (
	"bytes"
	"errors"
	"fmt"
	"html"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"social/internal/app"
	"social/internal/models"
	"social/pkg/utils"

	// "errors"

	uuid "github.com/gofrs/uuid"
)

func CreatePost(application *app.Application, res http.ResponseWriter, req *http.Request) {
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
			shared_with := req.FormValue("shared_with")
			fmt.Println("----------------posssssst ----------------")
			fmt.Println("the title is ", title)
			fmt.Println("the shared_with is ", shared_with)
			fmt.Println("the privery", req.FormValue("privacy"))
			fmt.Println("----------------posssssst ----------------")
			description := strings.TrimSpace(req.FormValue("description"))
			postInfo := models.PostCreation{
				Title:       title,
				Description: description,
				Privecytype: req.FormValue("privacy"),
			}
			if postInfo.Privecytype == "private" {
				usersidd := req.Form["shared_with"]
				for _, idddd := range usersidd {
					fmt.Println("the users that the user want to share with them ",idddd)
					postInfo.AllowedUsres=append(postInfo.AllowedUsres, idddd)
				}
			}

			if err := validatePostInput(&postInfo); err != nil {
				utils.HandleError(res, http.StatusBadRequest, err.Error())
				return
			}

			postInfo.AuthorID = userInSession.ID

			file, header, err := req.FormFile("image")
			if err != nil && !errors.Is(err, http.ErrMissingFile) {
				utils.HandleError(res, http.StatusBadRequest, "Invalid image upload")
				return
			}

			if err == nil {
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

				if err := os.MkdirAll("./uploads/images", 0o755); err != nil {
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

				postInfo.Image = filename
			}

			if err := application.PostRepo.CreatePost(&postInfo); err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Error creating post : "+err.Error())
				return
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
			exict, err := application.GroupPostRepo.PostExistsInGroup(postid)
			if exict {
				post, err := application.GroupPostRepo.GetPostdetails(postid)
				if err != nil {
					utils.HandleError(res, http.StatusInternalServerError, err.Error())
					return
				}
				comments, err := application.GroupPostRepo.GetGroupPostComments(post.ID)
				if err != nil {
					utils.HandleError(res, http.StatusInternalServerError, err.Error())
					return
				}

				post.Comments = comments
				utils.SendJSONResponse(res, http.StatusOK, map[string]any{"message": "post retrieved successfully", "post": post})
				return
			}
			post, err := application.PostRepo.GetPostByID(postid)
			if err != nil {
				utils.HandleError(res, http.StatusInternalServerError, err.Error())
				return
			}

			comments, err := application.CommentRepo.GetCommentsOfPost(post.ID)
			if err != nil {
				utils.HandleError(res, http.StatusInternalServerError, err.Error())
				return
			}

			post.Comments = comments

			utils.SendJSONResponse(res, http.StatusOK, map[string]any{"message": "post retrieved successfully", "post": post})
		} else {
			utils.HandleError(res, http.StatusUnauthorized, "No active session")
		}
	}
}

func GetAllPosts(application *app.Application, res http.ResponseWriter, req *http.Request) {
	if utils.ValidateRequest(req, res, "/posts", http.MethodGet) {
		if application.SessionRepo.ValidSession(req) {
			userInSession, _ := application.SessionRepo.GetUserFromSession(req)
			posts, err := application.PostRepo.GetAllPosts(userInSession.ID)
			if err != nil {
				fmt.Println("the problem comes from here",err)
				utils.HandleError(res, http.StatusInternalServerError, err.Error())
				return
			}

			utils.SendJSONResponse(res, http.StatusOK, map[string]any{"message": "posts retrieved successfully", "posts": posts})
		} else {
			utils.HandleError(res, http.StatusUnauthorized, "No active session")
		}
	}
}

func validatePostInput(post *models.PostCreation) error {
	if post.Title == "" || post.Description == "" {
		return errors.New("the title or Description shouldn't be emty ")
	}
	if len(post.Title) >= 500 || len(post.Description) >= 500 {
		return errors.New("you have entere a  long Title or Description ")
	}
	post.Title = html.EscapeString(post.Title)
	post.Description = html.EscapeString(post.Description)
	return nil
}

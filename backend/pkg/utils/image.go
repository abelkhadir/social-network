package utils

import (
	"database/sql"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"social/internal/models"
)

func HandleImage(img *models.Image, dir string) (sql.NullString, error) {
	var fileName sql.NullString

	if img == nil || img.ImgContent == nil || img.ImgHeader == nil {
		return fileName, nil
	}

	if seeker, ok := img.ImgContent.(io.Seeker); ok {
		_, _ = seeker.Seek(0, io.SeekStart)
	}

	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fileName, err
	}

	origName := filepath.Base(time.Now().Format("20060102150405") + "_" + img.ImgHeader.Filename)
	path := filepath.Join(dir, origName)

	dst, err := os.Create(path)
	if err != nil {
		return fileName, err
	}
	defer dst.Close()

	_, err = io.Copy(dst, img.ImgContent)
	if err != nil {
		return fileName, err
	}

	return sql.NullString{String: origName, Valid: true}, nil
}

func CheckImage(img *models.Image) error {
	if img == nil || img.ImgHeader == nil || img.ImgContent == nil {
		return nil
	}

	if len(img.ImgHeader.Filename) < 3 {
		return errors.New("invalid filename")
	}

	buf := make([]byte, 512)
	if _, err := img.ImgContent.Read(buf); err != nil {
		return errors.New("failed to read image")
	}

	if seeker, ok := img.ImgContent.(io.Seeker); ok {
		_, _ = seeker.Seek(0, io.SeekStart)
	}

	allowed := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	if !allowed[http.DetectContentType(buf)] {
		return errors.New("invalid image type")
	}

	return nil
}

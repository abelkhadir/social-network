package config

import (
	"encoding/json"
	"log"
	"os"
)

type Config struct {
	Database       string `json:"database"`
	Port           string `json:"port"`
	FrontendOrigin string `json:"frontend_origin"`
}

func Load(path string) *Config {
	data, err := os.ReadFile(path)
	if err != nil {
		log.Fatal("❌ Cannot read conf.json:", err)
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		log.Fatal("❌ Cannot parse conf.json:", err)
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.FrontendOrigin == "" {
		cfg.FrontendOrigin = "http://localhost:3000"
	}
	if cfg.Database == "" {
		log.Fatal("❌ \"database\" is required in conf.json")
	}
	return &cfg
}

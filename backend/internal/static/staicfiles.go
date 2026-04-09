package static

import "net/http"

func staticfiles() {

	// Static file serving
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("./frontend/js/"))))
	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("./frontend/css/"))))
	http.Handle("/img/", http.StripPrefix("/img/", http.FileServer(http.Dir("./frontend/img/"))))
	http.Handle("/sound/", http.StripPrefix("/sound/", http.FileServer(http.Dir("./frontend/sound/"))))
	http.Handle("/src/", http.StripPrefix("/src/", http.FileServer(http.Dir("./frontend/src/assests"))))
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads/"))))
}

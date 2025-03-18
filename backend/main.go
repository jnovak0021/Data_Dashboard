package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type User struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password,omitempty"`
}

// main function
func main() {
	// Get environment variable access
	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
	}

	//connect to database
	dbURL := os.Getenv("DATABASE_URL")

	fmt.Println("Trying to connect to:", dbURL)
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Connection error:", err)
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		log.Fatal("Ping error:", err)
	} else {
		fmt.Println("Successfully connected to the database")
	}

	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	log.Println("Connected")

	// create table if not exists
	_, err = db.Exec("CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT, email TEXT, password TEXT)")
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Created USERS")

	//create apis table
	_, err = db.Exec("CREATE TABLE IF NOT EXISTS APIs (APIId SERIAL PRIMARY KEY, UserId INT NOT NULL, APIString TEXT, APIKey TEXT, PaneX INT, PaneY INT, CONSTRAINT fk_user FOREIGN KEY (UserId) REFERENCES users(id) ON DELETE CASCADE)")
	if err != nil {
		log.Fatal(err)
	}
	log.Println("APIs")

	//create parameters table if doesnt exist
	_, err = db.Exec("CREATE TABLE IF NOT EXISTS Parameters (ParamId SERIAL PRIMARY KEY, APIId INT NOT NULL, Parameter TEXT, CONSTRAINT fk_api FOREIGN KEY (APIId) REFERENCES APIs(APIId) ON DELETE CASCADE)")
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Created Parameters")

	/*
		CREATE TABLE IF NOT EXISTS users (
		    id SERIAL PRIMARY KEY,
		    name TEXT,
		    email TEXT UNIQUE,
		    password TEXT
		);

		CREATE TABLE IF NOT EXISTS APIs (  -- Renamed table from "API" to "APIs" (Avoids reserved keyword issues)
		    APIId SERIAL PRIMARY KEY,
		    UserId INT NOT NULL,
		    APIString TEXT,
		    APIKey TEXT,
		    PaneX INT,
		    PaneY INT,
		    CONSTRAINT fk_user FOREIGN KEY (UserId) REFERENCES users(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS Parameters (
		    ParamId SERIAL PRIMARY KEY,
		    APIId INT NOT NULL,
		    Parameter TEXT,  -- Fixed typo (was "Paramter")
		    CONSTRAINT fk_api FOREIGN KEY (APIId) REFERENCES APIs(APIId) ON DELETE CASCADE
		);
	*/

	// create router
	router := mux.NewRouter()
	router.HandleFunc("/api/go/users", getUsers(db)).Methods("GET")
	router.HandleFunc("/api/go/users", createUser(db)).Methods("POST")
	router.HandleFunc("/api/go/users/{id}", getUser(db)).Methods("GET")
	router.HandleFunc("/api/go/users/{id}", updateUser(db)).Methods("PUT")
	router.HandleFunc("/api/go/users/{id}", deleteUser(db)).Methods("DELETE")
	router.HandleFunc("/api/go/login", loginUser(db)).Methods("POST") // User login

	// wrap the router with CORS and JSON content type middlewares
	enhancedRouter := enableCORS(jsonContentTypeMiddleware(router))

	// start server
	log.Fatal(http.ListenAndServe(":8000", enhancedRouter))
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*") // Allow any origin
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Check if the request is for CORS preflight
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Pass down the request to the next middleware (or final handler)
		next.ServeHTTP(w, r)
	})

}

func jsonContentTypeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set JSON Content-Type
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

// get all users
func getUsers(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("SELECT * FROM users")
		if err != nil {
			log.Fatal(err)
		}
		defer rows.Close()

		users := []User{} // array of users
		for rows.Next() {
			var u User
			if err := rows.Scan(&u.Id, &u.Name, &u.Email, &u.Password); err != nil {
				log.Fatal(err)
			}
			users = append(users, u)
		}
		if err := rows.Err(); err != nil {
			log.Fatal(err)
		}

		json.NewEncoder(w).Encode(users)
	}
}

// get user by id
func getUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]

		var u User
		err := db.QueryRow("SELECT * FROM users WHERE id = $1", id).Scan(&u.Id, &u.Name, &u.Email, &u.Password)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(u)
	}
}

/*
type User struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password,omitempty"`
}
*/

// create user
func createUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var u User
		json.NewDecoder(r.Body).Decode(&u)

		err := db.QueryRow("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id", u.Name, u.Email, u.Password).Scan(&u.Id)
		if err != nil {
			log.Fatal(err)
		}
		log.Println("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id", u.Name, u.Email, u.Password)

		json.NewEncoder(w).Encode(u)
	}
}

// update user
func updateUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var u User
		json.NewDecoder(r.Body).Decode(&u)

		vars := mux.Vars(r)
		id := vars["id"]

		// Execute the update query
		_, err := db.Exec("UPDATE users SET name = $1, email = $2 WHERE id = $3", u.Name, u.Email, id)
		if err != nil {
			log.Fatal(err)
		}

		// Retrieve the updated user data from the database
		var updatedUser User
		err = db.QueryRow("SELECT id, name, email FROM users WHERE id = $1", id).Scan(&updatedUser.Id, &updatedUser.Name, &updatedUser.Email)
		if err != nil {
			log.Fatal(err)
		}

		// Send the updated user data in the response
		json.NewEncoder(w).Encode(updatedUser)
	}
}

// delete user
func deleteUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]

		var u User
		err := db.QueryRow("SELECT * FROM users WHERE id = $1", id).Scan(&u.Id, &u.Name, &u.Email)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			return
		} else {
			_, err := db.Exec("DELETE FROM users WHERE id = $1", id)
			if err != nil {
				//todo : fix error handling
				w.WriteHeader(http.StatusNotFound)
				return
			}

			json.NewEncoder(w).Encode("User deleted")
		}
	}

}

func loginUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var input User
		json.NewDecoder(r.Body).Decode(&input)

		var storedUser User
		err := db.QueryRow("SELECT id, name, email, password FROM users WHERE email = $1", input.Email).
			Scan(&storedUser.Id, &storedUser.Name, &storedUser.Email, &storedUser.Password)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid email or password"})
			return
		}

		// // Compare hashed password with provided password
		// err = bcrypt.CompareHashAndPassword([]byte(storedUser.Password), []byte(input.Password))
		// if err != nil {
		// 	w.Header().Set("Content-Type", "application/json")
		// 	w.WriteHeader(http.StatusUnauthorized)
		// 	json.NewEncoder(w).Encode(map[string]string{"error": "Invalid email or password"})
		// 	return
		// }

		// Remove password from response
		storedUser.Password = ""
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(storedUser)
	}
}

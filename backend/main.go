package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type User struct {
	Id         int         `json:"id"`
	Name       string      `json:"name"`
	Email      string      `json:"email"`
	Password   string      `json:"password,omitempty"`
	Dashboards []Dashboard `json:"dashboards"`
}

// API struct that reads in the necessary data from the frontend to create a dynamic api
type API struct {
	APIId      int         `json:"apiId"`     // Corresponds to APIId SERIAL PRIMARY KEY
	UserId     int         `json:"userId"`    // Corresponds to UserId INT NOT NULL
	APIName    string      `json:"apiName"`   // Corresponds to Name (missing in the table definition, added here)
	APIString  string      `json:"apiString"` // Corresponds to APIString TEXT
	APIKey     string      `json:"apiKey"`    // Corresponds to APIKey TEXT
	GraphType  string      `json:"graphType"`
	PaneX      int         `json:"paneX"`      // Corresponds to PaneX INT
	PaneY      int         `json:"paneY"`      // Corresponds to PaneY INT
	Parameters []Parameter `json:"parameters"` // Represents the many-to-one relationship
	RootKey    string
}

type Parameter struct {
	Parameter string `json:"parameter"` // Corresponds to Parameter TEXT
}

// Updated Dashboard struct with UserId
type Dashboard struct {
	Id     int    `json:"id"`
	UserId int    `json:"userId"`
	Name   string `json:"name"`
	Panes  []API  `json:"panes"`
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
	_, err = db.Exec("CREATE TABLE IF NOT EXISTS APIs (APIId SERIAL PRIMARY KEY, UserId INT NOT NULL, APIName TEXT, APIString TEXT, APIKey TEXT, GraphType TEXT, PaneX INT, PaneY INT, RootKey TEXT, CONSTRAINT fk_user FOREIGN KEY (UserId) REFERENCES users(id) ON DELETE CASCADE)")
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Created APIs")

	//create parameters table if doesnt exist
	_, err = db.Exec("CREATE TABLE IF NOT EXISTS Parameters (ParamId SERIAL PRIMARY KEY, APIId INT NOT NULL, Parameter TEXT, CONSTRAINT fk_api FOREIGN KEY (APIId) REFERENCES APIs(APIId) ON DELETE CASCADE)")
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Created Parameters")

	// Create dashboards table with correct foreign key
	_, err = db.Exec("CREATE TABLE IF NOT EXISTS Dashboards (DashboardId SERIAL PRIMARY KEY, UserId INT NOT NULL, Name TEXT, CONSTRAINT fk_user FOREIGN KEY (UserId) REFERENCES users(id) ON DELETE CASCADE)")
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Created Dashboards")

	// Create dashboard panes mapping table
	_, err = db.Exec("CREATE TABLE IF NOT EXISTS DashboardPanes (DashboardPaneId SERIAL PRIMARY KEY, DashboardId INT NOT NULL, APIId INT NOT NULL, CONSTRAINT fk_dashboard FOREIGN KEY (DashboardId) REFERENCES Dashboards(DashboardId) ON DELETE CASCADE, CONSTRAINT fk_api FOREIGN KEY (APIId) REFERENCES APIs(APIId) ON DELETE CASCADE)")
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Created DashboardPanes")

	// create router
	router := mux.NewRouter()

	// User routes
	router.HandleFunc("/api/go/users", getUsers(db)).Methods("GET")
	router.HandleFunc("/api/go/users", createUser(db)).Methods("POST")
	router.HandleFunc("/api/go/users/{id}", getUser(db)).Methods("GET")
	router.HandleFunc("/api/go/users/{id}", updateUser(db)).Methods("PUT")
	router.HandleFunc("/api/go/users/{id}", deleteUser(db)).Methods("DELETE")
	router.HandleFunc("/api/go/login", loginUser(db)).Methods("POST")               // User login
	router.HandleFunc("/api/go/getID/{email}", getUserIdByEmail(db)).Methods("GET") // Get user ID by email

	// API routes
	router.HandleFunc("/api/go/createAPI", createAPI(db)).Methods("POST")

	//router to delete api from the db and casecade
	router.HandleFunc("/api/go/deleteAPI/{index}", deleteAPI(db)).Methods("DELETE")
	//api to get all APIs associated with userID
	router.HandleFunc("/api/go/apis/{userId}", getAPIsByUserId(db)).Methods("GET") // wrap the router with CORS and JSON content type middlewares
	// Dashboard routes
	router.HandleFunc("/api/go/createDashboard", createDashboard(db)).Methods("POST")
	router.HandleFunc("/api/go/dashboards/user/{userId}", getDashboardsByUserId(db)).Methods("GET")
	router.HandleFunc("/api/go/dashboards/{id}", getDashboardById(db)).Methods("GET")
	router.HandleFunc("/api/go/dashboards/{id}", updateDashboard(db)).Methods("PUT")
	router.HandleFunc("/api/go/dashboards/{id}", deleteDashboard(db)).Methods("DELETE")

	// Dashboard panes routes
	router.HandleFunc("/api/go/dashboards/{dashboardId}/panes", addPaneToDashboard(db)).Methods("POST")
	router.HandleFunc("/api/go/dashboards/{dashboardId}/panes/{apiId}", removePaneFromDashboard(db)).Methods("DELETE")

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

func createAPI(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var input API

		err := json.NewDecoder(r.Body).Decode(&input)
		if err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		var apiId int

		err = db.QueryRow(
			"INSERT INTO APIs (UserId, APIString, APIName, APIKey, GraphType, PaneX, PaneY, RootKey) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING APIId",
			input.UserId, input.APIString, input.APIName, input.APIKey, input.GraphType, input.PaneX, input.PaneY, input.RootKey,
		).Scan(&apiId)
		log.Println(err)
		if err != nil {
			log.Printf("Error inserting API: %v", err)
			http.Error(w, "Failed to create API", http.StatusInternalServerError)
			return
		}

		//code for looping over the parameters and inserting into param table
		for _, param := range input.Parameters {
			_, err := db.Exec(
				"INSERT INTO Parameters (APIId, Parameter) VALUES ($1, $2)",
				apiId, param.Parameter,
			)
			if err != nil {
				log.Printf("Error inserting parameter: %v", err)
				http.Error(w, "Failed to create parameters", http.StatusInternalServerError)
				return
			}
		}
		// Return the created API with its parameters as a response
		input.APIId = apiId // Set the generated APIId
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(input)
	}
}

func getAPIsByUserId(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract userId from the request URL
		vars := mux.Vars(r)
		userId := vars["userId"]

		// Query the database for APIs with the given userId
		rows, err := db.Query("SELECT APIId, UserId, APIName, APIString, APIKey, GraphType, PaneX, PaneY, RootKey, FROM APIs WHERE UserId = $1", userId)
		if err != nil {
			log.Printf("Error querying APIs: %v", err)
			http.Error(w, "Failed to fetch APIs", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Create a slice to hold the results
		var apis []API

		// Iterate over the rows and populate the slice
		for rows.Next() {
			var api API

			// Scan the API row
			err := rows.Scan(&api.APIId, &api.UserId, &api.APIName, &api.APIString, &api.APIKey, &api.GraphType, &api.PaneX, &api.PaneY)
			if err != nil {
				log.Printf("Error scanning API row: %v", err)
				http.Error(w, "Failed to fetch APIs", http.StatusInternalServerError)
				return
			}

			// Query the parameters table to fetch the list of parameters for this API
			paramRows, err := db.Query("SELECT Parameter FROM Parameters WHERE APIId = $1", api.APIId)
			if err != nil {
				log.Printf("Error querying parameters for APIId %d: %v", api.APIId, err)
				http.Error(w, "Failed to fetch parameters", http.StatusInternalServerError)
				return
			}
			defer paramRows.Close()

			// Create a slice to hold the parameters
			var parameters []Parameter

			// Iterate over the parameter rows and populate the slice
			for paramRows.Next() {
				var param Parameter
				err := paramRows.Scan(&param.Parameter)
				if err != nil {
					log.Printf("Error scanning parameter row: %v", err)
					http.Error(w, "Failed to fetch parameters", http.StatusInternalServerError)
					return
				}
				log.Println("Parameters:", param)

				parameters = append(parameters, param)
			}

			// Check for errors during parameter iteration
			if err := paramRows.Err(); err != nil {
				log.Printf("Error iterating over parameter rows: %v", err)
				http.Error(w, "Failed to fetch parameters", http.StatusInternalServerError)
				return
			}

			// Assign the parameters to the API struct
			api.Parameters = parameters

			// Add the API to the result slice
			apis = append(apis, api)
		}

		// Check for errors during API iteration
		if err := rows.Err(); err != nil {
			log.Printf("Error iterating over API rows: %v", err)
			http.Error(w, "Failed to fetch APIs", http.StatusInternalServerError)
			return
		}

		// Return the results as JSON
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(apis)
	}
}

func getUserIdByEmail(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract email from the request URL
		vars := mux.Vars(r)
		email := vars["email"]

		var userId int
		// Query the database for the user ID with the given email
		err := db.QueryRow("SELECT id FROM users WHERE email = $1 LIMIT 1", email).Scan(&userId)
		if err != nil {
			log.Printf("Error querying user ID for email %s: %v", email, err)
			http.Error(w, "Failed to fetch user ID", http.StatusInternalServerError)
			return
		}

		// Return the user ID as JSON
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]int{"userId": userId})
	}
}
func deleteAPI(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["index"]

		// Delete all parameters associated with the API
		_, err1 := db.Exec("DELETE FROM parameters WHERE apiid = $1", id)
		if err1 != nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete parameters"})
			return
		}

		// Delete the API
		_, err2 := db.Exec("DELETE FROM apis WHERE apiid = $1", id)
		if err2 != nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete API"})
			return
		}

		// Send success response
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "API deleted successfully"})

	}
}

// Dashboard Handlers

// Create a new dashboard
func createDashboard(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var dashboard Dashboard
		err := json.NewDecoder(r.Body).Decode(&dashboard)
		if err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		// Insert the dashboard into the database
		var dashboardId int
		err = db.QueryRow(
			"INSERT INTO Dashboards (UserId, Name) VALUES ($1, $2) RETURNING DashboardId",
			dashboard.UserId, dashboard.Name,
		).Scan(&dashboardId)

		if err != nil {
			log.Printf("Error creating dashboard: %v", err)
			http.Error(w, "Failed to create dashboard", http.StatusInternalServerError)
			return
		}

		// Set the generated ID
		dashboard.Id = dashboardId

		// Return the created dashboard
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(dashboard)
	}
}

// Get all dashboards for a user
func getDashboardsByUserId(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		userId := vars["userId"]

		// Query the database for dashboards with the given userId
		rows, err := db.Query("SELECT DashboardId, UserId, Name FROM Dashboards WHERE UserId = $1", userId)
		if err != nil {
			log.Printf("Error querying dashboards: %v", err)
			http.Error(w, "Failed to fetch dashboards", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Create a slice to hold the results
		var dashboards []Dashboard

		// Iterate over the rows and populate the slice
		for rows.Next() {
			var dashboard Dashboard

			// Scan the dashboard row
			err := rows.Scan(&dashboard.Id, &dashboard.UserId, &dashboard.Name)
			if err != nil {
				log.Printf("Error scanning dashboard row: %v", err)
				http.Error(w, "Failed to fetch dashboards", http.StatusInternalServerError)
				return
			}

			// Add the dashboard to the result slice
			dashboards = append(dashboards, dashboard)
		}

		// Check for errors during dashboard iteration
		if err := rows.Err(); err != nil {
			log.Printf("Error iterating over dashboard rows: %v", err)
			http.Error(w, "Failed to fetch dashboards", http.StatusInternalServerError)
			return
		}

		// Return the results as JSON
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(dashboards)
	}
}

// Get a specific dashboard by ID with its panes (APIs)
func getDashboardById(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		dashboardId := vars["id"]

		// Query the database for the dashboard
		var dashboard Dashboard
		err := db.QueryRow("SELECT DashboardId, UserId, Name FROM Dashboards WHERE DashboardId = $1", dashboardId).
			Scan(&dashboard.Id, &dashboard.UserId, &dashboard.Name)

		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Dashboard not found", http.StatusNotFound)
			} else {
				log.Printf("Error querying dashboard: %v", err)
				http.Error(w, "Failed to fetch dashboard", http.StatusInternalServerError)
			}
			return
		}

		// Get all APIs associated with this dashboard through the DashboardPanes table
		query := `
			SELECT a.APIId, a.UserId, a.APIName, a.APIString, a.APIKey, a.GraphType, a.PaneX, a.PaneY 
			FROM APIs a
			JOIN DashboardPanes dp ON a.APIId = dp.APIId
			WHERE dp.DashboardId = $1
		`

		rows, err := db.Query(query, dashboardId)
		if err != nil {
			log.Printf("Error querying dashboard panes: %v", err)
			http.Error(w, "Failed to fetch dashboard panes", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Create a slice to hold the panes
		var panes []API

		// Iterate over the rows and populate the slice
		for rows.Next() {
			var pane API

			// Scan the API row
			err := rows.Scan(&pane.APIId, &pane.UserId, &pane.APIName, &pane.APIString, &pane.APIKey, &pane.GraphType, &pane.PaneX, &pane.PaneY)
			if err != nil {
				log.Printf("Error scanning API row: %v", err)
				http.Error(w, "Failed to fetch dashboard panes", http.StatusInternalServerError)
				return
			}

			// Get parameters for this API
			paramRows, err := db.Query("SELECT Parameter FROM Parameters WHERE APIId = $1", pane.APIId)
			if err != nil {
				log.Printf("Error querying parameters for APIId %d: %v", pane.APIId, err)
				http.Error(w, "Failed to fetch parameters", http.StatusInternalServerError)
				return
			}
			defer paramRows.Close()

			// Create a slice to hold the parameters
			var parameters []Parameter

			// Iterate over the parameter rows and populate the slice
			for paramRows.Next() {
				var param Parameter
				err := paramRows.Scan(&param.Parameter)
				if err != nil {
					log.Printf("Error scanning parameter row: %v", err)
					http.Error(w, "Failed to fetch parameters", http.StatusInternalServerError)
					return
				}

				parameters = append(parameters, param)
			}

			// Check for errors during parameter iteration
			if err := paramRows.Err(); err != nil {
				log.Printf("Error iterating over parameter rows: %v", err)
				http.Error(w, "Failed to fetch parameters", http.StatusInternalServerError)
				return
			}

			// Assign the parameters to the API struct
			pane.Parameters = parameters

			// Add the pane to the result slice
			panes = append(panes, pane)
		}

		// Assign the panes to the dashboard
		dashboard.Panes = panes

		// Return the dashboard with its panes
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(dashboard)
	}
}

// Update a dashboard
func updateDashboard(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		dashboardId := vars["id"]

		var dashboard Dashboard
		err := json.NewDecoder(r.Body).Decode(&dashboard)
		if err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		// Update the dashboard in the database
		_, err = db.Exec(
			"UPDATE Dashboards SET Name = $1 WHERE DashboardId = $2",
			dashboard.Name, dashboardId,
		)

		if err != nil {
			log.Printf("Error updating dashboard: %v", err)
			http.Error(w, "Failed to update dashboard", http.StatusInternalServerError)
			return
		}

		// Return the updated dashboard
		dashboard.Id, _ = strconv.Atoi(dashboardId)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(dashboard)
	}
}

// Delete a dashboard
func deleteDashboard(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		dashboardId := vars["id"]

		// Delete the dashboard from the database
		_, err := db.Exec("DELETE FROM Dashboards WHERE DashboardId = $1", dashboardId)
		if err != nil {
			log.Printf("Error deleting dashboard: %v", err)
			http.Error(w, "Failed to delete dashboard", http.StatusInternalServerError)
			return
		}

		// Return success message
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Dashboard deleted successfully"})
	}
}

// Add a pane (API) to a dashboard
func addPaneToDashboard(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		dashboardId := vars["dashboardId"]

		type PaneRequest struct {
			APIId int `json:"apiId"`
		}

		var paneReq PaneRequest
		err := json.NewDecoder(r.Body).Decode(&paneReq)
		if err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		// Insert into the DashboardPanes mapping table
		_, err = db.Exec(
			"INSERT INTO DashboardPanes (DashboardId, APIId) VALUES ($1, $2)",
			dashboardId, paneReq.APIId,
		)

		if err != nil {
			log.Printf("Error adding pane to dashboard: %v", err)
			http.Error(w, "Failed to add pane to dashboard", http.StatusInternalServerError)
			return
		}

		// Return success message
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Pane added to dashboard successfully"})
	}
}

// Remove a pane (API) from a dashboard
func removePaneFromDashboard(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		dashboardId := vars["dashboardId"]
		apiId := vars["apiId"]

		// Delete the entry from the DashboardPanes mapping table
		_, err := db.Exec(
			"DELETE FROM DashboardPanes WHERE DashboardId = $1 AND APIId = $2",
			dashboardId, apiId,
		)

		if err != nil {
			log.Printf("Error removing pane from dashboard: %v", err)
			http.Error(w, "Failed to remove pane from dashboard", http.StatusInternalServerError)
			return
		}

		// Return success message
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Pane removed from dashboard successfully"})
	}
}

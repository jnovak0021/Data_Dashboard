import { useState } from "react";
import { saveUserSession } from "../../utils/auth";

export default function Login({ setIsLoggedIn, setUser }: { setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>; setUser: React.Dispatch<React.SetStateAction<string | null>> }) {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [name, setName] = useState(""); // Name state for sign-up
   const [isCreatingAccount, setIsCreatingAccount] = useState(false); // Toggle between login & sign-up
   const [accountCreated, setAccountCreated] = useState(false); // Track if account creation is successful
   const [errorMessage, setErrorMessage] = useState(""); // Error message state
   const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE;  //contant for the baseURL

   const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Login attempt with email:", email); // Debugging

      try {
         const response = await fetch(`${BASE_URL}/api/go/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
         });

         const contentType = response.headers.get("Content-Type");
         if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            console.log("Login response:", data); // Debugging the login response

            if (response.ok) {
               console.log("Login successful, user email:", data.email); // Log user email
               
               // Save user session to localStorage
               saveUserSession({
                  email: data.email,
                  id: data.id,
                  name: data.name || '',
                  isLoggedIn: true
               });
               
               setUser(data.email); // Set user email in state
               setIsLoggedIn(true); // Mark user as logged in
            } else {
               console.log("Login failed with message:", data.error); // Debugging failure case
               setErrorMessage(data.error || "Invalid email or password.");
            }
         } else {
            const text = await response.text();
            console.error("Error during login:", text); // Debugging error
            setErrorMessage("Something went wrong!");
         }
      } catch (error) {
         console.error("Error during login:", error); // Debugging error
         setErrorMessage("Something went wrong!");
      }
   };

   const handleCreateAccount = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Creating account with email:", email); // Debugging

      if (!email || !password || !name) {
         setErrorMessage("Please fill out all fields.");
         return;
      }

      try {
         const response = await fetch(`${BASE_URL}/api/go/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
         });

         const data = await response.json();
         console.log("Account creation response:", data); // Debugging the account creation response

         if (response.ok) {
            setAccountCreated(true);
            setErrorMessage(""); // Clear errors
            console.log("Account created successfully!"); // Debugging success
         } else {
            setErrorMessage(data.message || "Failed to create account.");
         }
      } catch (error) {
         console.error("Error during account creation:", error); // Debugging error
         setErrorMessage("Something went wrong!");
      }
   };

   return (
      <div className="bg-black bg-opacity-50 p-8 rounded-lg space-y-6 w-full max-w-md z-10">
         <h2 className="text-2xl font-bold text-white text-center">{isCreatingAccount ? "Create Account" : "Login"}</h2>

         {accountCreated ? (
            <div className="space-y-4">
               <p className="text-center text-lg font-bold text-green-400">Account created successfully!</p>
               <button
                  onClick={() => {
                     setIsCreatingAccount(false);
                     setAccountCreated(false);
                  }}
                  className="w-full p-3 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
               >
                  Back to Login
               </button>
            </div>
         ) : (
            <form onSubmit={isCreatingAccount ? handleCreateAccount : handleLogin} className="space-y-4">
               {isCreatingAccount && <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white" />}
               <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white" />
               <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white" />
               <button type="submit" className="w-full p-3 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700">
                  {isCreatingAccount ? "Create Account" : "Sign In"}
               </button>
            </form>
         )}

         {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}

         {!accountCreated && (
            <div className="text-center text-sm text-gray-400">
               <a href="#" onClick={() => setIsCreatingAccount((prev) => !prev)} className="hover:underline">
                  {isCreatingAccount ? "Already have an account? Sign In" : "Create Account"}
               </a>
            </div>
         )}
      </div>
   );
}
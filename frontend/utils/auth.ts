// User session functions

interface UserSession {
    email: string;
    id: number;
    name: string;
    isLoggedIn: boolean;
  }
  
  export const saveUserSession = (userData: UserSession): void => {
    localStorage.setItem('userSession', JSON.stringify(userData));
  };
  
  export const getUserSession = (): UserSession | null => {
    const sessionData = localStorage.getItem('userSession');
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    return null;
  };

// Function to fetch userId from the backend
export const fetchUserId = async (): Promise<number | null> => {
  try {
    const session = getUserSession();

    if (!session || !session.email) {
      throw new Error('No user session or email found');
    }
    const response = await fetch(`http://localhost:8000/api/go/getID/${session.email}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user ID: ${response.statusText}`);
    }
    const data = await response.json();
    return data.userId; 
  } catch (error) {
    console.error('Error fetching user ID:', error);
    return null;
  }
};

  
  export const clearUserSession = (): void => {
    localStorage.removeItem('userSession');
  };
  
  export const isAuthenticated = (): boolean => {
    const session = getUserSession();
    return session !== null && session.isLoggedIn === true;
  };
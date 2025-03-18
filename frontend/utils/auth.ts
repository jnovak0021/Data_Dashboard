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
  
  export const clearUserSession = (): void => {
    localStorage.removeItem('userSession');
  };
  
  export const isAuthenticated = (): boolean => {
    const session = getUserSession();
    return session !== null && session.isLoggedIn === true;
  };
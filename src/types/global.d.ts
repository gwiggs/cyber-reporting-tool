interface Window {
  api: {
    auth: {
      login: (credentials: { email: string; password: string }) => Promise<any>;
      register: (userData: { 
        email: string; 
        password: string; 
        firstName: string; 
        lastName: string; 
        role: string 
      }) => Promise<any>;
      logout: () => Promise<any>;
    }
  }
} 
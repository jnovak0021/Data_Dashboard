export interface DashboardType {
  id: number; // Assuming ID is a number from the backend
  name: string;
  apis: APIData[];
};

export interface APIData {
    id?: number;
    userId: string;
    apiName: string;
    apiString: string;
    apiKey?: string;
    graphType: string;
    paneX: number;
    paneY: number;
    parameters: string[] | Record<string, any>[];
    rootKeys: RootKeyData[]; // Updated to support multiple root keys
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface RootKeyData {
    key: string;
    path: string; // Full path to the root key (e.g., "node.NameA[0]" or "node.NameA[1]")
  }
  
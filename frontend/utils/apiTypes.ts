/**
 * Root key data interface
//  */
// export interface RootKeyData {
//     key: string;   // Display name of the key
//     path: string;  // Full path to the key
//   }
  
  /**
   * Selected node in the API data structure
   */
  export interface SelectedNode {
    root: string;      // Root node this selection belongs to
    path: string[];    // Path to the node as array of keys
    fullPath: string;  // Full path as string for display/lookups
  }
  
  /**
   * API data structure
   */
  export interface ApiDataStructure {
    apiId: number;
    userId: number;
    apiName: string;
    apiString: string;
    apiKey?: string;
    graphType: string;
    paneX: number;
    paneY: number;
    parameters: string[];
    rootKeys: string[];
  }
  
  /**
   * API visualization configuration
   */
  export interface ApiVisualizationConfig {
    graphType: string;
    parameters: string[];
    rootKeys: string[];
    dimensions: {
      width: number;
      height: number;
    };
  }
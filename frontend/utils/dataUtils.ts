/**
 * Utility functions for handling JSON data in visualizations
 */

/**
 * Gets a nested value from an object using a path string
 * @param obj - The object to extract the value from
 * @param path - The path to the value (e.g., "user.address.city")
 * @returns The value at the path or undefined if not found
 */
export const getNestedValue = (obj: any, path: string): any => {
    if (!obj || !path) return undefined;
    
    // Handle array indices in the path (like "geometry.coordinates.0")
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  };
  
  /**
   * Collects all values from descendant nodes at a specific path
   * @param obj - The object to traverse
   * @param path - The path to collect values from
   * @returns Array of values found at the specified path
   */
  export const collectDescendantValues = (obj: any, path: string): any[] => {
    const values: any[] = [];
  
    const traverse = (current: any, remainingPath: string[]) => {
      if (!current || typeof current !== 'object') return;
  
      if (remainingPath.length === 0) {
        values.push(current);
        return;
      }
  
      const [currentKey, ...rest] = remainingPath;
  
      if (Array.isArray(current)) {
        current.forEach(item => traverse(item, remainingPath));
      } else {
        if (currentKey in current) {
          traverse(current[currentKey], rest);
        }
        // Also check other branches for the same path
        Object.values(current).forEach(value => {
          if (typeof value === 'object' && value !== null) {
            traverse(value, remainingPath);
          }
        });
      }
    };
  
    traverse(obj, path.split('.'));
    return values;
  };
  
  /**
   * Extract data from a JSON object using a root key and collect nested values
   * @param data - The JSON data to process
   * @param rootKey - The path to the root of the data
   * @param nestedPaths - Array of paths to collect from each child of root
   * @returns Processed data array or null if extraction fails
   */
  export const extractDataByRootKey = (
    data: any,
    rootKey?: string,
    nestedPaths: string[] = []
  ): any[] | null => {
    if (!data) return null;
    
    try {
      // Get the root node
      const rootNode = rootKey ? getNestedValue(data, rootKey) : data;
      if (!rootNode) return null;
  
      // If root is not an object, wrap in array
      if (typeof rootNode !== 'object') {
        return [{ value: rootNode }];
      }
  
      // Get immediate children of root
      const children = Array.isArray(rootNode) ? rootNode : Object.entries(rootNode);
  
      // Process each child
      return children.map((child: any) => {
        const childNode = Array.isArray(rootNode) ? child : child[1];
        const childKey = Array.isArray(rootNode) ? null : child[0];
  
        // Start with basic node info
        const result: Record<string, any> = {
          key: childKey,
          ...childNode
        };
  
        // Collect values from specified nested paths
        nestedPaths.forEach(path => {
          const values = collectDescendantValues(childNode, path);
          if (values.length > 0) {
            result[path] = values;
          }
        });
  
        return result;
      });
    } catch (error) {
      console.error('Error extracting data by root key:', error);
      return null;
    }
  };
  
  /**
   * Transforms raw data into a format suitable for visualization
   * @param data - The raw data array
   * @param parameters - The parameters to extract
   * @returns Transformed data array for visualization
   */
  export const transformDataForVisualization = (
    data: any[],
    parameters: string[]
  ): Record<string, any>[] => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((item: any, index: number) => {
      const dataPoint: Record<string, any> = { id: index };
      
      // If no parameters provided, use all primitive keys
      if (!parameters || parameters.length === 0) {
        if (typeof item === 'object' && item !== null) {
          Object.entries(item).forEach(([key, value]) => {
            if (typeof value !== 'object' || value === null) {
              dataPoint[key] = value;
            }
          });
        } else {
          dataPoint.value = item;
        }
      } else {
        // Extract values based on provided parameters
        parameters.forEach(param => {
          const value = getNestedValue(item, param);
          // Use the last part of the parameter path as the key
          const key = param.split('.').pop() || param;
          dataPoint[key] = value;
        });
      }
      
      return dataPoint;
    });
  };
  
  /**
   * Validates if the data is suitable for visualization
   * @param data - The data to validate
   * @param graphType - The type of graph to validate for
   * @param parameters - The parameters to check
   * @returns Error message or null if valid
   */
  export const validateDataForVisualization = (
    data: any[],
    graphType: string,
    parameters: string[]
  ): string | null => {
    if (!data || data.length === 0) {
      return "No data available to display";
    }
    
    // Check if we have the minimum required parameters for each graph type
    switch (graphType) {
      case 'pie':
      case 'bar':
        if (parameters.length < 2) {
          return `${graphType} chart requires at least 2 parameters (label and value)`;
        }
        break;
      case 'line':
        if (parameters.length < 2) {
          return "Line chart requires at least 2 parameters (x and y values)";
        }
        break;
      case 'scatter':
        if (parameters.length < 2) {
          return "Scatter plot requires at least 2 parameters (x and y coordinates)";
        }
        break;
    }
    
    // Verify that the data has the required parameters
    const missingParams = [];
    for (const param of parameters) {
      const paramKey = param.split('.').pop() || param;
      if (!data.some(item => paramKey in item)) {
        missingParams.push(paramKey);
      }
    }
    
    if (missingParams.length > 0) {
      return `Data is missing required parameter(s): ${missingParams.join(', ')}`;
    }
    
    return null;
  };
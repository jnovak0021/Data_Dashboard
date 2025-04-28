
/**
 * Extract data from a JSON object using a specified root key and path
 */
export function extractDataByRootKey(data: any, rootKeys: string[]): Record<string, any> {
    if (!data || !rootKeys || rootKeys.length === 0) return {};
    
    const result: Record<string, any> = {};
    for (const rootKey of rootKeys) {
      result[rootKey] = data[rootKey]; // Use the string directly as a path
    }
    
    return result;
}
/**
 * Extract data from a JSON object using multiple root keys
 */

export function extractDataByMultipleRootKeys(data: any, rootKeys: string[]): Record<string, any>  {
  if (!data || !rootKeys || rootKeys.length === 0) return {};
  
  const result: Record<string, any> = {};
  for (const rootKey of rootKeys) {
    result[rootKey] = extractDataByMultipleRootKeys(data, rootKey); // Use the string directly as a path
  }
  
  return result;
}
/**
 * Transform data for visualization
 */
export function transformDataForVisualization(
  extractedData: any, 
  parameters: string[] = []
): Record<string, any>[] {
  if (!extractedData || parameters.length === 0) return [];
  
  if (typeof extractedData === 'object' && !Array.isArray(extractedData)) {
    const paramsByRoot: Record<string, string[]> = {};
    
    parameters.forEach(param => {
      if (typeof param !== 'string') {
        console.warn('Invalid parameter type:', param);
        return;
      }

      // Find which root this parameter belongs to
      const rootPath = Object.keys(extractedData).find(root => 
        param && root && param.indexOf(root + '.') === 0
      );
      
      if (rootPath) {
        // Get the relative path within that root
        const relativePath = param.slice(rootPath.length + 1);
        if (!paramsByRoot[rootPath]) {
          paramsByRoot[rootPath] = [];
        }
        paramsByRoot[rootPath].push(relativePath);
      } else {
        if (!paramsByRoot['direct']) {
          paramsByRoot['direct'] = [];
        }
        paramsByRoot['direct'].push(param);
      }
    });
    
    let mergedResults: Record<string, any>[] = [];
    
    Object.entries(paramsByRoot).forEach(([rootPath, relativeParams]) => {
      if (rootPath === 'direct') {
        const result = processDirectParameters(extractedData, relativeParams);
        mergedResults = mergeResults(mergedResults, result);
      } else {
        const rootData = extractedData[rootPath];
        if (rootData) {
          const result = processRootData(rootData, relativeParams, rootPath);
          mergedResults = mergeResults(mergedResults, result);
        }
      }
    });
    
    return mergedResults;
  }
  
  return processRootData(extractedData, parameters);
}

/**
 * Process data from a specific root
 */
function processRootData(
  rootData: any, 
  parameters: string[], 
  rootPrefix: string = ''
): Record<string, any>[] {
  if (Array.isArray(rootData) && rootData.length > 0 && typeof rootData[0] === 'object') {
    return rootData.map(item => {
      const result: Record<string, any> = {};
      parameters.forEach(param => {
        const paramPath = param.split('.');
        let value = item;
        for (const part of paramPath) {
          if (value === null || value === undefined) break;
          value = value[part];
        }
        const paramKey = rootPrefix ? `${rootPrefix}.${param}` : param;
        result[paramKey] = value;
      });
      return result;
    });
  }
  
  if (typeof rootData === 'object' && rootData !== null) {
    const firstParam = parameters[0];
    const firstParamData = getNestedProperty(rootData, firstParam);
    
    if (Array.isArray(firstParamData)) {
      const result: Record<string, any>[] = [];
      const arrayLength = firstParamData.length;
      
      for (let i = 0; i < arrayLength; i++) {
        const record: Record<string, any> = {};
        parameters.forEach(param => {
          const paramData = getNestedProperty(rootData, param);
          if (Array.isArray(paramData) && i < paramData.length) {
            const paramKey = rootPrefix ? `${rootPrefix}.${param}` : param;
            record[paramKey] = paramData[i];
          }
        });
        result.push(record);
      }
      return result;
    }
  }
  
  const record: Record<string, any> = {};
  parameters.forEach(param => {
    const value = getNestedProperty(rootData, param);
    const paramKey = rootPrefix ? `${rootPrefix}.${param}` : param;
    record[paramKey] = value;
  });
  return [record];
}

/**
 * Process direct parameters
 */
function processDirectParameters(
  data: any, 
  parameters: string[]
): Record<string, any>[] {
  const record: Record<string, any> = {};
  parameters.forEach(param => {
    record[param] = getNestedProperty(data, param);
  });
  return [record];
}

/**
 * Merge results from multiple roots
 */
function mergeResults(
  existingResults: Record<string, any>[], 
  newResults: Record<string, any>[]
): Record<string, any>[] {
  if (existingResults.length === 0) return newResults;
  if (newResults.length === 0) return existingResults;
  
  if (existingResults.length === newResults.length) {
    return existingResults.map((existingItem, index) => ({
      ...existingItem,
      ...newResults[index]
    }));
  }
  
  const result: Record<string, any>[] = [];
  existingResults.forEach(existingItem => {
    newResults.forEach(newItem => {
      result.push({
        ...existingItem,
        ...newItem
      });
    });
  });
  return result;
}

/**
 * Get a nested property from an object
 */
function getNestedProperty(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split(/[\[\].]/).filter(Boolean);
  let result = obj;
  
  for (const part of parts) {
    if (result === null || result === undefined) return undefined;
    const index = parseInt(part);
    if (!isNaN(index) && Array.isArray(result)) {
      result = result[index];
    } else {
      result = result[part];
    }
  }
  return result;
}

/**
 * Validate data for visualization
 */
export function validateDataForVisualization(
  data: Record<string, any>[], 
  graphType: string, 
  parameters: string[]
): string | null {
  if (!data || data.length === 0) {
    return "No data available for visualization";
  }
  
  if (parameters.length === 0) {
    return "No parameters selected for visualization";
  }
  
  const firstDataItem = data[0];
  const missingParams = parameters.filter(param => {
    const paramName = param.includes('.') ? param.split('.').pop()! : param;
    return !Object.keys(firstDataItem).some(key => 
      key === param || key.endsWith(`.${paramName}`)
    );
  });
  
  if (missingParams.length > 0) {
    return `Missing parameters in data: ${missingParams.join(', ')}`;
  }
  
  switch (graphType) {
    case 'line':
    case 'bar':
    case 'scatter':
      if (parameters.length < 2) {
        return `${graphType} charts require at least 2 parameters (x and y axis)`;
      }
      break;
    case 'pie':
      if (parameters.length < 2) {
        return "Pie charts require at least 2 parameters (labels and values)";
      }
      break;
  }
  
  return null;
}

/**
 * Get parameter display name
 */
export function getParameterDisplayName(fullPath: string, rootKeys: RootKeyData[] = []): string {
  for (const rootKey of rootKeys) {
    if (fullPath.startsWith(rootKey.path + '.')) {
      const relativePath = fullPath.substring(rootKey.path.length + 1);
      const parts = relativePath.split('.');
      return parts[parts.length - 1];
    }
  }
  const parts = fullPath.split('.');
  return parts[parts.length - 1];
}
/**
 * Root key data interface
 */
export interface RootKeyData {
  key: string;   // Display name of the key
  path: string;  // Full path to the key
}

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
  rootKeys: RootKeyData[];
}

/**
 * API visualization configuration
 */
export interface ApiVisualizationConfig {
  graphType: string;
  parameters: string[];
  rootKeys: RootKeyData[];
  dimensions: {
    width: number;
    height: number;
  };
}









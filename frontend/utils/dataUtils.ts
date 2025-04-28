/**
 * Extract data from a JSON object using a specified root key and path
 */
export function extractDataByRootKey(data: any, rootKey: string): any {
  if (!data) return null;
  
  if (rootKey === 'root' && Array.isArray(data)) {
    return data;
  }
  
  const pathParts = rootKey.split(/[\[\].]/).filter(Boolean);
  let result = data;
  
  for (const part of pathParts) {
    if (result === null || result === undefined) return null;
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
 * Extract data from a JSON object using multiple root keys
 */
export function extractDataByMultipleRootKeys(data: any, rootKeys: string[]): Record<string, any> {
  if (!data || !rootKeys || rootKeys.length === 0) return {};
  
  const result: Record<string, any> = {};
  for (const rootKey of rootKeys) {
    result[rootKey] = extractDataByRootKey(data, rootKey);
  }
  
  return result;
}

/**
 * Transform data for visualization
 */
export function transformDataForVisualization(extractedData: any, parameters: string[] = []): Record<string, any>[] {
  if (!extractedData || parameters.length === 0) return [];

  // Handle case where extracted data is an object with multiple roots
  if (typeof extractedData === 'object' && !Array.isArray(extractedData)) {
    const paramsByRoot: Record<string, string[]> = {};
    
    // Group parameters by their root keys
    parameters.forEach(param => {
      const rootKey = Object.keys(extractedData).find(root => 
        param.startsWith(root + '.')
      );
      
      if (rootKey) {
        if (!paramsByRoot[rootKey]) {
          paramsByRoot[rootKey] = [];
        }
        // Remove root prefix from parameter
        const relativePath = param.slice(rootKey.length + 1);
        paramsByRoot[rootKey].push(relativePath);
      } else {
        if (!paramsByRoot['direct']) {
          paramsByRoot['direct'] = [];
        }
        paramsByRoot['direct'].push(param);
      }
    });

    let results: Record<string, any>[] = [];
    
    // Process each root's data
    Object.entries(paramsByRoot).forEach(([rootKey, rootParams]) => {
      if (rootKey === 'direct') {
        const directResults = processDirectParameters(extractedData, rootParams);
        results = mergeResults(results, directResults);
      } else {
        const rootData = extractedData[rootKey];
        if (Array.isArray(rootData)) {
          // Handle array data
          const rootResults = rootData.map(item => {
            const record: Record<string, any> = {};
            rootParams.forEach(param => {
              const value = getNestedProperty(item, param);
              record[`${rootKey}.${param}`] = value;
            });
            return record;
          });
          results = mergeResults(results, rootResults);
        } else if (typeof rootData === 'object' && rootData !== null) {
          // Handle object data with potential arrays
          const arrayParams = rootParams.filter(param => 
            Array.isArray(getNestedProperty(rootData, param))
          );
          
          if (arrayParams.length > 0) {
            // Find the longest array
            const maxLength = Math.max(...arrayParams.map(param => 
              (getNestedProperty(rootData, param) as any[]).length
            ));
            
            // Create records for each array index
            const rootResults = Array.from({ length: maxLength }, (_, i) => {
              const record: Record<string, any> = {};
              rootParams.forEach(param => {
                const value = getNestedProperty(rootData, param);
                record[`${rootKey}.${param}`] = Array.isArray(value) ? value[i] : value;
              });
              return record;
            });
            results = mergeResults(results, rootResults);
          } else {
            // Handle non-array object data
            const record: Record<string, any> = {};
            rootParams.forEach(param => {
              const value = getNestedProperty(rootData, param);
              record[`${rootKey}.${param}`] = value;
            });
            results = mergeResults(results, [record]);
          }
        }
      }
    });

    return results;
  }

  // Handle single root or direct array data
  if (Array.isArray(extractedData)) {
    return extractedData.map(item => {
      const record: Record<string, any> = {};
      parameters.forEach(param => {
        record[param] = getNestedProperty(item, param);
      });
      return record;
    });
  }

  // Handle single object
  const record: Record<string, any> = {};
  parameters.forEach(param => {
    record[param] = getNestedProperty(extractedData, param);
  });
  return [record];
}

/**
 * Process direct parameters
 */
function processDirectParameters(data: any, parameters: string[]): Record<string, any>[] {
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
  
  if (!parameters || parameters.length === 0) {
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
 * Get parameter display name - i.e. gets the last value in the .notation string
 */
export function getParameterDisplayName(fullPath: string, rootKeys: string[] = []): string {
  if (!fullPath) return '';
  
  for (const rootKey of rootKeys) {
    if (fullPath.startsWith(rootKey + '.')) {
      const relativePath = fullPath.substring(rootKey.length + 1);
      const parts = relativePath.split('.');
      return parts[parts.length - 1];
    }
  }
  
  const parts = fullPath.split('.');
  return parts[parts.length - 1];
}

//checks for falsy data types or if the array is empty and returns valid empty array
export function normalizeRootKeys(rootKeys: string[]): string[] {
  if (!rootKeys || rootKeys.length === 0) return ["EMPTY"];
  return rootKeys;
}
/**
 * Extract and transform data for visualization based on root and parameters
 */
export function transformDataForVisualization(data: any, parameters: string[] = [], rootKeys: string[] = []): Record<string, any>[] {
  if (!data || !parameters.length) return [];

  let allRecords: Record<string, any>[] = [];

  const rootArrays: any[][] = [];

  // Depending on how many root keys we have, we'll create a subarray for each
  if (rootKeys.length > 0) {
    // Multiple root arrays
    rootKeys.forEach(key => {
      const subArray = Array.isArray(data) ? data : findArrayByKey(data, key);      
      if (Array.isArray(subArray)) {
        rootArrays.push(subArray);
      }
    });
  } else {
    // Single root array
    const arrayData = Array.isArray(data) ? data : findFirstArray(data);
    if (arrayData) rootArrays.push(arrayData);
  }
  
  // Now process all arrays
  if (rootKeys.length > 1) {
    // Merge by index across all root arrays
    const maxLength = Math.max(...rootArrays.map(arr => arr.length));
  
    for (let i = 0; i < maxLength; i++) {
      const record: Record<string, any> = {};
  
      rootArrays.forEach((arrayData, idx) => {
        const value = arrayData[i];
        const key = rootKeys[idx];
        record[key] = value;
      });
  
      allRecords.push(record);
    }
  
  } else {
    // Single array case
    rootArrays.forEach(arrayData => {
      arrayData.forEach(item => {
        const record: Record<string, any> = {};
  
        parameters.forEach(param => {
          const parts = param.split('.');
          const lastPart = parts[parts.length - 1];
                
          if (item.hasOwnProperty(lastPart)) {        
            record[param] = item[lastPart];          
          } else {          
            const value = findValueByKey(item, lastPart);
            record[param] = value;
          }
        });
  
        allRecords.push(record);
      });
    });
  }
  
  return allRecords;
}


/**
 * Find the first array in a nested structure
 */
function findFirstArray(data: any): any[] | null {
  if (!data || typeof data !== 'object') return null;
  if (Array.isArray(data)) return data;

  for (const key in data) {
    if (Array.isArray(data[key])) return data[key];
    const nestedArray = findFirstArray(data[key]);
    if (nestedArray) return nestedArray;
  }

  return null;
}

/**
 * Find an array by key name in an object
 */
function findArrayByKey(data: any, keyPath: string): any[] | null {
  if (!data || typeof data !== 'object') return null;
  if (!keyPath) return null;

  const keys = keyPath.split('.');
  let current = data;

  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return null;
    }
    current = current[key];
  }

  return Array.isArray(current) ? current : null;
}


/**
 * Find a value by key name in an object or its nested objects
 */
function findValueByKey(obj: any, key: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  
  // Direct property match
  if (obj.hasOwnProperty(key)) {    
    return obj[key];
  }

  // Search in nested objects
  for (const k in obj) {   
    if (typeof obj[k] === 'object') {
      const value = findValueByKey(obj[k], key);      
      if (value !== undefined) {                
        return value;
      }
    }
  }

  return undefined;
}

/**
 * Validate data for visualization
 */
export function validateDataForVisualization(
  data: Record<string, any>[], 
  graphType: string, 
  parameters: string[]
): string | null {
  if (!data?.length) return "No data available for visualization";
  if (!parameters?.length) return "No parameters selected for visualization";
  
  const requiredParams = graphType === 'pie' ? 2 : 2;
  if (parameters.length < requiredParams) {
    return `${graphType} charts require at least ${requiredParams} parameters`;
  }

  return null;
}

/**
 * Normalize root keys
 */
export function normalizeRootKeys(rootKeys: string[]): string[] {
  return rootKeys?.filter(Boolean) || [];
}

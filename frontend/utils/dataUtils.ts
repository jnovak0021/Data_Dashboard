/**
 * Extract and transform data for visualization based on root and parameters
 */
export function transformDataForVisualization(data: any, parameters: string[] = []): Record<string, any>[] {
  if (!data || !parameters.length) return [];

  // If data is not an array, try to find the first array in the structure
  let arrayData = Array.isArray(data) ? data : findFirstArray(data);
  if (!arrayData) return [];

  // Transform the data
  return arrayData.map(item => {
    const record: Record<string, any> = {};
    parameters.forEach(param => {
      // Get the last part of the parameter path
      const parts = param.split('.');
      const lastPart = parts[parts.length - 1];
      
      // If the item directly has the lastPart as a key, use that value
      if (item.hasOwnProperty(lastPart)) {
        record[param] = item[lastPart];
      } else {
        // Otherwise, try to find the value in nested objects
        const value = findValueByKey(item, lastPart);
        record[param] = value;
      }
    });
    return record;
  });
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

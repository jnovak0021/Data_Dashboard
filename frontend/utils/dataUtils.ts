/**
 * Extract and transform data for visualization based on root and parameters
 */
export function transformDataForVisualization(data: any, parameters: string[] = []): Record<string, any>[] {
  if (!data || !parameters.length) return [];

  // If data is not an array, try to find the first array in the structure
  let arrayData = Array.isArray(data) ? data : findFirstArray(data);
  if (!arrayData) return [];

  // Extract the parameter names (last part of the path)
  const paramNames = parameters.map(param => {
    const parts = param.split('.');
    return parts[parts.length - 1];
  });

  // Transform the data
  return arrayData.map(item => {
    const record: Record<string, any> = {};
    parameters.forEach((fullPath, index) => {
      const value = getValueFromPath(item, fullPath);
      record[parameters[index]] = value;
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
 * Get a value from a nested path
 */
function getValueFromPath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (!current) return undefined;
    current = current[part];
  }

  return current;
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
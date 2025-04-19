import React, { useState, useEffect } from 'react';
import ReactJson from 'react18-json-view';

const APIPreview2 = ({ url }: { url: string }) => {
  const [jsonStructure, setJsonStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
          const response = await fetch(url);
          const contentType = response.headers.get('content-type');
      
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
      
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not valid JSON');
          }
          const data = await response.json();

          // Recursively replace values with null
          const extractStructure = (obj: any): any => {
            if (Array.isArray(obj)) {
              return obj.length > 0 ? [extractStructure(obj[0])] : [];
            } else if (typeof obj === 'object' && obj !== null) {
              return Object.fromEntries(
                Object.entries(obj).map(([key, value]) => [key, extractStructure(value)])
              );
            }
            return null;
          };
  
          const structure = extractStructure(data);
          setJsonStructure(structure);
        } catch (e) {
          setError(e as Error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, [url]);


    if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <ReactJson
        src={jsonStructure || {}}
        theme="default"
        collapsed={false}
        enableClipboard={true}
        //displayDataTypes={true}
        //name={false}
      />
    </div>
  );
}

export default APIPreview2;
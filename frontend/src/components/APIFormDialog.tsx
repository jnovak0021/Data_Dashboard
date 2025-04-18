import { useState } from 'react';
import { useRouter } from 'next/router';
import { CiCirclePlus, CiCircleMinus  } from "react-icons/ci";
import { fetchUserId } from "../../utils/auth";
import { APIPreview } from '@/components/APIPreview';

interface APIData {
  apiId: number;
  userId: number;
  apiName: string;
  apiString: string;
  apiKey: string;
  graphType: string;
  paneX: number;
  paneY: number;
  parameters: (string | { parameter: string })[] | null;
}


interface APIFormDialogProps {
  onFormSubmit: () => void;
}

export default function APIFormDialog({ onFormSubmit }: APIFormDialogProps) {
  const router = useRouter();
  const { id: dashboardId } = router.query;
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<APIData>>({
    graphType: 'line',
    paneX: 300,
    paneY: 300,
    parameters: []
  });
  const [newParameter, setNewParameter] = useState('');
  const [jsonString, setJsonString] = useState('');
  const apiUrl = process.env.BACKEND_URL;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [apiKeyParam, setApiKeyParam] = useState('apikey');

  const handleSelectParameters = (parameters: string[]) => {
    setSelectedParams(parameters);
    setFormData(prev => ({
      ...prev,
      parameters: parameters
    }));
    console.log('Selected parameters:', parameters);
  };

  const clearForm : Partial<APIData> = {
    graphType: 'line',
    paneX: 300,
    paneY: 300,
    parameters: [],
  };

  

  const createAPI = async (jsonString: string) => {
    try {
      console.log("Creating API with data:", jsonString);
      const res = await fetch(`http://localhost:8000/api/go/createAPI`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonString,
      });

      if (!res.ok) {
        throw new Error(`Failed to create API: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('API POST Response:', data);
      return data;
      return data;
    } catch (error) {
      console.error('Error creating API:', error);
      throw error;
      throw error;
    }
  };

  const processApiString = (apiString: string, apiKeyParamName: string, apiKey: string): string => {
    if (apiKeyParamName === 'NONE' || !apiKey) {
      return apiString;
    }

    const url = new URL(apiString);
    url.searchParams.append(apiKeyParamName, apiKey);
    return url.toString();
  };
  // Function to add API to dashboard
  const addAPIToDashboard = async (dashboardId: string, apiId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/go/dashboards/${dashboardId}/panes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to add API to dashboard: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('Error adding API to dashboard:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submission started");

    try {
      if (!formData.apiName || !formData.apiString) {
        console.error('Required fields missing');
        return;
      }

      const userId = await fetchUserId();
      if (userId === null) {
        throw new Error('Failed to fetch user ID');
      }

      // Process API string with API key if needed
      const processedApiString = processApiString(
        formData.apiString,
        apiKeyParam,
        formData.apiKey || ''
      );

      const allParameters = [...(formData.parameters || [])];
      console.log("All parameters before formatting:", allParameters);

      const formattedParameters = allParameters.map((param) =>
        typeof param === 'string' ? { parameter: param } : param
      );

      const updatedFormData = {
        userId,
        apiString: processedApiString, // Use the processed API string
        apiName: formData.apiName,
        apiKey: formData.apiKey,
        graphType: formData.graphType,
        paneX: formData.paneX,
        paneY: formData.paneY,
        parameters: formattedParameters,
      };

      console.log("Submitting data:", updatedFormData);
      const jsonString = JSON.stringify(updatedFormData);

      // Call the createAPI function to send the data to the backend
      const createdAPI = await createAPI(jsonString);
      
      // If we're on a dashboard page, add this API to the dashboard
      if (dashboardId && typeof dashboardId === 'string' && createdAPI && createdAPI.apiId) {
        await addAPIToDashboard(dashboardId, createdAPI.apiId);
      }

      // Notify the parent component about the form submission
      onFormSubmit();
      setFormData(clearForm);
      setIsOpen(false);
      
      // Reset form data
      setFormData({
        graphType: 'line',
        paneX: 300,
        paneY: 300,
        parameters: []
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const addParameter = () => {
    if (newParameter.trim()) {
      setFormData(prev => ({
        ...prev,
        parameters: [...(prev.parameters || []), newParameter]
      }));
      setNewParameter('');
    }
  };

  const removeParameter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters?.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground transition-colors duration-200 flex items-center justify-center text-sm font-medium"
      >
        <CiCirclePlus className="text-white" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 text-white bg-black/50 backdrop-blur-sm flex items-center h-screen justify-center z-50">
      <div className="bg-background/95 w-full max-w-[425px] rounded-lg shadow-lg border border-border/50 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Add New API</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200 text-sm font-medium"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="apiName" className="text-right text-sm font-medium text-muted-foreground">
                API Name
              </label>
              <input
                id="apiName"
                required
                className="col-span-3 w-full px-3 py-2 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.apiName || ''}
                onChange={(e) => setFormData({ ...formData, apiName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="apiString" className="text-right text-sm font-medium text-muted-foreground">
                API String
              </label>
              <input
                id="apiString"
                required
                className="col-span-3 w-full px-3 py-2 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.apiString || ''}
                onChange={(e) => setFormData({ ...formData, apiString: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="apiKeyParameter" className="text-right text-sm font-medium text-muted-foreground">
                API Key Parameter Name:
              </label>
              <select
                id="keyParam"
                value={apiKeyParam}
                onChange={(e) => setApiKeyParam(e.target.value)}
                className="col-span-3 w-full px-3 py-2 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option className="bg-background text-white" value="apikey">apikey</option>
                <option className="bg-background text-white" value="api_key">api_key</option>
                <option className="bg-background text-white" value="key">key</option>
                <option className="bg-background text-white" value="Authorization">Authorization</option>
                <option className="bg-background text-white" value="access_token">access_token</option>
                <option className="bg-background text-white" value="token">token</option>
                <option className="bg-background text-white" value="X-API-KEY">X-API-KEY</option>
                <option className="bg-background text-white" value="X-Auth-Token">X-Auth-Token</option>
                <option className="bg-background text-white" value="X-Access-Token">X-Access-Token</option>
                <option className="bg-background text-white" value="auth">auth</option>
                <option className="bg-background text-white" value="NONE">NONE</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="apiKey" className="text-right text-sm font-medium text-muted-foreground">
                API Key
              </label>
              <input
                id="apiKey"
                type="password"
                className="col-span-3 w-full px-3 py-2 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.apiKey || ''}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="graphType" className="text-right text-sm font-medium text-muted-foreground">
                Graph Type
              </label>
              <select
                id="graphType"
                value={formData.graphType}
                onChange={(e) => setFormData({ ...formData, graphType: e.target.value })}
                className="col-span-3 w-full px-3 py-2 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option className="bg-background text-white" value="line">Line</option>
                <option className="bg-background text-white" value="bar">Bar</option>
                <option className="bg-background text-white" value="pie">Pie</option>
                <option className="bg-background text-white" value="scatter">Scatter</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="paneX" className="text-right text-sm font-medium text-muted-foreground">
                Pane X
              </label>
              <input
                id="paneX"
                type="number"
                className="col-span-3 w-full px-3 py-2 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.paneX}
                onChange={(e) => setFormData({ ...formData, paneX: parseInt(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="paneY" className="text-right text-sm font-medium text-muted-foreground">
                Pane Y
              </label>
              <input
                id="paneY"
                type="number"
                className="col-span-3 w-full px-3 py-2 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.paneY}
                onChange={(e) => setFormData({ ...formData, paneY: parseInt(e.target.value) })}
              />
            </div>

            <div className="col-span-4 w-full space-y-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full px-4 py-3 rounded-md border border-input bg-mainPink-500 text-white hover:bg-blue-600 transition-colors text-center font-medium"
              >
                Open API Preview to Select/Deselect Parameters
              </button>

              {selectedParams.length > 0 && (
                <div className="w-full bg-background/50 p-4 rounded-lg shadow border border-border/50">
                  <h2 className="font-semibold mb-2 text-white">Selected Parameters:</h2>
                  <div className="font-mono text-sm text-white/80 break-words">
                    {selectedParams.join(', ')}
                  </div>
                </div>
              )}

              <APIPreview 
                apiUrl={formData.apiString || ""}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelectedParameters={handleSelectParameters}
              />
            </div>

            <div className="w-full space-y-3">
              <label className="block text-sm font-medium text-muted-foreground">Additional Parameters</label>
              <div className="flex gap-2">
                <input
                  value={newParameter}
                  onChange={(e) => setNewParameter(e.target.value)}
                  placeholder="Enter parameter"
                  className="flex-1 px-3 py-2 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParameter())}
                />
                <input 
                  className="px-3 py-2 flex-1 size-10 border border-white bg-transparent rounded-md"
                  placeholder='Value'
                  
                />                                
                <button 
                  type="button"
                  onClick={addParameter}
                  className="px-3 py-2 rounded-md border border-border bg-background hover:bg-primary hover:text-primary-foreground transition-colors duration-200 text-sm font-medium"
                >
                  <CiCirclePlus className="text-white" />
                </button>
              </div>
              <div className="space-y-2 mt-2 max-h-[200px] overflow-y-auto pr-2">
                {formData.parameters?.map((param, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary/70 p-2.5 rounded-lg transition-colors duration-200"
                  >
                    <span className="flex-1 text-sm">{typeof param === 'string' ? param : param.parameter}</span>
                    <button
                      type="button"
                      onClick={() => removeParameter(index)}
                      className="px-2 py-1 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200 text-xs font-medium"
                    >
                      <CiCircleMinus className="text-white" />
                    </button>                    
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className=" justify-end gap-2 pt-2">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-md border border-border bg-background hover:bg-secondary/80 transition-colors duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
            >
              Add API
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
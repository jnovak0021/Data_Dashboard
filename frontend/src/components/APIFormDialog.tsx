import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { CiCirclePlus, CiCircleMinus } from "react-icons/ci";
import { MdModeEdit } from "react-icons/md";
import { fetchUserId } from "@/../utils/auth";
import { APIPreview } from './APIPreview';

interface APIFormDialogProps {
  onFormSubmit: () => void;
  editMode: boolean;
}

export default function APIFormDialog({ onFormSubmit, editMode }: APIFormDialogProps) {
  const router = useRouter();
  const { id: dashboardId } = router.query;
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<{
    apiName?: string;
    apiString?: string;
    apiKey?: string;
    graphType: string;
    paneX: number;
    paneY: number;
    parameters: string[];
    rootKeys: string[];
  }>({
    graphType: 'line',
    paneX: 300,
    paneY: 300,
    parameters: [],
    rootKeys: []
  });
  const [newParameter, setNewParameter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [apiKeyParam, setApiKeyParam] = useState('apikey');
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE;  //contant for the baseURL


  const handleSelectParameters = (parameters: string[]) => {
    setSelectedParams(parameters);
    setFormData(prev => ({
      ...prev,
      parameters: parameters
    }));
    console.log('Selected parameters:', parameters);
  };

  const handleRootKeysSelected = (rootKeys: string[]) => {
    setFormData(prev => ({
      ...prev,
      rootKeys
    }));
    console.log('Selected root keys:', rootKeys);
  };

  const clearForm = {
    graphType: 'line',
    paneX: 300,
    paneY: 300,
    parameters: [],
    rootKeys: []
  };

  const createAPI = async (jsonString: string) => {
    try {
      console.log("Creating API with data:", jsonString);
      const res = await fetch(`${BASE_URL}/api/go/createAPI`, {
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
    } catch (error) {
      console.error('Error creating API:', error);
      throw error;
    }
  };

  const processApiString = (apiString: string, apiKeyParamName: string, apiKey: string): string => {
    if (!apiString) return '';
    if (apiKeyParamName === 'NONE' || !apiKey) {
      return apiString;
    }

    const url = new URL(apiString);
    url.searchParams.append(apiKeyParamName, apiKey);
    return url.toString();
  };
  
  const addAPIToDashboard = async (dashboardId: string, apiId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/go/dashboards/${dashboardId}/panes`, {
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

      const processedApiString = processApiString(
        formData.apiString,
        apiKeyParam,
        formData.apiKey || ''
      );

      const updatedFormData = {
        userId,
        apiString: processedApiString,
        apiName: formData.apiName,
        apiKey: formData.apiKey,
        graphType: formData.graphType,
        paneX: formData.paneX,
        paneY: formData.paneY,
        parameters: formData.parameters.map(param => ({ parameter: param })),
        rootKeys: formData.rootKeys || [],
      };
      

      console.log("Submitting data:", updatedFormData);
      const jsonString = JSON.stringify(updatedFormData);

      const createdAPI = await createAPI(jsonString);
      
      if (dashboardId && typeof dashboardId === 'string' && createdAPI && createdAPI.apiId) {
        await addAPIToDashboard(dashboardId, createdAPI.apiId);
      }

      onFormSubmit();
      setFormData(clearForm);
      setIsOpen(false);
      
      setFormData({
        graphType: 'line',
        paneX: 300,
        paneY: 300,
        parameters: [],
        rootKeys: [],
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
      parameters: (prev.parameters || []).filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={`${!editMode ? 'px-4 py-2 rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground transition-colors duration-200 flex items-center justify-center text-sm font-medium' : ''}`}
      >
        {editMode ? <MdModeEdit/> : <CiCirclePlus className="text-white" />}
      </button>
    );
  }

  return (
    <div className="overflow-y-auto fixed inset-0 text-white bg-black/50 backdrop-blur-sm flex items-center h-screen justify-center z-50">
      <div className="m-5 bg-background/95 w-full max-w-[425px] rounded-lg shadow-lg border border-border/50 p-6">
        <div className="flex mt-20 justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {editMode ? "Edit API" : "Add New API"}
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200 text-sm font-medium"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form fields */}
          <div className="space-y-4">
          </div>
          <div className="grid grid-cols-5 items-center gap-4">
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
              <div className="text-sm text-gray-500">
                <div className="rounded-full bg-gray-700 w-5 h-5 flex items-center justify-center hover:bg-gray-600 cursor-help" title="Enter a descriptive alias name for your API visualization">
                  ?
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 items-center gap-4">
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
              <div className="text-sm text-gray-500">
                <div className="rounded-full bg-gray-700 w-5 h-5 flex items-center justify-center hover:bg-gray-600 cursor-help" title="Enter the URL of the API endpoint you want to visualize.">
                  ?
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-5 items-center gap-4">
              <label htmlFor="apiKeyParameter" className="text-right text-sm font-medium text-muted-foreground">
                API Key Parameter Name
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
              <div className="text-sm text-gray-500">
                <div className="rounded-full bg-gray-700 w-5 h-5 flex items-center justify-center hover:bg-gray-600 cursor-help" title="Specify the name of the query parameter used for your API key, if applicable. If your API doesn't require a key or uses a different authentication method, select 'NONE'.">
                  ?
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 items-center gap-4">
              <label htmlFor="apiKey" className="text-center text-sm font-medium text-muted-foreground">
                API Key
              </label>
              <input
                id="apiKey"
                type="password"
                className="col-span-2 w-full px-3 py-2 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.apiKey || ''}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              />
              <div className="text-sm text-gray-500">
                <div className="rounded-full bg-gray-700 w-5 h-5 flex items-center justify-center hover:bg-gray-600 cursor-help" title="Enter your API key if the API requires one. This will be appended to the API URL based on the parameter name you selected.">
                  ?
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 items-center gap-4">
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
              <div className="text-sm text-gray-500">
                <div className="rounded-full bg-gray-700 w-5 h-5 flex items-center justify-center hover:bg-gray-600 cursor-help" title="Choose the type of graph you want to use to visualize the API data.">
                  ?
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 items-center gap-4">
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
              <div className="text-sm text-gray-500">
                <div className="rounded-full bg-gray-700 w-5 h-5 flex items-center justify-center hover:bg-gray-600 cursor-help" title="Set the initial width for the graph pane on the dashboard.">
                  ?
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 items-center gap-4">
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
              <div className="text-sm text-gray-500">
                <div className="rounded-full bg-gray-700 w-5 h-5 flex items-center justify-center hover:bg-gray-600 cursor-help" title="Set the initial height for the graph pane on the dashboard.">
                  ?
                </div>
              </div>
            </div>

            {formData.rootKeys && formData.rootKeys.length > 0 && (
              <div className="w-full bg-background/50 p-4 rounded-lg shadow border border-border/50">
                <h2 className="font-semibold mb-2 text-white">Selected Root Keys:</h2>
                <div className="font-mono text-sm text-blue-400 break-words">
                  {formData.rootKeys.map((rootKey, index) => (
                    <div key={index} className="flex justify-between items-center py-1 first:pt-0 last:pb-0">
                      <div>
                   
                          <span className="text-xs text-gray-500 ml-1">({rootKey})</span>
                      
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const newKeys = formData.rootKeys.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, rootKeys: newKeys }));
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <CiCircleMinus size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="col-span-4 w-full space-y-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full px-4 py-3 rounded-md border border-input bg-mainPink-500 text-white hover:bg-blue-600 transition-colors text-center font-medium"
              >
                Open API Preview to Select Parameters & Root Keys
              </button>

              {selectedParams.length > 0 && (
                <div className="w-full bg-background/50 p-4 rounded-lg shadow border border-border/50">
                  <h2 className="font-semibold mb-2 text-white">Selected Parameters:</h2>
                  <div className="font-mono text-sm text-white/80 break-words space-y-1">
                    {selectedParams.map((param, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{param}</span>
                        <button 
                          type="button"
                          onClick={() => {
                            const newParams = [...selectedParams];
                            newParams.splice(index, 1);
                            setSelectedParams(newParams);
                            setFormData(prev => ({ ...prev, parameters: newParams }));
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <CiCircleMinus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          
          <APIPreview 
              apiUrl={processApiString(formData.apiString || '', apiKeyParam, formData.apiKey || "")}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSelectedParameters={handleSelectParameters}
              onRootKeysSelected={handleRootKeysSelected}
              initialRootKeys={formData.rootKeys}
              initialSelectedParams={selectedParams}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              {editMode ? "Edit API" : "Add API"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
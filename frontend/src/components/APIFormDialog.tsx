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
          {/* Form fields remain the same */}
          
          <APIPreview 
            apiUrl={processApiString(formData.apiString || '', apiKeyParam, formData.apiKey || "")}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSelectedParameters={handleSelectParameters}
            onRootKeysSelected={handleRootKeysSelected}
            initialRootKeys={formData.rootKeys}
            initialSelectedParams={selectedParams}
          />
        </form>
      </div>
    </div>
  );
}
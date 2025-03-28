

import { useState } from 'react';
import { CiCirclePlus, CiCircleMinus  } from "react-icons/ci";
import { fetchUserId } from "../../utils/auth";

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
    onFormSubmit: () => void; // Callback to notify parent about form submission
}

export default function APIFormDialog({ onFormSubmit }: APIFormDialogProps) {
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


  const createAPI = async (jsonString: string) => {
    try {
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
    } catch (error) {
      console.error('Error creating API:', error);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Fetch the userId
      const userId = await fetchUserId();
      if (userId === null) {
        throw new Error('Failed to fetch user ID');
      }

      // Format the parameters to match the desired structure
      const formattedParameters = (formData.parameters || []).map((param) =>
        typeof param === 'string' ? { parameter: param } : param
      );

      // Create the final JSON structure
      const updatedFormData = {
        userId,
        apiString: formData.apiString,
        apiName: formData.apiName,
        apiKey: formData.apiKey,
        graphType: formData.graphType,
        paneX: formData.paneX,
        paneY: formData.paneY,
        parameters: formattedParameters,
      };

      // Convert the updated form data to a JSON string
      const jsonString = JSON.stringify(updatedFormData);

      // Call the createAPI function to send the data to the backend
      await createAPI(jsonString);

      // Notify the parent component about the form submission
      onFormSubmit();

      // Close the dialog
      setIsOpen(false);
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
    <div className="fixed inset-0 text-white bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
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
                className="col-span-3 w-full px-3 py-2 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.apiString || ''}
                onChange={(e) => setFormData({ ...formData, apiString: e.target.value })}
              />
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

            <div className="space-y-3">
              <label className="block text-sm font-medium text-muted-foreground">Parameters</label>
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
              Add API
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
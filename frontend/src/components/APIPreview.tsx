import React, { useEffect, useState } from 'react';
import { IoChevronDown, IoChevronForward, IoClose } from 'react-icons/io5';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

type DataNode = {
  key: string;
  fullPath: string;
  value: any;
  type: string;
  depth: number;
  isLastChild?: boolean;
  children?: DataNode[];
};

interface APIPreviewModalProps {
  apiUrl: string;
  isOpen: boolean;
  initialRootKeys?: string[];
  initialSelectedParams?: string[];
  onSelectedParameters: (parameters: string[]) => void;
  onRootKeysSelected: (rootKeys: string[]) => void;
  onClose: () => void;
}

export function APIPreview({ 
  apiUrl, 
  isOpen, 
  initialRootKeys = [], 
  initialSelectedParams = [], 
  onClose, 
  onSelectedParameters, 
  onRootKeysSelected 
}: APIPreviewModalProps) {
  const [structure, setStructure] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set(initialSelectedParams));
  const [rootKeys, setRootKeys] = useState<string[]>(initialRootKeys);
  const [isSelectingRoot, setIsSelectingRoot] = useState(false);
  const [rawJson, setRawJson] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStructure();
    }
  }, [isOpen, apiUrl]);

  const fetchStructure = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl);
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not valid JSON');
      }

      const json = await response.json();
      setRawJson(json);

      // Extract the structure (keeping types but not all data)
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

      const structureOnly = extractStructure(json);
      setStructure(structureOnly);
      
      // Initialize root keys if none provided
      if (initialRootKeys.length === 0) {
        if (Array.isArray(json)) {
          const rootKey = 'root';
          setRootKeys([rootKey]);
          onRootKeysSelected([rootKey]);
        } else if (structureOnly && typeof structureOnly === 'object' && Object.keys(structureOnly).length > 0) {
          const topLevelKey = Object.keys(structureOnly)[0];
          const rootKey = topLevelKey;
          setRootKeys([rootKey]);
          onRootKeysSelected([rootKey]);
        }
      }
    } catch (err) {
      setError('Failed to fetch or parse API response');
      console.error('API Preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseDataStructure = (obj: any, parentPath = '', depth = 0): DataNode[] => {
    if (!obj || typeof obj !== 'object') return [];

    if (depth === 0 && Array.isArray(obj)) {
      return [
        {
          key: 'root',
          fullPath: 'root',
          value: obj,
          type: 'array',
          depth: 0,
          children: parseDataStructure(obj[0], 'root', 1)
        }
      ];
    }

    return Object.entries(obj).map(([key, value], index, arr) => {
      const fullPath = parentPath ? `${parentPath}.${key}` : key;
      const type = Array.isArray(value) ? 'array' : typeof value;
      const isLastChild = index === arr.length - 1;

      const node: DataNode = {
        key,
        fullPath,
        value,
        type,
        depth,
        isLastChild,
        children: [],
      };

      if (value !== null && typeof value === 'object') {
        node.children = parseDataStructure(value, fullPath, depth + 1);
      }

      return node;
    });
  };

  const toggleNode = (fullPath: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(fullPath)) {
        next.delete(fullPath);
      } else {
        next.add(fullPath);
      }
      return next;
    });
  };

  const toggleRootKey = (node: DataNode) => {
    const newRootKey = node.fullPath;
    
    setRootKeys((prev) => {
      const exists = prev.includes(newRootKey);
      if (exists) {
        return prev.filter(rk => rk !== newRootKey);
      } else {
        return [...prev, newRootKey];
      }
    });
  };

  const handleNodeClick = (node: DataNode) => {
    if (isSelectingRoot) {
      toggleRootKey(node);
      const updatedRootKeys = rootKeys.includes(node.fullPath)
        ? rootKeys.filter(rk => rk !== node.fullPath)
        : [...rootKeys, node.fullPath];
      onRootKeysSelected(updatedRootKeys);
    } else {
      setSelectedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(node.fullPath)) {
          next.delete(node.fullPath);
        } else {
          next.add(node.fullPath);
        }
        return next;
      });
    }
  };

  const handleSave = () => {
    const selectedParameters = Array.from(selectedNodes);
    onSelectedParameters(selectedParameters);
    onRootKeysSelected(rootKeys);
    onClose();
  };

  const renderNode = (node: DataNode) => {
    const isExpanded = expandedNodes.has(node.fullPath);

    return (
      <div key={node.fullPath} className="relative">
        <div
          className="flex items-start"
          style={{ paddingLeft: `${node.depth * 1.5}rem` }}
        >
          <div className="flex items-center w-full gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleNode(node.fullPath);
              }}
              className="p-1 hover:bg-gray-600 rounded mr-1 flex items-center justify-center"
            >
              {node.children?.length ? (
                expandedNodes.has(node.fullPath) ? (
                  <IoChevronDown className="w-4 h-4" />
                ) : (
                  <IoChevronForward className="w-4 h-4" />
                )
              ) : null}
            </button>
            <div
              className={`flex-1 rounded transition-colors cursor-pointer py-1 px-2
                ${selectedNodes.has(node.fullPath) ? 'bg-gray-800' : 'hover:bg-gray-700'}
                ${rootKeys.includes(node.fullPath) ? 'border-l-4 border-orange-500 bg-orange-500/10' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNodeClick(node);
              }}
            >
              <span className="font-medium">{node.key}</span>
              <span className="mx-1">:</span>
              <span className={`italic text-gray-400`}>
                {node.type}
              </span>
            </div>
          </div>
        </div>
        
        {node.children && isExpanded && (
          <div className="relative">
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">API Preview</h1>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <AiOutlineLoading3Quarters className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="text-red-500 text-center py-6">{error}</div>
            </div>
          ) : (
            <div className="p-4">
              {structure ? (
                parseDataStructure(structure).map((node) => renderNode(node))
              ) : (
                <div className="text-gray-500 italic">No data to display</div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
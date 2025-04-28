import React, { useEffect, useState } from 'react';
import { IoChevronDown, IoChevronForward, IoClose } from 'react-icons/io5';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { RootKeyData } from '@/../utils/dataUtils';

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
  initialRootKeys?: String[];
  initialSelectedParams?: string[];
  onSelectedParameters: (parameters: string[]) => void;
  onRootKeysSelected: (rootKeys: String[]) => void;
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
  const [rootKeys, setRootKeys] = useState<String[]>(initialRootKeys);
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
          const rootKey: RootKeyData = { key: 'root', path: 'root' };
          setRootKeys([rootKey]);
          onRootKeysSelected([rootKey]);
        } else if (structureOnly && typeof structureOnly === 'object' && Object.keys(structureOnly).length > 0) {
          const topLevelKey = Object.keys(structureOnly)[0];
          const rootKey: RootKeyData = { key: topLevelKey, path: topLevelKey };
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

  // Parse data structure into a tree of nodes with full paths
  const parseDataStructure = (obj: any, parentPath = '', depth = 0): DataNode[] => {
    if (!obj || typeof obj !== 'object') return [];

    // Special handling for root arrays
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

  // Get the root key that contains a given path
  const getRootKeyForPath = (path: string): RootKeyData | undefined => {
    return rootKeys.find(rootKey => path.startsWith(rootKey.path));
  };

  // Get path relative to its root key
  const getRelativePath = (fullPath: string): string => {
    const rootKey = getRootKeyForPath(fullPath);
    if (rootKey) {
      if (fullPath === rootKey.path) return '';
      
      // Return the path without the root prefix
      const relativePath = fullPath.slice(rootKey.path.length);
      return relativePath.startsWith('.') ? relativePath.slice(1) : relativePath;
    }
    return fullPath;
  };

  // Flatten tree for easier processing
  const flattenNodes = (nodes: DataNode[]): DataNode[] => {
    return nodes.reduce((acc: DataNode[], node) => {
      acc.push(node);
      if (node.children && node.children.length > 0) {
        acc.push(...flattenNodes(node.children));
      }
      return acc;
    }, []);
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
    const newRootKey: RootKeyData = { key: node.key, path: node.fullPath };
    
    setRootKeys((prev) => {
      // Check if this root key already exists
      const exists = prev.some(rk => rk.path === node.fullPath);
      
      if (exists) {
        // Remove it if it exists
        return prev.filter(rk => rk.path !== node.fullPath);
      } else {
        // Add it if it doesn't exist
        return [...prev, newRootKey];
      }
    });
  };

  const handleNodeClick = (node: DataNode) => {
    if (isSelectingRoot) {
      // Toggle this node as a root key
      toggleRootKey(node);
      
      // Update root keys in parent component
      const updatedRootKeys = rootKeys.some(rk => rk.path === node.fullPath)
        ? rootKeys.filter(rk => rk.path !== node.fullPath)
        : [...rootKeys, { key: node.key, path: node.fullPath }];
      
      onRootKeysSelected(updatedRootKeys);
    } else {
      // Toggle this node as a selected parameter
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
    // Convert selected nodes to parameters with full paths for proper identification
    const selectedParameters = Array.from(selectedNodes);
    
    onSelectedParameters(selectedParameters);
    onRootKeysSelected(rootKeys);
    onClose();
  };

  const SelectRoot = () => {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsSelectingRoot(!isSelectingRoot);
        }}
        className={`px-4 py-2 rounded-md transition-colors ${
          isSelectingRoot 
            ? 'bg-orange-600 text-white hover:bg-orange-700' 
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
      >
        {isSelectingRoot ? 'Selecting Root Keys...' : 'Select Root Keys'}
      </button>
    );
  };

  const ExpandCollapseButton = ({ node }: { node: DataNode }) => {
    const isExpanded = expandedNodes.has(node.fullPath);
    if (!node.children?.length) return null;

    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleNode(node.fullPath);
        }}
        className="p-1 hover:bg-gray-600 rounded mr-1 flex items-center justify-center"
      >
        {isExpanded ? <IoChevronDown className="w-4 h-4" /> : <IoChevronForward className="w-4 h-4" />}
      </button>
    );
  };

  const NodeContent = ({ node }: { node: DataNode }) => {
    const isSelected = selectedNodes.has(node.fullPath);
    const isRootKey = rootKeys.some(rk => rk.path === node.fullPath);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div 
        className={`flex-1 rounded transition-colors cursor-pointer py-1 px-2
          ${isSelectingRoot ? 'hover:bg-orange-700/30' : isSelected ? 'bg-gray-800' : 'hover:bg-gray-700'}
          ${isRootKey ? 'border-l-4 border-orange-500 bg-orange-500/10' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNodeClick(node);
        }}
      >
        <span className="font-medium">{node.key}</span>
        <span className="mx-1">:</span>
        <span className={`${hasChildren ? 'italic text-gray-400' : 'text-gray-500'} ${node.type === 'array' ? 'text-blue-400' : node.type === 'object' ? 'text-green-400' : 'text-yellow-400'}`}>
          {hasChildren ? `(${node.type})` : node.type}
        </span>
        
        {/* Show full path in small text for context */}
        {node.depth > 1 && (
          <span className="ml-2 text-xs text-gray-500 opacity-60">
            {node.fullPath}
          </span>
        )}
      </div>
    );
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
            <ExpandCollapseButton node={node} />
            <NodeContent node={node} />
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

  const renderSelectedNodes = () => {
    if (selectedNodes.size === 0) {
      return (
        <div className="italic px-4 py-3 bg-gray-800 rounded border border-gray-700">
          Click on any element in the explorer to select it
        </div>
      );
    }

    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 font-mono">
        {Array.from(selectedNodes).map((path, index) => {
          // Find which root this parameter belongs to
          const rootKey = getRootKeyForPath(path);
          const rootPrefix = rootKey ? rootKey.path : '';
          const relPath = getRelativePath(path);
          
          const displayPath = rootPrefix ? `${rootKey?.key}.${relPath}` : path;
          
          return (
            <div key={path} className="flex items-center justify-between gap-2 mb-1 last:mb-0">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">{index + 1}.</span>
                <span className="text-white">{displayPath}</span>
                <span className="text-gray-500 text-xs">(full: {path})</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedNodes(prev => {
                    const next = new Set(prev);
                    next.delete(path);
                    return next;
                  });
                }}
                className="text-red-400 hover:text-red-300"
              >
                <IoClose size={16} />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRootKeys = () => {
    if (rootKeys.length === 0) {
      return (
        <div className="italic px-4 py-3 bg-gray-800 rounded border border-gray-700">
          No root keys selected
        </div>
      );
    }
    
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 font-mono">
        <span className="text-orange-400 mr-2">Root Keys:</span>
        {rootKeys.map((rootKey, index) => (
          <div key={`${rootKey.path}-${index}`} className="flex items-center gap-2 mt-1 first:mt-0">
            <span className="text-yellow-500">{index + 1}.</span>
            <div className="flex flex-col">
              <span className="text-white">{rootKey.key}</span>
              <span className="text-gray-500 text-xs">Path: {rootKey.path}</span>
            </div>
            <button 
              onClick={() => {
                const newRootKeys = rootKeys.filter((_, i) => i !== index);
                setRootKeys(newRootKeys);
                onRootKeysSelected(newRootKeys);
              }}
              className="text-red-400 hover:text-red-300 ml-auto"
            >
              <IoClose size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-white">API Preview</h1>
            <div className="text-sm px-2 py-1 bg-gray-800 rounded font-mono text-gray-300 truncate max-w-[400px]">
              {apiUrl}
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <AiOutlineLoading3Quarters className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="text-red-500 text-center py-6">{error}</div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-2 mx-auto"
              >
                <IoClose className="w-5 h-5" />
                Close
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-gray-700">
              <div className="p-4">
                <div className="font-mono text-sm bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="mb-2 px-3 py-2 bg-gray-800 text-xs">
                    {isSelectingRoot ? (
                      <span className="text-orange-400">Click elements to select root keys (multiple allowed)</span>
                    ) : (
                      <span className="text-blue-400">Click elements to select parameters for visualization</span>
                    )}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                    {parseDataStructure(structure).map((node) => renderNode(node))}
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400">SELECTED ROOT KEYS</h3>
                  {renderRootKeys()}
                  <div className="text-xs text-gray-500 italic">
                    Root keys define the starting points for data extraction.
                    Select multiple root keys to combine data from different parts of the JSON.
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400">SELECTED PARAMETERS</h3>
                  {renderSelectedNodes()}
                  <div className="text-xs text-gray-500 italic">
                    Parameters are the specific data points you want to visualize.
                    Full paths are used internally to avoid name collisions between different roots.
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <SelectRoot />
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    Save Selections
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <IoClose className="w-5 h-5" />
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
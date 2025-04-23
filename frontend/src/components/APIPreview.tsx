import React, { useEffect, useState } from 'react';
import { IoChevronDown, IoChevronForward } from 'react-icons/io5';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { IoClose } from 'react-icons/io5';

type DataNode = {
  key: string;
  value: any;
  type: string;
  depth: number;
  isLastChild?: boolean;
  children?: DataNode[];
};

interface APIPreviewModalProps {
  apiUrl: string;
  isOpen: boolean;
  initialRootKey?: string;
  initialSelectedParams?: string[];
  onSelectedParameters: (parameters: string[]) => void;
  onRootKeySelected: (rootKey: string) => void;
  onClose: () => void;
}

export function APIPreview({ 
  apiUrl, 
  isOpen, 
  initialRootKey = '', 
  initialSelectedParams = [], 
  onClose, 
  onSelectedParameters, 
  onRootKeySelected 
}: APIPreviewModalProps) {
  const [structure, setStructure] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set(initialSelectedParams));
  const [rootKey, setRootKey] = useState<string>(initialRootKey);
  const [isSelectingRoot, setIsSelectingRoot] = useState(false);

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
      
      // Only set default root key if none was provided
      if (!initialRootKey) {
        if (Array.isArray(json)) {
          setRootKey('root');
          onRootKeySelected('root');
        } else if (structureOnly && typeof structureOnly === 'object' && Object.keys(structureOnly).length > 0) {
          const topLevelKey = Object.keys(structureOnly)[0];
          setRootKey(topLevelKey);
          onRootKeySelected(topLevelKey);
        }
      }
    } catch (err) {
      setError('Failed to fetch structure');
    } finally {
      setLoading(false);
    }
  };

  const parseDataStructure = (obj: any, parentKey = '', depth = 0): DataNode[] => {
    if (!obj || typeof obj !== 'object') return [];

    // Handle array at root level
    if (depth === 0 && Array.isArray(obj)) {
      return [
        {
          key: 'root',
          value: obj,
          type: 'array',
          depth: 0,
          children: parseDataStructure(obj[0], 'root', 1)
        }
      ];
    }

    return Object.entries(obj).map(([key, value], index, arr) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      const type = Array.isArray(value) ? 'array' : typeof value;
      const isLastChild = index === arr.length - 1;

      const node: DataNode = {
        key: fullKey,
        value,
        type,
        depth,
        isLastChild,
        children: [],
      };

      if (value !== null && typeof value === 'object') {
        node.children = parseDataStructure(value, fullKey, depth + 1);
      }

      return node;
    });
  };

  const getRelativePath = (fullPath: string): string => {
    if (!rootKey || !fullPath.startsWith(rootKey)) return fullPath;
    const relativePath = fullPath.slice(rootKey.length);
    return relativePath.startsWith('.') ? relativePath.slice(1) : relativePath;
  };

  const flattenNodes = (nodes: DataNode[]): DataNode[] => {
    return nodes.reduce((acc: DataNode[], node) => {
      acc.push(node);
      if (node.children && node.children.length > 0) {
        acc.push(...flattenNodes(node.children));
      }
      return acc;
    }, []);
  };

  const toggleNode = (key: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleNodeClick = (node: DataNode) => {
    if (isSelectingRoot) {
      setRootKey(node.key);
      onRootKeySelected(node.key);
      setIsSelectingRoot(false);
    } else {
      setSelectedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(node.key)) {
          next.delete(node.key);
        } else {
          next.add(node.key);
        }
        return next;
      });
    }
  };

  const handleSave = () => {
    const flatNodes = flattenNodes(parseDataStructure(structure));
    const selectedParameters = Array.from(selectedNodes)
      .map(key => getRelativePath(key))
      .filter(Boolean);

    onSelectedParameters(selectedParameters);
    onClose();
  };

  const ExpandCollapseButton = ({ node }: { node: DataNode }) => {
    const isExpanded = expandedNodes.has(node.key);
    if (!node.children?.length) return null;

    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleNode(node.key);
        }}
        className="p-1 hover:bg-gray-600 rounded mr-1 flex items-center justify-center"
      >
        {isExpanded ? <IoChevronDown className="w-4 h-4" /> : <IoChevronForward className="w-4 h-4" />}
      </button>
    );
  };

  const NodeContent = ({ node }: { node: DataNode }) => {
    const isSelected = selectedNodes.has(node.key);
    const isRootKey = rootKey === node.key;
    const displayKey = node.key.split('.').pop();
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
        <span className="font-medium">{displayKey}</span>
        <span className="mx-1">:</span>
        <span className={hasChildren ? 'italic text-gray-400' : 'text-gray-500'}>
          {hasChildren ? `(${node.type})` : 'null'}
        </span>
      </div>
    );
  };

  const renderNode = (node: DataNode) => {
    const isExpanded = expandedNodes.has(node.key);

    return (
      <div key={node.key} className="relative">
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

  const renderSelectedNodes = (dataStructure: DataNode[]) => {
    if (selectedNodes.size === 0) {
      return (
        <div className="italic px-4 py-3 bg-gray-800 rounded border border-gray-700">
          Click on any element in the explorer to select it
        </div>
      );
    }

    const flatNodes = flattenNodes(dataStructure);
    const selectedElements = Array.from(selectedNodes)
      .map(key => getRelativePath(key))
      .filter(Boolean)
      .join(', ');
    
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 font-mono">
        {selectedElements}
      </div>
    );
  };

  const renderRootKey = () => {
    if (!rootKey) {
      return (
        <div className="italic px-4 py-3 bg-gray-800 rounded border border-gray-700">
          No root key selected
        </div>
      );
    }
    
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 font-mono">
        <span className="text-orange-400 mr-2">Root Key:</span>
        {rootKey}
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
            <div className="text-sm px-2 py-1 bg-gray-800 rounded font-mono text-gray-300">
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
            <>
              <div className="text-red-500 text-center py-12">{error}</div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <IoClose className="w-5 h-5" />
                Close
              </button>
            </>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-gray-700">
              <div className="p-4">
                <div className="font-mono text-sm bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="mb-2 px-3 py-2 bg-gray-800 text-xs">
                    {isSelectingRoot ? (
                      <span className="text-orange-400">Click an element to set as root key</span>
                    ) : (
                      'Click elements to select parameters'
                    )}
                  </div>
                  {parseDataStructure(structure).map((node) => renderNode(node))}
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400">SELECTED ROOT KEY</h3>
                  {renderRootKey()}
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400">SELECTED PARAMETERS</h3>
                  {renderSelectedNodes(parseDataStructure(structure))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsSelectingRoot(true)}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      isSelectingRoot 
                        ? 'bg-orange-600 text-white hover:bg-orange-700' 
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {isSelectingRoot ? 'Selecting Root Key...' : 'Select Root Key'}
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    Save
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
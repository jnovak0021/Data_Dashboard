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
  onSelectedParameters: (parameters: string[]) => void;
  onClose: () => void;
}

export function APIPreview({ apiUrl, isOpen, onClose, onSelectedParameters }: APIPreviewModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, apiUrl]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl);
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const parseDataStructure = (obj: any, parentKey = '', depth = 0): DataNode[] => {
    if (!obj || typeof obj !== 'object') return [];

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

  const toggleSelection = (node: DataNode) => {
    setSelectedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(node.key)) {
        next.delete(node.key);
      } else {
        next.add(node.key);
      }
      return next;
    });
  };

  const handleSave = () => {
    const flatNodes = flattenNodes(parseDataStructure(data));
    const selectedParameters = Array.from(selectedNodes)
      .map(key => {
        const node = flatNodes.find(n => n.key === key);
        //return node?.key.split('.').pop();
        return node?.key;
      })
      .filter((param): param is string => param !== undefined);
    
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
        {isExpanded ? (
          <IoChevronDown className="w-4 h-4" />
        ) : (
          <IoChevronForward className="w-4 h-4" />
        )}
      </button>
    );
  };

  const NodeContent = ({ node }: { node: DataNode }) => {
    const isSelected = selectedNodes.has(node.key);
    const keyParts = node.key.split('.');
    const displayKey = keyParts[keyParts.length - 1];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div 
        className={`flex-1 rounded transition-colors cursor-pointer py-1 px-2
          ${isSelected ? 'bg-gray-800' : 'hover:bg-gray-700'}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleSelection(node);
        }}
      >
        <span className="font-medium">{displayKey}</span>
        <span className="mx-1">:</span>
        <span className={hasChildren ? 'italic' : ''}>
          {hasChildren ? `(${node.type})` : String(node.value)}
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
      .map(key => {
        const node = flatNodes.find(n => n.key === key);
        return node?.key.split('.').pop();
      })
      .filter(Boolean)
      .join(', ');
    
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 font-mono">
        {selectedElements}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center">
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
              <AiOutlineLoading3Quarters className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-12">{error}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-gray-700">
              <div className="p-4">
                <div className="font-mono text-sm bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                  {parseDataStructure(data).map((node) => renderNode(node))}
                </div>
              </div>
              <div className="p-4 space-y-4">
                {renderSelectedNodes(parseDataStructure(data))}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
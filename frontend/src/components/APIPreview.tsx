import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, X } from 'lucide-react';

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
export function APIPreview({ apiUrl, isOpen, onClose, onSelectParameters}: APIPreviewModalProps) {
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

  const toggleNode = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const toggleSelection = (node: DataNode, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const removeSelection = (key: string) => {
    setSelectedNodes((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const renderNode = (node: DataNode) => {
    const isExpanded = expandedNodes.has(node.key);
    const isSelected = selectedNodes.has(node.key);
    const hasChildren = node.children && node.children.length > 0;
    const keyParts = node.key.split('.');
    const displayKey = keyParts[keyParts.length - 1];

    return (
      <div key={node.key} className=" bg-background relative">
        <div
          className="flex items-start"
          style={{ paddingLeft: `${node.depth * 1.5}rem` }}
        >
          <div className="relative flex items-center w-full">
            <div 
              className={`flex items-center rounded transition-colors cursor-pointer py-1 px-2 w-full
                ${isSelected ? 'bg-gray-800' : 'hover:bg-gray-100'}`}
              onClick={(e) => toggleSelection(node, e)}
            >
              {hasChildren && (
                <button
                  onClick={(e) => toggleNode(node.key, e)}
                  className="p-0.5 hover:bg-gray-200 rounded mr-1"
                >
                  {/* {isExpanded ? (
                    // <ChevronDown className="w-4 h-4" />
                  ) : (
                    // <ChevronRight className="w-4 h-4" />
                  )} */}
                </button>
              )}
              <span className="font-medium">{displayKey}</span>
              <span className="mx-1">:</span>
              <span className={hasChildren ? 'italic' : ''}>
                {hasChildren ? `(${node.type})` : String(node.value)}
              </span>
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="relative">
            {node.children!.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  const renderSelectedNodes = (dataStructure: DataNode[]) => {
    if (selectedNodes.size === 0) {
      return (
        <div className="italic px-4 py-3 bg-background-50 rounded border border-gray-200">
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
      <div className="bg-background-50 rounded-lg border border-gray-200 p-4 font-mono">
        {selectedElements}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bg-background inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-background-50">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">API Preview</h1>
            <div className="text-sm px-2 py-1 bg-background-200 rounded font-mono">
              {apiUrl}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
          >
            {/* <X className="w-5 h-5" /> */}
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              {/* <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> */}
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-12">{error}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-gray-200">
              <div className="p-4">
                <div className="font-mono text-sm bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  {parseDataStructure(data).map((node) => renderNode(node))}
                </div>
              </div>
              <div className="p-4">
                {renderSelectedNodes(parseDataStructure(data))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
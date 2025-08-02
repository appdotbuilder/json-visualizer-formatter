
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

interface JsonTreeViewProps {
  jsonString: string;
}

interface TreeNodeProps {
  data: JsonValue;
  keyName?: string;
  level?: number;
  isArrayItem?: boolean;
  arrayIndex?: number;
}

function TreeNode({ data, keyName, level = 0, isArrayItem = false, arrayIndex }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const getDataType = (value: JsonValue): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-green-600';
      case 'number': return 'text-blue-600';
      case 'boolean': return 'text-purple-600';
      case 'null': return 'text-gray-500';
      case 'object': return 'text-orange-600';
      case 'array': return 'text-indigo-600';
      default: return 'text-gray-700';
    }
  };

  const formatValue = (value: JsonValue): string => {
    if (typeof value === 'string') return `"${value}"`;
    if (value === null) return 'null';
    return String(value);
  };

  const dataType = getDataType(data);
  const isExpandable = dataType === 'object' || dataType === 'array';
  const displayKey = isArrayItem ? `[${arrayIndex}]` : keyName;

  if (!isExpandable) {
    return (
      <div className="flex items-center py-1" style={{ paddingLeft: `${level * 20}px` }}>
        <div className="w-4"></div>
        {displayKey && (
          <span className="text-gray-800 font-medium mr-2">
            {displayKey}:
          </span>
        )}
        <span className={`${getTypeColor(dataType)} font-mono`}>
          {formatValue(data)}
        </span>
        <span className="text-xs text-gray-400 ml-2">
          ({dataType})
        </span>
      </div>
    );
  }

  const entries = dataType === 'array' 
    ? (data as JsonArray).map((item: JsonValue, index: number) => [index, item] as const)
    : Object.entries(data as JsonObject);

  return (
    <div>
      <div className="flex items-center py-1 hover:bg-gray-100 rounded" style={{ paddingLeft: `${level * 20}px` }}>
        <Button
          variant="ghost"
          size="sm"
          className="w-4 h-4 p-0 mr-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </Button>
        {displayKey && (
          <span className="text-gray-800 font-medium mr-2">
            {displayKey}:
          </span>
        )}
        <span className={`${getTypeColor(dataType)} font-medium`}>
          {dataType === 'array' ? `Array[${(data as JsonArray).length}]` : 'Object'}
        </span>
        <span className="text-xs text-gray-400 ml-2">
          ({entries.length} {entries.length === 1 ? 'item' : 'items'})
        </span>
      </div>
      
      {isExpanded && (
        <div>
          {entries.map(([key, value]) => (
            <TreeNode
              key={String(key)}
              data={value}
              keyName={dataType === 'object' ? String(key) : undefined}
              level={level + 1}
              isArrayItem={dataType === 'array'}
              arrayIndex={dataType === 'array' ? Number(key) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function JsonTreeView({ jsonString }: JsonTreeViewProps) {
  const [expandAll, setExpandAll] = useState(false);

  let parsedData: JsonValue;
  try {
    parsedData = JSON.parse(jsonString) as JsonValue;
  } catch (error) {
    return (
      <div className="text-red-600 font-mono">
        Error parsing JSON: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="font-mono text-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="font-semibold text-gray-700">JSON Tree Structure</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setExpandAll(!expandAll);
              // Force re-render by updating key - this is a simple approach
              window.location.hash = expandAll ? 'collapse' : 'expand';
            }}
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>
      </div>
      
      <div className="space-y-1">
        <TreeNode data={parsedData} />
      </div>
    </div>
  );
}

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Router, Network, Smartphone, Laptop, Tv, Monitor, Cpu, Wifi, Radio, Home, Camera } from 'lucide-react';

// Wrapper for consistent styling
const NodeWrapper = ({ 
  children, 
  selected, 
  colorClass, 
  borderColorClass,
  data
}: { 
  children: React.ReactNode; 
  selected?: boolean; 
  colorClass: string;
  borderColorClass: string;
  data: any;
}) => {
  const isFloorPlan = data.viewMode === 'floorplan';

  if (isFloorPlan) {
    // Helper to extract the icon from children and exclude Handles
    const getIconFromChildren = () => {
      if (Array.isArray(children)) {
        // Find the div that is NOT a Handle and likely contains the icon
        const iconContainer = children.find(child => 
          React.isValidElement(child) && 
          child.type !== Handle && 
          (child.type === 'div' || child.props.className?.includes('rounded-full'))
        );
        return iconContainer || children.find(c => React.isValidElement(c) && c.type !== Handle) || children[0];
      }
      return children;
    };

    return (
      <div className={`relative group transition-all`}>
        {/* We do NOT render any Handles here in floor plan mode */}
        <div className={`w-12 h-12 rounded-full bg-white border-2 flex items-center justify-center shadow-lg transition-all
          ${selected ? 'border-blue-500 scale-110' : borderColorClass}
        `}>
          <div className={`${colorClass}`}>
            {getIconFromChildren()}
          </div>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-xl flex flex-col items-center">
            <span className="font-bold">{data.label}</span>
            {data.ip && <span>{data.ip}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 w-[200px] transition-all
      ${selected ? 'border-blue-500 shadow-lg' : borderColorClass}
    `}>
      <div className={`flex items-center gap-2 ${colorClass} overflow-hidden`}>
        {children}
      </div>
      <div className="flex flex-col mt-1 pt-1 border-t border-gray-50 overflow-hidden">
          {data.model && (
            <div className="text-[10px] text-gray-600 font-medium truncate" title={data.model}>
              型号: {data.model}
            </div>
          )}
          {data.ip && (
            <div className="text-[10px] text-blue-500 font-mono truncate">
              IP: {data.ip}
            </div>
          )}
          {data.area && (
            <div className="text-[10px] text-gray-400 italic truncate" title={data.area}>
              区域: {data.area}
            </div>
          )}
        </div>
    </div>
  );
};

export const CameraNode = memo(({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper selected={selected} colorClass="text-slate-600" borderColorClass="border-gray-200" data={data}>
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-slate-400 border-2 border-white" />
      <div className="p-2 bg-slate-100 rounded-full">
        <Camera size={20} />
      </div>
      <div className="overflow-hidden">
        <div className="text-sm font-bold text-gray-900 truncate" title={data.label}>{data.label}</div>
        <div className="text-[10px] text-gray-400">监控摄像头</div>
      </div>
    </NodeWrapper>
  );
});

export const GatewayNode = memo(({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper selected={selected} colorClass="text-indigo-600" borderColorClass="border-gray-200" data={data}>
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-indigo-400 border-2 border-white" />
      <div className="p-2 bg-indigo-100 rounded-full">
        <Radio size={20} />
      </div>
      <div className="overflow-hidden">
        <div className="text-sm font-bold text-gray-900 truncate" title={data.label}>{data.label}</div>
        <div className="text-[10px] text-gray-400">智能网关</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-indigo-500 border-2 border-white" />
    </NodeWrapper>
  );
});

export const SmartHomeNode = memo(({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper selected={selected} colorClass="text-rose-600" borderColorClass="border-gray-200" data={data}>
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-rose-400 border-2 border-white" />
      <div className="p-2 bg-rose-100 rounded-full">
        <Home size={20} />
      </div>
      <div className="overflow-hidden">
        <div className="text-sm font-bold text-gray-900 truncate" title={data.label}>{data.label}</div>
        <div className="text-[10px] text-gray-400">智能设备</div>
      </div>
    </NodeWrapper>
  );
});

export const ModemNode = memo(({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper selected={selected} colorClass="text-orange-600" borderColorClass="border-gray-200" data={data}>
      <div className="p-2 bg-orange-100 rounded-full">
        <Cpu size={20} />
      </div>
      <div className="overflow-hidden">
        <div className="text-sm font-bold text-gray-900 truncate" title={data.label}>{data.label}</div>
        <div className="text-[10px] text-gray-400">光猫</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-orange-500 border-2 border-white" />
    </NodeWrapper>
  );
});

export const WifiNode = memo(({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper selected={selected} colorClass="text-cyan-600" borderColorClass="border-gray-200" data={data}>
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-cyan-400 border-2 border-white" />
      <div className="p-2 bg-cyan-100 rounded-full">
        <Wifi size={20} />
      </div>
      <div className="overflow-hidden">
        <div className="text-sm font-bold text-gray-900 truncate" title={data.label}>{data.label}</div>
        <div className="text-[10px] text-gray-400">WiFi 节点</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-cyan-500 border-2 border-white" />
    </NodeWrapper>
  );
});

export const RouterNode = memo(({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper selected={selected} colorClass="text-blue-600" borderColorClass="border-gray-200" data={data}>
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-blue-400 border-2 border-white" />
      <div className="p-2 bg-blue-100 rounded-full">
        <Router size={20} />
      </div>
      <div className="overflow-hidden">
        <div className="text-sm font-bold text-gray-900 truncate" title={data.label}>{data.label}</div>
        <div className="text-[10px] text-gray-400">路由器</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-blue-500 border-2 border-white" />
    </NodeWrapper>
  );
});

export const SwitchNode = memo(({ data, selected }: NodeProps) => {
  return (
    <NodeWrapper selected={selected} colorClass="text-green-600" borderColorClass="border-gray-200" data={data}>
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-green-400 border-2 border-white" />
      <div className="p-2 bg-green-100 rounded-full">
        <Network size={20} />
      </div>
      <div className="overflow-hidden">
        <div className="text-sm font-bold text-gray-900 truncate" title={data.label}>{data.label}</div>
        <div className="text-[10px] text-gray-400">交换机</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-green-500 border-2 border-white" />
    </NodeWrapper>
  );
});

export const DeviceNode = memo(({ data, selected }: NodeProps) => {
  const getIcon = () => {
    switch (data.type) {
      case 'mobile': return <Smartphone size={20} />;
      case 'tv': return <Tv size={20} />;
      case 'desktop': return <Monitor size={20} />;
      default: return <Laptop size={20} />;
    }
  };

  const getDeviceTypeName = () => {
    switch (data.type) {
      case 'mobile': return '手机';
      case 'tv': return '电视';
      case 'desktop': return '台式机';
      default: return '笔记本';
    }
  };

  return (
    <NodeWrapper selected={selected} colorClass="text-purple-600" borderColorClass="border-gray-200" data={data}>
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-purple-400 border-2 border-white" />
      <div className="p-2 bg-purple-100 rounded-full">
        {getIcon()}
      </div>
      <div className="overflow-hidden">
        <div className="text-sm font-bold text-gray-900 truncate" title={data.label}>{data.label}</div>
        <div className="text-[10px] text-gray-400">{getDeviceTypeName()}</div>
      </div>
    </NodeWrapper>
  );
});

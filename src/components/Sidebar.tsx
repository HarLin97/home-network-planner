import React from 'react';
import { 
  Cpu, 
  Router, 
  Wifi, 
  Network, 
  Laptop, 
  Radio, 
  Home, 
  Camera 
} from 'lucide-react';

export const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const devices = [
    { type: 'modemNode', label: '光猫', icon: <Cpu size={18} />, color: 'bg-orange-500', hover: 'hover:bg-orange-50 hover:border-orange-200' },
    { type: 'routerNode', label: '路由器', icon: <Router size={18} />, color: 'bg-blue-500', hover: 'hover:bg-blue-50 hover:border-blue-200' },
    { type: 'wifiNode', label: 'WiFi 节点', icon: <Wifi size={18} />, color: 'bg-cyan-500', hover: 'hover:bg-cyan-50 hover:border-cyan-200' },
    { type: 'switchNode', label: '交换机', icon: <Network size={18} />, color: 'bg-green-500', hover: 'hover:bg-green-50 hover:border-green-200' },
    { type: 'deviceNode', label: '终端设备', icon: <Laptop size={18} />, color: 'bg-purple-500', hover: 'hover:bg-purple-50 hover:border-purple-200' },
    { type: 'gatewayNode', label: '智能网关', icon: <Radio size={18} />, color: 'bg-indigo-500', hover: 'hover:bg-indigo-50 hover:border-indigo-200' },
    { type: 'smartHomeNode', label: '智能家居', icon: <Home size={18} />, color: 'bg-rose-500', hover: 'hover:bg-rose-50 hover:border-rose-200' },
    { type: 'cameraNode', label: '监控摄像头', icon: <Camera size={18} />, color: 'bg-slate-500', hover: 'hover:bg-slate-50 hover:border-slate-200' },
  ];

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 p-4 flex flex-col gap-3 overflow-y-auto shadow-inner">
      <div className="mb-2">
        <div className="text-lg font-bold text-gray-800">设备库</div>
        <div className="text-xs text-gray-500">将设备拖拽至画布进行部署</div>
      </div>

      <div className="flex flex-col gap-2">
        {devices.map((device) => (
          <div
            key={device.type}
            className={`flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-grab transition-all duration-200 group ${device.hover} hover:shadow-sm`}
            onDragStart={(event) => onDragStart(event, device.type, device.label)}
            draggable
          >
            <div className={`w-9 h-9 rounded-full ${device.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
              {device.icon}
            </div>
            <span className="font-medium text-gray-700 text-sm">{device.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

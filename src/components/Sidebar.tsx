import React from 'react';

export const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
      <div className="text-lg font-bold text-gray-800">设备库</div>
      <div className="text-sm text-gray-500 mb-2">拖拽设备到画布</div>

      <div
        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-orange-50 hover:border-orange-200 transition-colors"
        onDragStart={(event) => onDragStart(event, 'modemNode', '光猫')}
        draggable
      >
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
          M
        </div>
        <span className="font-medium text-gray-700">光猫</span>
      </div>

      <div
        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-blue-50 hover:border-blue-200 transition-colors"
        onDragStart={(event) => onDragStart(event, 'routerNode', '路由器')}
        draggable
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
          R
        </div>
        <span className="font-medium text-gray-700">路由器</span>
      </div>

      <div
        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-cyan-50 hover:border-cyan-200 transition-colors"
        onDragStart={(event) => onDragStart(event, 'wifiNode', 'WiFi 节点')}
        draggable
      >
        <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white">
          W
        </div>
        <span className="font-medium text-gray-700">WiFi 节点</span>
      </div>

      <div
        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-green-50 hover:border-green-200 transition-colors"
        onDragStart={(event) => onDragStart(event, 'switchNode', '交换机')}
        draggable
      >
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
          S
        </div>
        <span className="font-medium text-gray-700">交换机</span>
      </div>

      <div
        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-purple-50 hover:border-purple-200 transition-colors"
        onDragStart={(event) => onDragStart(event, 'deviceNode', '终端设备')}
        draggable
      >
        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
          D
        </div>
        <span className="font-medium text-gray-700">终端设备</span>
      </div>

      <div
        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
        onDragStart={(event) => onDragStart(event, 'gatewayNode', '智能网关')}
        draggable
      >
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
          G
        </div>
        <span className="font-medium text-gray-700">智能网关</span>
      </div>

      <div
        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-rose-50 hover:border-rose-200 transition-colors"
        onDragStart={(event) => onDragStart(event, 'smartHomeNode', '智能家居')}
        draggable
      >
        <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white">
          H
        </div>
        <span className="font-medium text-gray-700">智能家居</span>
      </div>

      <div
        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-slate-50 hover:border-slate-200 transition-colors"
        onDragStart={(event) => onDragStart(event, 'cameraNode', '监控摄像头')}
        draggable
      >
        <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-white">
          C
        </div>
        <span className="font-medium text-gray-700">监控摄像头</span>
      </div>
    </aside>
  );
};

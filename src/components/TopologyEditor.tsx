import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
  MiniMap,
  Panel,
  Position,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';

import { Sidebar } from './Sidebar';
import { RouterNode, SwitchNode, DeviceNode, ModemNode, WifiNode, GatewayNode, SmartHomeNode, CameraNode, NodeData } from './CustomNodes';
import { FlowEdge } from './FlowEdge';
import { Download, Upload, Save, Trash2, LayoutTemplate, FileSpreadsheet, Map as MapIcon, Network as NetworkIcon, Image as ImageIcon, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';

const nodeTypes: NodeTypes = {
  routerNode: RouterNode,
  switchNode: SwitchNode,
  deviceNode: DeviceNode,
  modemNode: ModemNode,
  wifiNode: WifiNode,
  gatewayNode: GatewayNode,
  smartHomeNode: SmartHomeNode,
  cameraNode: CameraNode,
};

const edgeTypes: EdgeTypes = {
  flowEdge: FlowEdge,
};

const getLayoutedElements = (nodes: Node<NodeData>[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y - 50,
      },
    };
  });

  return { nodes: newNodes, edges };
};

const defaultEdgeOptions = {
  type: 'flowEdge',
  animated: true,
  data: {
    speed: 100,
    color: 'rgb(0, 100, 255)',
    particleSize: 4,
    spacing: 15,
  },
};

const STORAGE_KEY = 'network-topology-data';
const FLOOR_PLAN_IMAGE_KEY = 'network-floor-plan-image';

// --- Utility Functions ---
const getIPPrefix = (ip: string) => ip.split('.').slice(0, 3).join('.');

const calculateIP = (subnet: string, suffix: string) => {
  if (!subnet) return '';
  const prefix = subnet.split('.').slice(0, 3).join('.');
  return suffix ? `${prefix}.${suffix}` : `${prefix}.`;
};

const TopologyEditorContent = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [viewMode, setViewMode] = useState<'topology' | 'floorplan'>('topology');
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);
  const [topologyViewport, setTopologyViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [floorPlanViewport, setFloorPlanViewport] = useState({ x: 0, y: 0, zoom: 1 });

  // Filtered nodes for the current view
  const visibleNodes = nodes.filter(n => 
    viewMode === 'topology' ? n.data.showInTopology : n.data.showInFloorPlan
  );

  const { setViewport, getViewport } = useReactFlow();

  const resetViewport = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ duration: 800 });
    }
  };

  const handleViewModeChange = (mode: 'topology' | 'floorplan') => {
    if (mode === viewMode) return;
    
    // Save current viewport
    const currentViewport = getViewport();
    if (viewMode === 'topology') {
      setTopologyViewport(currentViewport);
    } else {
      setFloorPlanViewport(currentViewport);
    }
    
    // Switch mode
    setViewMode(mode);
    
    // Restore target viewport
    const targetViewport = mode === 'topology' ? topologyViewport : floorPlanViewport;
    // Small delay to ensure React Flow has updated nodes before applying viewport
    setTimeout(() => {
      setViewport(targetViewport, { duration: 400 });
    }, 50);
  };

  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const updateInheritance = useCallback((nodesToUpdate: Node<NodeData>[], currentEdges: Edge[]) => {
    const nodesMap = new Map(nodesToUpdate.map(n => [n.id, n]));
    const visited = new Set<string>();

    const processNode = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodesMap.get(nodeId);
      if (!node) return;

      const parentEdge = currentEdges.find(e => e.target === nodeId);
      if (parentEdge) {
        const parentNode = nodesMap.get(parentEdge.source);
        if (parentNode && parentNode.data.ip) {
          const parentPrefix = getIPPrefix(parentNode.data.ip);
          const isRouterDial = node.type === 'routerNode' && node.data.mode === 'dial';
          const isModem = node.type === 'modemNode';
          
          if (!isRouterDial) {
            const suffix = node.data.ipSuffix || '';
            const newIp = calculateIP(`${parentPrefix}.0`, suffix);
            
            const newNode: Node<NodeData> = {
              ...node,
              data: {
                ...node.data,
                ip: newIp,
                ipSuffix: suffix,
                inheritedSubnet: `${parentPrefix}.0/24`
              }
            };
            nodesMap.set(nodeId, newNode);
          }
        }
      }
      
      // Process children
      currentEdges
        .filter(e => e.source === nodeId)
        .forEach(e => processNode(e.target));
    };

    // Start from roots (nodes without parents or router dial nodes)
    nodesToUpdate.forEach(node => {
      const hasParent = currentEdges.some(e => e.target === node.id);
      const isRouterDial = node.type === 'routerNode' && node.data.mode === 'dial';
      const isModem = node.type === 'modemNode';
      
      if (!hasParent || isRouterDial || isModem) {
        processNode(node.id);
      }
    });

    return Array.from(nodesMap.values());
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      if (viewMode === 'floorplan') return;
      
      setEdges((eds) => {
        const newEdges = addEdge({ ...params, type: 'flowEdge' }, eds);
        
        // Trigger inheritance update after connection
        setNodes((nds) => updateInheritance(nds, newEdges));
        
        return newEdges;
      });
    },
    [setEdges, setNodes, viewMode, updateInheritance],
  );

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<NodeData> = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          label: label || 'New Node', 
          ip: '', 
          ipSuffix: '1', // Default suffix to 1
          type: 'laptop',
          mode: 'dial', // Default router mode to dial
          viewMode: viewMode, // Sync current view mode
          topologyPos: position,
          floorPlanPos: position,
          // Track visibility in each mode
          showInTopology: viewMode === 'topology',
          showInFloorPlan: viewMode === 'floorplan'
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, viewMode],
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node<NodeData>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return {
              ...n,
              data: {
                ...n.data,
                [viewMode === 'topology' ? 'topologyPos' : 'floorPlanPos']: node.position,
              },
            };
          }
          return n;
        })
      );
    },
    [viewMode, setNodes]
  );

  // Sync viewMode to all nodes and SWAP positions when it changes
  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => {
        const topologyPos = node.data.topologyPos as { x: number, y: number } || node.position;
        const floorPlanPos = node.data.floorPlanPos as { x: number, y: number } || node.position;
        
        const targetPos = viewMode === 'topology' ? topologyPos : floorPlanPos;
        
        return {
          ...node,
          position: targetPos,
          data: { 
            ...node.data, 
            viewMode,
            // Ensure both are initialized if they weren't
            topologyPos,
            floorPlanPos
          }
        };
      })
    );
  }, [viewMode, setNodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    
    setNodes((nds) => {
      const updatedNodes = nds.map((n) => {
        if (n.id === selectedNode.id) {
          const updatedData = { ...n.data, [key]: value };
          
          if (key === 'subnet' || key === 'mode' || key === 'ipSuffix') {
            const suffix = updatedData.ipSuffix || '';
            updatedData.ipSuffix = suffix;
            
            if (updatedData.subnet) {
              updatedData.ip = calculateIP(updatedData.subnet, suffix);
            } else if (key === 'mode' && value === 'inherit') {
              updatedData.subnet = '';
            }
          }
          return { ...n, data: updatedData };
        }
        return n;
      });

      const finalNodes = updateInheritance(updatedNodes, edges);
      
      // Update selectedNode for property panel
      const finalSelectedNode = finalNodes.find(n => n.id === selectedNode.id);
      if (finalSelectedNode) {
        setSelectedNode(finalSelectedNode);
      }

      return finalNodes;
    });
  };

  const saveToLocalStorage = () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flow));
      alert('拓扑结构已保存到本地存储');
    }
  };

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );

      // Important: After layout, we need to update the saved topologyPos in data
      const finalNodes = layoutedNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          topologyPos: node.position
        }
      }));

      setNodes([...finalNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges, setNodes, setEdges]
  );

  const loadFromLocalStorage = useCallback(() => {
    const flowData = localStorage.getItem(STORAGE_KEY);
    if (flowData) {
      const flow = JSON.parse(flowData);
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
    }
    const savedImage = localStorage.getItem(FLOOR_PLAN_IMAGE_KEY);
    if (savedImage) {
      setFloorPlanImage(savedImage);
    }
  }, [setNodes, setEdges]);

  const handleFloorPlanUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFloorPlanImage(result);
        localStorage.setItem(FLOOR_PLAN_IMAGE_KEY, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFloorPlan = () => {
    setFloorPlanImage(null);
    localStorage.removeItem(FLOOR_PLAN_IMAGE_KEY);
  };

  // Initial load
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  const exportJson = () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
        JSON.stringify(flow, null, 2)
      )}`;
      const link = document.createElement('a');
      link.href = jsonString;
      link.download = 'network-topology.json';
      link.click();
    }
  };

  const exportExcel = () => {
    if (nodes.length === 0) {
      alert('没有设备可以导出');
      return;
    }

    const getDeviceTypeName = (type: string | undefined) => {
      switch (type) {
        case 'modemNode': return '光猫';
        case 'routerNode': return '路由器';
        case 'switchNode': return '交换机';
        case 'wifiNode': return 'WiFi 节点';
        case 'gatewayNode': return '智能网关';
        case 'smartHomeNode': return '智能设备';
        case 'cameraNode': return '监控摄像头';
        case 'deviceNode': return '终端设备';
        default: return '未知设备';
      }
    };

    const excelData = nodes.map((node) => ({
      '设备名称': node.data.label || '',
      '设备类型': getDeviceTypeName(node.type),
      '型号': node.data.model || '',
      'IP 地址': node.data.ip || '',
      '所在区域': node.data.area || '',
      '连接模式': node.type === 'routerNode' ? (node.data.mode === 'dial' ? '拨号' : '继承') : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '设备清单');

    // Set column widths
    const wscols = [
      { wch: 20 }, // 设备名称
      { wch: 15 }, // 设备类型
      { wch: 20 }, // 型号
      { wch: 15 }, // IP 地址
      { wch: 15 }, // 所在区域
      { wch: 10 }, // 连接模式
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, '家庭网络设备清单.xlsx');
  };

  const importJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], 'UTF-8');
      fileReader.onload = (e) => {
        if (e.target?.result) {
          const flow = JSON.parse(e.target.result as string);
          setNodes(flow.nodes || []);
          setEdges(flow.edges || []);
        }
      };
    }
  };
  
  const deleteSelected = () => {
    if (selectedNode) {
        setNodes((nds) => nds.map((n) => {
          if (n.id === selectedNode.id) {
            // Instead of full delete, just hide in current mode
            return {
              ...n,
              data: {
                ...n.data,
                [viewMode === 'topology' ? 'showInTopology' : 'showInFloorPlan']: false
              }
            };
          }
          return n;
        }).filter(n => n.data.showInTopology || n.data.showInFloorPlan)); // Only keep if visible in at least one mode
        
        // If hidden in topology, remove its edges
        if (viewMode === 'topology') {
          setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        }
        
        setSelectedNode(null);
    } else if (selectedEdge) {
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
        setSelectedEdge(null);
    }
  }

  // Handle Keyboard Delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't delete if user is typing in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, nodes, edges]);

  const clearTopology = () => {
    if (window.confirm('确定要清空所有设备吗？')) {
      setNodes([]);
      setEdges([]);
      localStorage.removeItem(STORAGE_KEY);
      setSelectedNode(null);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-blue-600">🌐</span> 家庭网络拓扑规划
          </h1>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => handleViewModeChange('topology')}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'topology' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <NetworkIcon size={16} /> 逻辑拓扑
            </button>
            <button 
              onClick={() => handleViewModeChange('floorplan')}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'floorplan' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MapIcon size={16} /> 户型图模式
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          {viewMode === 'floorplan' && (
            <div className="flex gap-2 mr-4 pr-4 border-r border-gray-200">
              {!floorPlanImage ? (
                <label className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 cursor-pointer">
                  <ImageIcon size={16} /> 上传户型图
                  <input type="file" className="hidden" accept="image/*" onChange={handleFloorPlanUpload} />
                </label>
              ) : (
                <button onClick={removeFloorPlan} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100">
                  更换户型图
                </button>
              )}
            </div>
          )}
          
          <button onClick={clearTopology} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100">
            <Trash2 size={16} /> 清空
          </button>
          {viewMode === 'topology' && (
            <button onClick={() => onLayout('TB')} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100" title="垂直布局">
              <LayoutTemplate size={16} /> 自动布局
            </button>
          )}
          <button onClick={resetViewport} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100" title="重置视角">
            <RotateCcw size={16} />
          </button>
          <button onClick={saveToLocalStorage} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
            <Save size={16} /> 保存
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100" title="导出 Excel 设备清单">
            <FileSpreadsheet size={16} /> 导出清单
          </button>
          <button onClick={exportJson} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100">
            <Download size={16} /> 导出
          </button>
          <label className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer">
            <Upload size={16} /> 导入
            <input type="file" className="hidden" accept=".json" onChange={importJson} />
          </label>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={visibleNodes}
            edges={viewMode === 'floorplan' ? [] : edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            panOnDrag={viewMode !== 'floorplan'}
            selectionOnDrag={viewMode !== 'floorplan'}
            style={{
              backgroundImage: viewMode === 'floorplan' && floorPlanImage ? `url(${floorPlanImage})` : 'none',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <Controls />
            <MiniMap />
            {viewMode === 'topology' && <Background gap={12} size={1} />}
            
            {selectedEdge && (
              <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-64 m-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">连线属性</h3>
                  <button onClick={deleteSelected} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  已选中连接线。您可以按 <kbd className="px-1 bg-gray-100 border rounded text-xs">Del</kbd> 或点击上方图标删除。
                </div>
              </Panel>
            )}

            {selectedNode && (
              <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-64 m-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">节点属性</h3>
                  <button onClick={deleteSelected} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">名称</label>
                    <input 
                      type="text" 
                      value={selectedNode.data.label as string} 
                      onChange={(e) => updateNodeData('label', e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-700 mb-2">网络设置</label>
                    
                    {/* Router Mode Selection */}
                    {selectedNode.type === 'routerNode' && (
                      <div className="mb-3">
                        <label className="block text-[10px] text-gray-500 mb-1">连接模式</label>
                        <select 
                          value={selectedNode.data.mode as string || 'dial'} 
                          onChange={(e) => updateNodeData('mode', e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                          <option value="dial">拨号模式 (开启新网段)</option>
                          <option value="inherit">继承模式 (桥接/AP)</option>
                        </select>
                      </div>
                    )}

                    {/* Subnet Selection for Modem or Dialing Router */}
                    {(selectedNode.type === 'modemNode' || (selectedNode.type === 'routerNode' && selectedNode.data.mode === 'dial')) && (
                      <div className="mb-3">
                        <label className="block text-[10px] text-gray-500 mb-1">选择网段</label>
                        <select 
                          value={selectedNode.data.subnet as string || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            // Basic validation: Router subnet cannot be same as Modem subnet if connected
                            if (selectedNode.type === 'routerNode') {
                              const parentEdge = edges.find(ed => ed.target === selectedNode.id);
                              if (parentEdge) {
                                const parentNode = nodes.find(n => n.id === parentEdge.source);
                                if (parentNode && parentNode.data.subnet === val) {
                                  alert('拨号网段不得与上层光猫网段相同！');
                                  return;
                                }
                              }
                            }
                            updateNodeData('subnet', val);
                          }}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                          <option value="">请选择网段...</option>
                          <option value="192.168.0.0">192.168.0.0/24</option>
                          <option value="192.168.1.0">192.168.1.0/24</option>
                          <option value="192.168.2.0">192.168.2.0/24</option>
                          <option value="192.168.31.0">192.168.31.0/24</option>
                          <option value="192.168.50.0">192.168.50.0/24</option>
                          <option value="10.0.0.0">10.0.0.0/24</option>
                        </select>
                      </div>
                    )}

                    {/* Inherited Subnet Display */}
                    {(selectedNode.type !== 'modemNode' && !(selectedNode.type === 'routerNode' && selectedNode.data.mode === 'dial')) && (
                      <div className="mb-3">
                        <label className="block text-[10px] text-gray-500 mb-1">继承网段</label>
                        <div className="text-sm bg-gray-50 px-2 py-1 rounded text-gray-600 border border-gray-100 font-mono">
                          {selectedNode.data.inheritedSubnet || '未连接到网段'}
                        </div>
                      </div>
                    )}

                    {/* IP Suffix Input */}
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">IP 地址 (仅限最后一位)</label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-400 font-mono">
                          {selectedNode.data.ip ? selectedNode.data.ip.split('.').slice(0, 3).join('.') + '.' : '... .'}
                        </span>
                        <input 
                          type="number" 
                          min="1" 
                          max="254"
                          placeholder="1"
                          value={selectedNode.data.ipSuffix as string || ''} 
                          onChange={(e) => updateNodeData('ipSuffix', e.target.value)}
                          className="w-20 text-sm border border-gray-300 rounded px-2 py-1 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">区域</label>
                    <input 
                      type="text" 
                      placeholder="例如: 客厅, 主卧"
                      value={selectedNode.data.area as string || ''} 
                      onChange={(e) => updateNodeData('area', e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>

                  {(selectedNode.type === 'switchNode' || 
                    selectedNode.type === 'modemNode' || 
                    selectedNode.type === 'wifiNode' ||
                    selectedNode.type === 'gatewayNode' ||
                    selectedNode.type === 'smartHomeNode' ||
                    selectedNode.type === 'cameraNode' ||
                    selectedNode.type === 'routerNode') && (
                    <div>
                       <label className="block text-xs text-gray-500 mb-1">型号</label>
                       <input 
                         type="text" 
                         value={selectedNode.data.model as string || ''} 
                         onChange={(e) => updateNodeData('model', e.target.value)}
                         className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                       />
                    </div>
                  )}

                  {selectedNode.type === 'deviceNode' && (
                    <div>
                       <label className="block text-xs text-gray-500 mb-1">设备类型</label>
                       <select 
                         value={selectedNode.data.type as string || 'laptop'} 
                         onChange={(e) => updateNodeData('type', e.target.value)}
                         className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                       >
                         <option value="laptop">笔记本</option>
                         <option value="desktop">台式机</option>
                         <option value="mobile">手机</option>
                         <option value="tv">电视</option>
                       </select>
                    </div>
                  )}
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export const TopologyEditor = () => {
  return (
    <ReactFlowProvider>
      <TopologyEditorContent />
    </ReactFlowProvider>
  );
};

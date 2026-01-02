# 家庭网络拓扑规划系统 (Home Network Topology Planner)

这是一个基于 React + Vite + TypeScript 开发的纯前端家庭网络规划与可视化系统。它可以帮助用户直观地设计家庭网络架构，并支持在户型图上进行设备点位布放。

## ✨ 核心特性

- **双模式切换**：
  - **逻辑拓扑模式**：专注于网络架构逻辑，支持自动布局、IP 自动分配与子网继承。
  - **户型图模式**：支持上传户型底图，将设备图标拖拽到实际房间位置，实现物理点位规划。
- **智能 IP 管理**：
  - 支持 192.168.x.x 网段选择。
  - 路由器支持“拨号”与“继承”模式。
  - 自动继承上级设备的网段，只需填写主机位（末位）。
- **可视化交互**：
  - 炫酷的蓝色粒子流连线动画，代表网络数据传输。
  - 拖拽式设备库（光猫、路由器、交换机、AP、终端设备、监控等）。
  - 响应式属性面板，支持编辑型号、区域、IP 等信息。
- **数据管理**：
  - 自动保存到浏览器本地存储（LocalStorage）。
  - 支持导出/导入 JSON 配置文件。
  - 支持一键导出 Excel 设备清单，方便采购与施工参考。

## 🚀 快速开始

### 环境要求

- Node.js (建议 v18+)
- pnpm 或 npm/yarn

### 安装与运行

1. 克隆项目
```bash
git clone https://github.com/your-username/home-network-planner.git
cd home-network-planner
```

2. 安装依赖
```bash
pnpm install
```

3. 启动开发服务器
```bash
pnpm dev
```

4. 构建生产版本
```bash
pnpm build
```

## 🛠️ 技术栈

- **前端框架**: [React 18](https://reactjs.org/)
- **可视化引擎**: [React Flow](https://reactflow.dev/) (高性能节点编辑器)
- **布局引擎**: [Dagre](https://github.com/dagrejs/dagre) (自动拓扑排列)
- **样式方案**: [Tailwind CSS](https://tailwindcss.com/)
- **图标库**: [Lucide React](https://lucide.dev/)
- **数据导出**: [SheetJS (XLSX)](https://sheetjs.com/)
- **构建工具**: [Vite](https://vitejs.dev/)

## 📝 使用指南

1. **逻辑拓扑**：从左侧设备库拖入光猫作为起点，依次连接路由器、交换机等。点击连线可删除或编辑。
2. **IP 规划**：在光猫或拨号路由器上选择网段，后续连接的设备会自动获得相同前缀。
3. **户型图布放**：切换到“户型图模式”，上传您的家装图，将设备移动到对应的房间位置。
4. **保存与导出**：完成设计后，建议点击“保存”以持久化数据，或导出 Excel 清单。

## 🤝 贡献建议

欢迎提交 Issue 或 Pull Request 来改进这个项目！

## 📄 开源协议

MIT License

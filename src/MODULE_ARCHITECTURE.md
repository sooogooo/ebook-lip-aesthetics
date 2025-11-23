# 模块化架构说明

## 目录结构

```
src/
├── index.js              # 主入口文件
├── core/                  # 核心模块
│   ├── state-management.js
│   ├── hook-system.js
│   ├── component-library.js
│   └── integration.js
│
├── 3d/                    # 3D渲染模块
│   ├── models.js
│   ├── anatomy-viewer.js
│   ├── lighting-materials.js
│   ├── medical-shaders.js
│   ├── lod-system.js
│   ├── mesh-compression.js
│   ├── physics-simulator.js
│   ├── multi-thread-renderer.js
│   └── optimizer.js
│
├── ui/                    # UI组件模块
│   ├── gallery.js
│   ├── charts.js
│   ├── zoom-viewer.js
│   ├── visualization-widgets.js
│   ├── theme-system.js
│   ├── css-in-js.js
│   └── customization.js
│
├── mobile/                # 移动端模块
│   ├── viewer-3d.js
│   ├── ar-handler.js
│   ├── gestures.js
│   └── integration-hub.js
│
├── analytics/             # 数据分析模块
│   ├── case-analytics.js
│   ├── medical-analytics.js
│   ├── data-viz-optimizer.js
│   ├── medical-visualization.js
│   ├── DataProcessor.js
│   ├── MLModelManager.js
│   ├── AdvancedVisualizer.js
│   └── StreamingDataManager.js
│
├── features/              # 功能模块
│   ├── search.js
│   ├── export-sharing.js
│   ├── accessibility.js
│   ├── progressive-enhancement.js
│   ├── lazy-load.js
│   ├── responsive-images.js
│   ├── markdown-renderer.js
│   └── documentation.js
│
├── pwa/                   # PWA模块
│   ├── service-worker-manager.js
│   └── push-notifications.js
│
└── performance/           # 性能模块
    └── monitor.js
```

## 文件迁移映射

### 核心模块 (core/)
| 原文件 | 新位置 |
|--------|--------|
| state-management.js | src/core/state-management.js |
| hook-system.js | src/core/hook-system.js |
| component-library.js | src/core/component-library.js |
| integration.js | src/core/integration.js |
| compact-component-system.js | 合并到 component-library.js |

### 3D渲染模块 (3d/)
| 原文件 | 新位置 |
|--------|--------|
| 3d_models.js | src/3d/models.js |
| enhanced_3d_anatomy.js | src/3d/anatomy-viewer.js |
| advanced_lighting_materials.js | src/3d/lighting-materials.js |
| advanced_medical_shaders.js | src/3d/medical-shaders.js |
| medical_lod_system.js | src/3d/lod-system.js |
| mesh_compression_system.js | src/3d/mesh-compression.js |
| tissue_physics_simulator.js | src/3d/physics-simulator.js |
| multi_threaded_rendering.js | src/3d/multi-thread-renderer.js |
| 3d_optimizer_compact.js | src/3d/optimizer.js |

### UI组件模块 (ui/)
| 原文件 | 新位置 |
|--------|--------|
| gallery.js | src/ui/gallery.js |
| charts.js | src/ui/charts.js |
| zoom_viewer.js | src/ui/zoom-viewer.js |
| visualization-widgets.js | src/ui/visualization-widgets.js |
| theme-system.js | src/ui/theme-system.js |
| css-in-js-system.js | src/ui/css-in-js.js |
| customization-system.js | src/ui/customization.js |

### 移动端模块 (mobile/)
| 原文件 | 新位置 |
|--------|--------|
| mobile_3d_viewer.js | src/mobile/viewer-3d.js |
| mobile_ar_handler.js | src/mobile/ar-handler.js |
| mobile_gestures.js | src/mobile/gestures.js |
| mobile_integration_hub.js | src/mobile/integration-hub.js |

### 数据分析模块 (analytics/)
| 原文件 | 新位置 |
|--------|--------|
| case_analytics.js | src/analytics/case-analytics.js |
| medical_data_analytics.js | src/analytics/medical-analytics.js |
| data_viz_optimizer.js | src/analytics/data-viz-optimizer.js |
| advanced_medical_visualization.js | src/analytics/medical-visualization.js |
| src/analytics/*.js | 保持不变 |

### 功能模块 (features/)
| 原文件 | 新位置 |
|--------|--------|
| search-system.js | src/features/search.js |
| export-sharing-system.js | src/features/export-sharing.js |
| accessibility-system.js | src/features/accessibility.js |
| progressive-enhancement.js | src/features/progressive-enhancement.js |
| lazy-load-manager.js | src/features/lazy-load.js |
| responsive_image_delivery.js | src/features/responsive-images.js |
| markdown-renderer.js | src/features/markdown-renderer.js |
| documentation-interactive.js | src/features/documentation.js |

### PWA模块 (pwa/)
| 原文件 | 新位置 |
|--------|--------|
| service-worker.js / service_worker.js / sw.js | src/pwa/service-worker-manager.js |
| push_notification_system.js | src/pwa/push-notifications.js |

### 性能模块 (performance/)
| 原文件 | 新位置 |
|--------|--------|
| performance_monitor.js | src/performance/monitor.js |

## 使用方式

### ES6 模块导入

```javascript
// 导入整个库
import LipAesthetics from './src/index.js';

// 初始化应用
const app = await LipAesthetics.initializeApp({
    core: true,
    ui: true,
    analytics: true,
    mobile: true,
    pwa: true
});

// 按需导入特定模块
import { Gallery, Charts, ThemeSystem } from './src/index.js';
import { AnatomyViewer, PhysicsSimulator } from './src/index.js';
```

### CommonJS 导入

```javascript
const { Gallery, Charts } = require('./src/index.js');
```

## 迁移步骤

1. **备份当前代码**
   ```bash
   git stash  # 或创建备份分支
   ```

2. **运行迁移脚本**
   ```bash
   npm run migrate-modules
   ```

3. **更新导入路径**
   - 更新所有HTML文件中的script标签
   - 更新webpack配置

4. **测试功能**
   - 运行单元测试
   - 手动测试关键功能

5. **删除旧文件**
   ```bash
   npm run cleanup-old-files
   ```

## 好处

1. **代码组织清晰** - 按功能模块分类，易于查找和维护
2. **按需加载** - 只加载需要的模块，减少初始加载时间
3. **更好的代码分割** - 便于webpack进行tree shaking和code splitting
4. **团队协作** - 不同团队可以专注于不同模块
5. **测试友好** - 模块化结构更易于编写单元测试

## 注意事项

- 保留.min.js文件用于生产环境
- 确保所有循环依赖已解决
- 更新文档中的示例代码

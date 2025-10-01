# 《绛唇解语花》图片画廊API文档

## 概述

《绛唇解语花》响应式图片画廊系统为医美案例展示提供了完整的解决方案，支持多种视图模式、高级筛选、批量操作和无障碍访问。

## 核心功能

### 🖼️ 画廊系统
- **多视图模式**: 网格、瀑布流、列表、大图展示
- **响应式布局**: 自适应不同屏幕尺寸
- **懒加载优化**: 提升页面加载性能
- **图片压缩**: 自动WebP格式检测和优化

### 🔍 搜索与筛选
- **全文搜索**: 支持标题、描述、标签搜索
- **多维筛选**: 按类型、年龄、医生、时间、评分筛选
- **智能推荐**: 相似案例推荐算法
- **历史记录**: 搜索历史保存和快速访问

### 📱 交互体验
- **灯箱查看**: 全屏高清图片查看
- **前后对比**: 医美案例专用对比模式
- **缩放平移**: 支持图片细节查看
- **手势支持**: 移动端触摸手势优化

## API 接口

### 初始化画廊

```javascript
const gallery = new MedicalGallery('gallery-container', {
  // 基础配置
  itemsPerPage: 20,
  defaultView: 'grid',
  enableLazyLoad: true,
  enableInfiniteScroll: true,

  // 数据源配置
  dataSource: 'api/images',
  imageBasePath: '/images/',
  thumbnailPath: '/thumbnails/',

  // 功能开关
  enableSearch: true,
  enableFilters: true,
  enableComparison: true,
  enableBatchOps: true,

  // 主题配置
  theme: 'light', // 'light' | 'dark' | 'auto'
  primaryColor: '#E91E63',

  // 回调函数
  onItemClick: (item) => {},
  onItemSelect: (items) => {},
  onViewChange: (view) => {},
  onError: (error) => {}
});
```

### 数据格式

```typescript
interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  metadata: {
    treatmentType: string;
    patientAge: number;
    doctorName: string;
    clinicName: string;
    treatmentDate: string;
    satisfactionScore: number;
    beforeImageUrl?: string;
    afterImageUrl?: string;
  };
  stats: {
    views: number;
    likes: number;
    saves: number;
  };
}
```

### 主要方法

#### 数据操作

```javascript
// 加载数据
gallery.loadData(items: GalleryItem[]): Promise<void>
gallery.loadFromAPI(url: string): Promise<void>
gallery.addItem(item: GalleryItem): void
gallery.removeItem(id: string): void
gallery.updateItem(id: string, updates: Partial<GalleryItem>): void

// 获取数据
gallery.getItem(id: string): GalleryItem | null
gallery.getAllItems(): GalleryItem[]
gallery.getSelectedItems(): GalleryItem[]
gallery.getFilteredItems(): GalleryItem[]
```

#### 视图控制

```javascript
// 视图模式
gallery.setView(view: 'grid' | 'masonry' | 'list' | 'hero'): void
gallery.getView(): string

// 布局控制
gallery.setColumns(count: number): void
gallery.setItemSize(size: 'small' | 'medium' | 'large'): void
gallery.refresh(): void
gallery.resize(): void
```

#### 搜索和筛选

```javascript
// 搜索
gallery.search(query: string): void
gallery.clearSearch(): void
gallery.getSearchResults(): GalleryItem[]

// 筛选
gallery.addFilter(key: string, value: any): void
gallery.removeFilter(key: string): void
gallery.clearFilters(): void
gallery.getActiveFilters(): Record<string, any>

// 排序
gallery.sortBy(field: string, order: 'asc' | 'desc'): void
gallery.getSortConfig(): { field: string; order: string }
```

#### 选择和批量操作

```javascript
// 选择控制
gallery.selectItem(id: string): void
gallery.deselectItem(id: string): void
gallery.selectAll(): void
gallery.deselectAll(): void
gallery.toggleSelection(id: string): void

// 批量操作
gallery.batchDelete(ids: string[]): Promise<void>
gallery.batchDownload(ids: string[]): Promise<void>
gallery.batchExport(ids: string[], format: 'zip' | 'pdf'): Promise<void>
gallery.batchTag(ids: string[], tags: string[]): void
```

#### 灯箱和对比

```javascript
// 灯箱控制
gallery.openLightbox(id: string): void
gallery.closeLightbox(): void
gallery.nextImage(): void
gallery.prevImage(): void

// 对比模式
gallery.enableComparison(): void
gallery.disableComparison(): void
gallery.addToComparison(id: string): void
gallery.removeFromComparison(id: string): void
gallery.clearComparison(): void
```

### 事件系统

```javascript
// 监听事件
gallery.on('item:click', (item) => {
  console.log('点击项目:', item);
});

gallery.on('item:select', (selectedItems) => {
  console.log('选中项目:', selectedItems);
});

gallery.on('view:change', (view) => {
  console.log('视图切换:', view);
});

gallery.on('search:change', (query, results) => {
  console.log('搜索结果:', query, results);
});

gallery.on('filter:change', (filters, results) => {
  console.log('筛选结果:', filters, results);
});

gallery.on('error', (error) => {
  console.error('画廊错误:', error);
});

// 取消监听
gallery.off('item:click', handler);
gallery.off('item:select');
```

### 扩展功能

#### 自定义渲染器

```javascript
// 自定义项目渲染
gallery.setItemRenderer((item, element) => {
  element.innerHTML = `
    <div class="custom-item">
      <img src="${item.thumbnailUrl}" alt="${item.title}">
      <div class="custom-overlay">
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="rating">${'★'.repeat(item.metadata.satisfactionScore)}</div>
      </div>
    </div>
  `;
});

// 自定义灯箱内容
gallery.setLightboxRenderer((item, container) => {
  container.innerHTML = `
    <div class="custom-lightbox">
      <img src="${item.imageUrl}" alt="${item.title}">
      <div class="lightbox-info">
        <h2>${item.title}</h2>
        <p>${item.description}</p>
        <div class="metadata">
          <span>医生: ${item.metadata.doctorName}</span>
          <span>日期: ${item.metadata.treatmentDate}</span>
        </div>
      </div>
    </div>
  `;
});
```

#### 插件系统

```javascript
// 注册插件
gallery.use(plugin, options);

// 图片水印插件
const watermarkPlugin = {
  name: 'watermark',
  install(gallery, options) {
    gallery.on('image:load', (img) => {
      addWatermark(img, options.text);
    });
  }
};

gallery.use(watermarkPlugin, { text: '绛唇解语花' });

// 统计分析插件
const analyticsPlugin = {
  name: 'analytics',
  install(gallery, options) {
    gallery.on('item:view', (item) => {
      track('image_view', { id: item.id, title: item.title });
    });
  }
};

gallery.use(analyticsPlugin);
```

## 样式定制

### CSS 变量

```css
:root {
  /* 主色调 */
  --gallery-primary: #E91E63;
  --gallery-secondary: #2196F3;

  /* 布局 */
  --gallery-gap: 16px;
  --gallery-border-radius: 8px;

  /* 动画 */
  --gallery-transition: 300ms ease;

  /* 阴影 */
  --gallery-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

### 主题切换

```javascript
// 切换主题
gallery.setTheme('dark');

// 自定义主题
gallery.setTheme({
  primary: '#FF5722',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF'
});
```

## 性能优化

### 懒加载配置

```javascript
gallery.configure({
  lazyLoad: {
    threshold: 100,      // 提前加载距离
    placeholder: 'blur', // 占位符类型
    fadeIn: true,        // 淡入动画
    retryCount: 3        // 重试次数
  }
});
```

### 虚拟滚动

```javascript
gallery.configure({
  virtualScroll: {
    enabled: true,
    itemHeight: 200,     // 项目高度
    buffer: 5,           // 缓冲区大小
    threshold: 1000      // 启用阈值
  }
});
```

### 图片优化

```javascript
gallery.configure({
  imageOptimization: {
    format: 'webp',      // 优先格式
    quality: 80,         // 压缩质量
    progressive: true,   // 渐进式加载
    responsive: true     // 响应式尺寸
  }
});
```

## 无障碍设计

### 键盘导航

- **Tab**: 焦点切换
- **Enter/Space**: 选择项目
- **Arrow Keys**: 方向导航
- **Escape**: 关闭弹窗
- **Ctrl+A**: 全选
- **Delete**: 删除选中

### 屏幕阅读器

```javascript
// ARIA 标签配置
gallery.configure({
  accessibility: {
    itemRole: 'gridcell',
    containerRole: 'grid',
    announceSelection: true,
    announceFilters: true
  }
});
```

## 错误处理

```javascript
// 全局错误处理
gallery.on('error', (error) => {
  switch (error.type) {
    case 'LOAD_FAILED':
      showNotification('图片加载失败', 'error');
      break;
    case 'NETWORK_ERROR':
      showNotification('网络连接错误', 'warning');
      break;
    case 'PERMISSION_DENIED':
      showNotification('权限不足', 'error');
      break;
  }
});

// 重试机制
gallery.configure({
  retry: {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential'
  }
});
```

## 部署说明

### 依赖要求

```json
{
  "dependencies": {
    "masonry-layout": "^4.2.2",
    "lazysizes": "^5.3.2",
    "fuse.js": "^6.6.2"
  }
}
```

### 服务器配置

```nginx
# Nginx 配置示例
location /images/ {
    expires 1y;
    add_header Cache-Control "public, immutable";

    # WebP 支持
    location ~* \.(jpg|jpeg|png)$ {
        add_header Vary Accept;
        try_files $uri$webp_suffix $uri =404;
    }
}
```

### 安全考虑

```javascript
// XSS 防护
gallery.configure({
  security: {
    sanitizeHTML: true,
    validateUrls: true,
    allowedDomains: ['trusted-domain.com'],
    maxFileSize: '10MB',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
});
```

## 支持与维护

- **浏览器支持**: Chrome 70+, Firefox 65+, Safari 12+, Edge 79+
- **移动端支持**: iOS 12+, Android 8+
- **框架兼容**: 原生 JavaScript，支持 React/Vue/Angular 封装
- **更新频率**: 月度功能更新，周度安全补丁
- **技术支持**: [GitHub Issues](https://github.com/lips-aesthetics/gallery)
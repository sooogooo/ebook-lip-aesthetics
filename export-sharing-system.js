/**
 * Export and Sharing System for 绛唇解语花 Visualization Platform
 * Comprehensive file generation, sharing, and collaboration features
 */

/**
 * Export Configuration and Types
 */
const ExportFormats = {
  // Image formats
  PNG: 'png',
  JPEG: 'jpeg',
  SVG: 'svg',
  WEBP: 'webp',
  PDF: 'pdf',

  // Data formats
  JSON: 'json',
  CSV: 'csv',
  XLSX: 'xlsx',
  XML: 'xml',
  TSV: 'tsv',

  // Code formats
  HTML: 'html',
  CSS: 'css',
  JAVASCRIPT: 'javascript',

  // Presentation formats
  PPTX: 'pptx',
  DOCX: 'docx',

  // Archive formats
  ZIP: 'zip'
};

const ShareMethods = {
  LINK: 'link',
  EMAIL: 'email',
  SOCIAL: 'social',
  EMBED: 'embed',
  QR_CODE: 'qr_code',
  API: 'api'
};

const SocialPlatforms = {
  TWITTER: 'twitter',
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  WECHAT: 'wechat',
  WEIBO: 'weibo'
};

/**
 * Advanced Export Engine
 */
class ExportEngine {
  constructor() {
    this.exporters = new Map();
    this.preprocessors = new Map();
    this.postprocessors = new Map();
    this.templates = new Map();
    this.queue = [];
    this.processing = false;

    this.setupBuiltinExporters();
  }

  /**
   * Setup built-in exporters
   */
  setupBuiltinExporters() {
    // Image exporters
    this.registerExporter(ExportFormats.PNG, new PNGExporter());
    this.registerExporter(ExportFormats.JPEG, new JPEGExporter());
    this.registerExporter(ExportFormats.SVG, new SVGExporter());
    this.registerExporter(ExportFormats.WEBP, new WebPExporter());
    this.registerExporter(ExportFormats.PDF, new PDFExporter());

    // Data exporters
    this.registerExporter(ExportFormats.JSON, new JSONExporter());
    this.registerExporter(ExportFormats.CSV, new CSVExporter());
    this.registerExporter(ExportFormats.XLSX, new ExcelExporter());
    this.registerExporter(ExportFormats.XML, new XMLExporter());

    // Code exporters
    this.registerExporter(ExportFormats.HTML, new HTMLExporter());
    this.registerExporter(ExportFormats.CSS, new CSSExporter());
    this.registerExporter(ExportFormats.JAVASCRIPT, new JSExporter());

    // Archive exporters
    this.registerExporter(ExportFormats.ZIP, new ZipExporter());
  }

  /**
   * Register custom exporter
   */
  registerExporter(format, exporter) {
    this.exporters.set(format, exporter);
  }

  /**
   * Register preprocessor
   */
  registerPreprocessor(format, processor) {
    if (!this.preprocessors.has(format)) {
      this.preprocessors.set(format, []);
    }
    this.preprocessors.get(format).push(processor);
  }

  /**
   * Register postprocessor
   */
  registerPostprocessor(format, processor) {
    if (!this.postprocessors.has(format)) {
      this.postprocessors.set(format, []);
    }
    this.postprocessors.get(format).push(processor);
  }

  /**
   * Export data/component
   */
  async export(options = {}) {
    const {
      format,
      data,
      component,
      filename,
      quality = 1.0,
      width,
      height,
      background = 'transparent',
      includeStyles = true,
      includeScripts = false,
      template,
      metadata = {},
      watermark = null,
      compression = 'medium'
    } = options;

    if (!this.exporters.has(format)) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    const exportOptions = {
      format,
      data,
      component,
      filename: filename || this.generateFilename(format),
      quality,
      width,
      height,
      background,
      includeStyles,
      includeScripts,
      template,
      metadata: {
        ...metadata,
        exportedAt: new Date().toISOString(),
        format,
        generator: 'LipsAesthetics Visualization Platform'
      },
      watermark,
      compression
    };

    try {
      // Preprocess
      await this.runPreprocessors(format, exportOptions);

      // Export
      const exporter = this.exporters.get(format);
      const result = await exporter.export(exportOptions);

      // Postprocess
      await this.runPostprocessors(format, result, exportOptions);

      return result;

    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Batch export multiple formats
   */
  async batchExport(formats, options = {}) {
    const results = new Map();
    const errors = new Map();

    for (const format of formats) {
      try {
        const result = await this.export({ ...options, format });
        results.set(format, result);
      } catch (error) {
        errors.set(format, error);
      }
    }

    return { results, errors };
  }

  /**
   * Queue export for background processing
   */
  queueExport(options) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        options,
        resolve,
        reject,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      });

      this.processQueue();
    });
  }

  /**
   * Process export queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();

      try {
        const result = await this.export(job.options);
        job.resolve(result);
      } catch (error) {
        job.reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Run preprocessors
   */
  async runPreprocessors(format, options) {
    const processors = this.preprocessors.get(format) || [];
    for (const processor of processors) {
      await processor(options);
    }
  }

  /**
   * Run postprocessors
   */
  async runPostprocessors(format, result, options) {
    const processors = this.postprocessors.get(format) || [];
    for (const processor of processors) {
      await processor(result, options);
    }
  }

  /**
   * Generate filename
   */
  generateFilename(format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `visualization-${timestamp}.${format}`;
  }

  /**
   * Get supported formats
   */
  getSupportedFormats() {
    return Array.from(this.exporters.keys());
  }
}

/**
 * Base Exporter Class
 */
class BaseExporter {
  constructor() {
    this.mimeTypes = {};
    this.defaultOptions = {};
  }

  async export(options) {
    throw new Error('export() method must be implemented by subclass');
  }

  getMimeType(format) {
    return this.mimeTypes[format] || 'application/octet-stream';
  }

  createBlob(data, format) {
    const mimeType = this.getMimeType(format);
    return new Blob([data], { type: mimeType });
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * PNG Exporter
 */
class PNGExporter extends BaseExporter {
  constructor() {
    super();
    this.mimeTypes = { png: 'image/png' };
  }

  async export(options) {
    const { component, width, height, quality, filename, background } = options;

    if (!component) {
      throw new Error('Component is required for PNG export');
    }

    // Create canvas
    const canvas = await this.componentToCanvas(component, width, height, background);

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        this.downloadBlob(blob, filename);
        resolve({
          blob,
          dataURL: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height,
          size: blob.size
        });
      }, 'image/png', quality);
    });
  }

  async componentToCanvas(component, width, height, background) {
    // Get component dimensions
    const rect = component.getBoundingClientRect();
    const canvasWidth = width || rect.width * 2; // 2x for retina
    const canvasHeight = height || rect.height * 2;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // Set background
    if (background && background !== 'transparent') {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Use html2canvas for DOM to canvas conversion
    if (typeof html2canvas !== 'undefined') {
      const canvasElement = await html2canvas(component, {
        canvas: canvas,
        backgroundColor: background === 'transparent' ? null : background,
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      return canvasElement;
    }

    // Fallback: create SVG and render to canvas
    const svg = await this.componentToSVG(component);
    return this.svgToCanvas(svg, canvasWidth, canvasHeight);
  }

  async componentToSVG(component) {
    const serializer = new XMLSerializer();
    const rect = component.getBoundingClientRect();

    // Clone component
    const clone = component.cloneNode(true);

    // Create SVG wrapper
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', rect.width);
    svg.setAttribute('height', rect.height);
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);

    // Create foreign object
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foreignObject.setAttribute('width', '100%');
    foreignObject.setAttribute('height', '100%');
    foreignObject.appendChild(clone);

    svg.appendChild(foreignObject);

    return serializer.serializeToString(svg);
  }

  async svgToCanvas(svgString, width, height) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };

      img.onerror = reject;
      img.src = url;
    });
  }
}

/**
 * JSON Exporter
 */
class JSONExporter extends BaseExporter {
  constructor() {
    super();
    this.mimeTypes = { json: 'application/json' };
  }

  async export(options) {
    const { data, filename, metadata } = options;

    const exportData = {
      ...metadata,
      data: data,
      exportedAt: new Date().toISOString()
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = this.createBlob(jsonString, 'json');

    this.downloadBlob(blob, filename);

    return {
      blob,
      data: exportData,
      size: blob.size,
      json: jsonString
    };
  }
}

/**
 * CSV Exporter
 */
class CSVExporter extends BaseExporter {
  constructor() {
    super();
    this.mimeTypes = { csv: 'text/csv' };
  }

  async export(options) {
    const { data, filename } = options;

    if (!Array.isArray(data)) {
      throw new Error('Data must be an array for CSV export');
    }

    const csv = this.arrayToCSV(data);
    const blob = this.createBlob(csv, 'csv');

    this.downloadBlob(blob, filename);

    return {
      blob,
      csv,
      rows: data.length,
      size: blob.size
    };
  }

  arrayToCSV(data) {
    if (data.length === 0) return '';

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }
}

/**
 * PDF Exporter
 */
class PDFExporter extends BaseExporter {
  constructor() {
    super();
    this.mimeTypes = { pdf: 'application/pdf' };
  }

  async export(options) {
    const { component, data, filename, template, metadata } = options;

    // Use jsPDF for PDF generation
    if (typeof jsPDF === 'undefined') {
      throw new Error('jsPDF library is required for PDF export');
    }

    const pdf = new jsPDF();

    // Add metadata
    if (metadata) {
      pdf.setProperties({
        title: metadata.title || 'Visualization Export',
        subject: metadata.subject || 'Data Visualization',
        author: metadata.author || 'Lips Aesthetics Platform',
        creator: 'Lips Aesthetics Visualization Platform'
      });
    }

    if (component) {
      // Convert component to image and add to PDF
      const canvas = await this.componentToCanvas(component);
      const imgData = canvas.toDataURL('image/png');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate scaled dimensions
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      // Center image on page
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
    }

    if (data && template) {
      // Use template to format data in PDF
      await this.applyTemplate(pdf, data, template);
    }

    // Generate blob
    const pdfBlob = pdf.output('blob');
    this.downloadBlob(pdfBlob, filename);

    return {
      blob: pdfBlob,
      pages: pdf.internal.getNumberOfPages(),
      size: pdfBlob.size
    };
  }

  async componentToCanvas(component) {
    // Reuse PNG exporter logic
    const pngExporter = new PNGExporter();
    return pngExporter.componentToCanvas(component);
  }

  async applyTemplate(pdf, data, template) {
    // Template-based PDF generation
    // This would be implemented based on specific template requirements
  }
}

/**
 * Sharing System
 */
class SharingSystem {
  constructor() {
    this.shareProviders = new Map();
    this.shareHistory = [];
    this.embedTemplates = new Map();

    this.setupBuiltinProviders();
  }

  /**
   * Setup built-in sharing providers
   */
  setupBuiltinProviders() {
    this.registerProvider(ShareMethods.LINK, new LinkSharingProvider());
    this.registerProvider(ShareMethods.EMAIL, new EmailSharingProvider());
    this.registerProvider(ShareMethods.SOCIAL, new SocialSharingProvider());
    this.registerProvider(ShareMethods.EMBED, new EmbedSharingProvider());
    this.registerProvider(ShareMethods.QR_CODE, new QRCodeSharingProvider());
  }

  /**
   * Register sharing provider
   */
  registerProvider(method, provider) {
    this.shareProviders.set(method, provider);
  }

  /**
   * Share content
   */
  async share(options = {}) {
    const {
      method,
      content,
      title,
      description,
      url,
      image,
      platform,
      recipients,
      settings = {}
    } = options;

    if (!this.shareProviders.has(method)) {
      throw new Error(`Unsupported sharing method: ${method}`);
    }

    const shareData = {
      content,
      title: title || 'Visualization from Lips Aesthetics Platform',
      description: description || 'Check out this visualization',
      url: url || window.location.href,
      image,
      platform,
      recipients,
      settings,
      timestamp: Date.now()
    };

    const provider = this.shareProviders.get(method);
    const result = await provider.share(shareData);

    // Save to history
    this.shareHistory.push({
      ...shareData,
      method,
      result,
      sharedAt: new Date().toISOString()
    });

    return result;
  }

  /**
   * Generate shareable link
   */
  async generateShareableLink(data, options = {}) {
    const {
      expires = null,
      password = null,
      downloadable = true,
      viewOnly = false
    } = options;

    // In a real implementation, this would save to a backend service
    const shareId = this.generateShareId();
    const shareData = {
      id: shareId,
      data,
      options: {
        expires,
        password,
        downloadable,
        viewOnly
      },
      createdAt: new Date().toISOString(),
      accessCount: 0
    };

    // Store temporarily (in real app, would use backend)
    localStorage.setItem(`share_${shareId}`, JSON.stringify(shareData));

    const baseUrl = window.location.origin;
    return `${baseUrl}/share/${shareId}`;
  }

  /**
   * Generate embed code
   */
  generateEmbedCode(url, options = {}) {
    const {
      width = '100%',
      height = '400px',
      responsive = true,
      border = false,
      theme = 'light'
    } = options;

    const embedId = this.generateShareId();
    const embedUrl = `${url}?embed=true&theme=${theme}`;

    if (responsive) {
      return `
<div style="position: relative; width: ${width}; height: 0; padding-bottom: 56.25%;">
  <iframe
    src="${embedUrl}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; ${border ? 'border: 1px solid #ddd;' : 'border: none;'}"
    frameborder="0"
    allowfullscreen
    title="Lips Aesthetics Visualization"
  ></iframe>
</div>`;
    } else {
      return `
<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  ${border ? 'style="border: 1px solid #ddd;"' : 'frameborder="0"'}
  allowfullscreen
  title="Lips Aesthetics Visualization"
></iframe>`;
    }
  }

  /**
   * Generate QR code for sharing
   */
  async generateQRCode(url, options = {}) {
    const { size = 200, format = 'png' } = options;

    // Use QR code library (qrcode.js or similar)
    if (typeof QRCode !== 'undefined') {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, url, {
        width: size,
        height: size,
        margin: 2
      });

      return {
        canvas,
        dataURL: canvas.toDataURL(`image/${format}`),
        url
      };
    }

    // Fallback to online QR service
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
    return { url: qrUrl, originalUrl: url };
  }

  /**
   * Generate unique share ID
   */
  generateShareId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get share history
   */
  getShareHistory() {
    return this.shareHistory.slice(-50); // Last 50 shares
  }
}

/**
 * Link Sharing Provider
 */
class LinkSharingProvider {
  async share(data) {
    const { url, title } = data;

    if (navigator.share) {
      // Use native Web Share API if available
      try {
        await navigator.share({ url, title });
        return { success: true, method: 'native' };
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn('Native sharing failed:', error);
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, method: 'clipboard', url };
    } catch (error) {
      throw new Error('Failed to copy link to clipboard');
    }
  }
}

/**
 * Email Sharing Provider
 */
class EmailSharingProvider {
  async share(data) {
    const { url, title, description, recipients = [] } = data;

    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description}\n\nView here: ${url}`);
    const to = recipients.join(',');

    const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;

    // Open email client
    window.location.href = mailtoUrl;

    return { success: true, method: 'email', recipients: recipients.length };
  }
}

/**
 * Social Sharing Provider
 */
class SocialSharingProvider {
  async share(data) {
    const { platform, url, title, description, image } = data;

    const shareUrls = {
      [SocialPlatforms.TWITTER]: this.getTwitterUrl(url, title),
      [SocialPlatforms.FACEBOOK]: this.getFacebookUrl(url),
      [SocialPlatforms.LINKEDIN]: this.getLinkedInUrl(url, title, description),
      [SocialPlatforms.WECHAT]: this.getWeChatUrl(url, title),
      [SocialPlatforms.WEIBO]: this.getWeiboUrl(url, title)
    };

    const shareUrl = shareUrls[platform];
    if (!shareUrl) {
      throw new Error(`Unsupported social platform: ${platform}`);
    }

    // Open sharing window
    const popup = window.open(
      shareUrl,
      'share',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    );

    return { success: true, platform, popup };
  }

  getTwitterUrl(url, title) {
    const text = encodeURIComponent(title);
    return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`;
  }

  getFacebookUrl(url) {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }

  getLinkedInUrl(url, title, description) {
    const params = new URLSearchParams({
      mini: 'true',
      url: url,
      title: title,
      summary: description
    });
    return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
  }

  getWeChatUrl(url, title) {
    // WeChat sharing typically requires their SDK
    return `https://api.weixin.qq.com/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  }

  getWeiboUrl(url, title) {
    const text = encodeURIComponent(`${title} ${url}`);
    return `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${text}`;
  }
}

// Additional provider classes would be implemented here...
class EmbedSharingProvider {
  async share(data) { /* Implementation */ }
}

class QRCodeSharingProvider {
  async share(data) { /* Implementation */ }
}

// Additional exporter classes...
class JPEGExporter extends BaseExporter { /* Implementation */ }
class SVGExporter extends BaseExporter { /* Implementation */ }
class WebPExporter extends BaseExporter { /* Implementation */ }
class ExcelExporter extends BaseExporter { /* Implementation */ }
class XMLExporter extends BaseExporter { /* Implementation */ }
class HTMLExporter extends BaseExporter { /* Implementation */ }
class CSSExporter extends BaseExporter { /* Implementation */ }
class JSExporter extends BaseExporter { /* Implementation */ }
class ZipExporter extends BaseExporter { /* Implementation */ }

// Global instances
const exportEngine = new ExportEngine();
const sharingSystem = new SharingSystem();

// Export system
window.ExportSharingSystem = {
  ExportEngine: exportEngine,
  SharingSystem: sharingSystem,
  ExportFormats,
  ShareMethods,
  SocialPlatforms,
  BaseExporter,
  PNGExporter,
  JSONExporter,
  CSVExporter,
  PDFExporter
};

console.log('📤 Export and Sharing System initialized');
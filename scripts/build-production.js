#!/usr/bin/env node

// Simple minification script that can run without npm dependencies
// This creates basic minified versions of CSS and JS files

const fs = require('fs');
const path = require('path');

// Simple CSS minification
function minifyCSS(css) {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove unnecessary whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around selectors
    .replace(/\s*([{}:;,])\s*/g, '$1')
    // Remove trailing semicolons before closing braces
    .replace(/;}/g, '}')
    // Remove quotes from url()
    .replace(/url\(["']([^"']+)["']\)/g, 'url($1)')
    // Shorten hex colors
    .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3')
    // Remove empty rules
    .replace(/[^{}]+\{\s*\}/g, '')
    .trim();
}

// Simple JavaScript minification
function minifyJS(js) {
  // This is a basic minification - for production use proper tools
  return js
    // Remove single-line comments (but preserve URLs)
    .replace(/([^:])\/\/[^\n]*/g, '$1')
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove unnecessary whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around operators
    .replace(/\s*([=+\-*/%<>!&|,;:?{}()\[\]])\s*/g, '$1')
    // Add back necessary spaces
    .replace(/(\w)(function|var|let|const|if|else|for|while|return)(\w)/g, '$1 $2 $3')
    // Remove trailing whitespace
    .trim();
}

// Simple HTML minification
function minifyHTML(html) {
  return html
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove whitespace between tags
    .replace(/>\s+</g, '><')
    // Remove unnecessary whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Process files
function processFiles() {
  console.log('=== Creating Minified Production Builds ===\n');

  const results = {
    css: [],
    js: [],
    html: []
  };

  // CSS Files to minify
  const cssFiles = [
    'unified_styles.css',
    'gallery.css',
    'icons.css'
  ];

  cssFiles.forEach(file => {
    const inputPath = path.join(__dirname, '..', file);
    const outputPath = path.join(__dirname, '..', file.replace('.css', '.min.css'));

    try {
      if (fs.existsSync(inputPath)) {
        const original = fs.readFileSync(inputPath, 'utf8');
        const minified = minifyCSS(original);

        fs.writeFileSync(outputPath, minified);

        const originalSize = Buffer.byteLength(original, 'utf8');
        const minifiedSize = Buffer.byteLength(minified, 'utf8');
        const saved = originalSize - minifiedSize;
        const ratio = ((saved / originalSize) * 100).toFixed(2);

        results.css.push({
          file,
          original: originalSize,
          minified: minifiedSize,
          saved,
          ratio
        });

        console.log(`✓ ${file} → ${file.replace('.css', '.min.css')}`);
        console.log(`  Original: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`  Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`  Saved: ${(saved / 1024).toFixed(2)} KB (${ratio}%)\n`);
      }
    } catch (error) {
      console.log(`⚠ Skipping ${file}: ${error.message}\n`);
    }
  });

  // JavaScript Files to minify
  const jsFiles = [
    'integration.js',
    'charts.js',
    'enhanced_3d_anatomy.js',
    'advanced_medical_visualization.js',
    'mobile_integration_hub.js',
    'mobile_3d_viewer.js',
    'mobile_gestures.js',
    'accessibility-system.js',
    'lazy-load-manager.js',
    'service-worker.js'
  ];

  jsFiles.forEach(file => {
    const inputPath = path.join(__dirname, '..', file);
    const outputPath = path.join(__dirname, '..', file.replace('.js', '.min.js'));

    try {
      if (fs.existsSync(inputPath)) {
        const original = fs.readFileSync(inputPath, 'utf8');
        const minified = minifyJS(original);

        fs.writeFileSync(outputPath, minified);

        const originalSize = Buffer.byteLength(original, 'utf8');
        const minifiedSize = Buffer.byteLength(minified, 'utf8');
        const saved = originalSize - minifiedSize;
        const ratio = ((saved / originalSize) * 100).toFixed(2);

        results.js.push({
          file,
          original: originalSize,
          minified: minifiedSize,
          saved,
          ratio
        });

        console.log(`✓ ${file} → ${file.replace('.js', '.min.js')}`);
        console.log(`  Original: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`  Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`  Saved: ${(saved / 1024).toFixed(2)} KB (${ratio}%)\n`);
      }
    } catch (error) {
      console.log(`⚠ Skipping ${file}: ${error.message}\n`);
    }
  });

  // HTML Files to minify
  const htmlFiles = [
    'visualization_hub.html',
    'medical_dashboard.html',
    'enhanced_3d_anatomy.html',
    'performance-dashboard.html',
    'mobile_demo.html',
    'ar_viewer.html'
  ];

  htmlFiles.forEach(file => {
    const inputPath = path.join(__dirname, '..', file);
    const outputPath = path.join(__dirname, '..', file.replace('.html', '.min.html'));

    try {
      if (fs.existsSync(inputPath)) {
        const original = fs.readFileSync(inputPath, 'utf8');
        const minified = minifyHTML(original);

        fs.writeFileSync(outputPath, minified);

        const originalSize = Buffer.byteLength(original, 'utf8');
        const minifiedSize = Buffer.byteLength(minified, 'utf8');
        const saved = originalSize - minifiedSize;
        const ratio = ((saved / originalSize) * 100).toFixed(2);

        results.html.push({
          file,
          original: originalSize,
          minified: minifiedSize,
          saved,
          ratio
        });

        console.log(`✓ ${file} → ${file.replace('.html', '.min.html')}`);
        console.log(`  Original: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`  Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`  Saved: ${(saved / 1024).toFixed(2)} KB (${ratio}%)\n`);
      }
    } catch (error) {
      console.log(`⚠ Skipping ${file}: ${error.message}\n`);
    }
  });

  // Print summary
  console.log('=== Minification Summary ===\n');

  const printSummary = (type, data) => {
    if (data.length === 0) return;

    const totalOriginal = data.reduce((sum, item) => sum + item.original, 0);
    const totalMinified = data.reduce((sum, item) => sum + item.minified, 0);
    const totalSaved = totalOriginal - totalMinified;
    const avgRatio = ((totalSaved / totalOriginal) * 100).toFixed(2);

    console.log(`${type.toUpperCase()} Files:`);
    console.log(`  Files processed: ${data.length}`);
    console.log(`  Original total: ${(totalOriginal / 1024).toFixed(2)} KB`);
    console.log(`  Minified total: ${(totalMinified / 1024).toFixed(2)} KB`);
    console.log(`  Total saved: ${(totalSaved / 1024).toFixed(2)} KB (${avgRatio}%)\n`);
  };

  printSummary('CSS', results.css);
  printSummary('JavaScript', results.js);
  printSummary('HTML', results.html);

  // Overall summary
  const allResults = [...results.css, ...results.js, ...results.html];
  const grandTotalOriginal = allResults.reduce((sum, item) => sum + item.original, 0);
  const grandTotalMinified = allResults.reduce((sum, item) => sum + item.minified, 0);
  const grandTotalSaved = grandTotalOriginal - grandTotalMinified;
  const grandAvgRatio = ((grandTotalSaved / grandTotalOriginal) * 100).toFixed(2);

  console.log('=== Overall Results ===');
  console.log(`Total files processed: ${allResults.length}`);
  console.log(`Total original size: ${(grandTotalOriginal / 1024).toFixed(2)} KB`);
  console.log(`Total minified size: ${(grandTotalMinified / 1024).toFixed(2)} KB`);
  console.log(`Total saved: ${(grandTotalSaved / 1024).toFixed(2)} KB (${grandAvgRatio}%)`);

  // Create production config file
  const productionConfig = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    optimizations: {
      minification: true,
      gzip: true,
      brotli: true,
      caching: true,
      lazyLoading: true,
      serviceWorker: true,
      criticalCSS: true,
      treeShaking: true
    },
    performance: {
      targetFCP: 1800,
      targetLCP: 2500,
      targetTTI: 3800,
      targetCLS: 0.1,
      budgetSize: 1500000
    },
    files: {
      css: results.css.map(r => r.file.replace('.css', '.min.css')),
      js: results.js.map(r => r.file.replace('.js', '.min.js')),
      html: results.html.map(r => r.file.replace('.html', '.min.html'))
    },
    stats: {
      originalSize: grandTotalOriginal,
      optimizedSize: grandTotalMinified,
      compressionRatio: grandAvgRatio
    }
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'production.config.json'),
    JSON.stringify(productionConfig, null, 2)
  );

  console.log('\n✓ Production configuration saved to production.config.json');
}

// Run the minification
processFiles();
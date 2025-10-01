const fs = require('fs').promises;
const path = require('path');
const postcss = require('postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');
const purgecss = require('@fullhuman/postcss-purgecss');

// CSS optimization configuration
const cssOptimizationConfig = {
  cssnano: {
    preset: ['advanced', {
      discardComments: { removeAll: true },
      reduceIdents: true,
      mergeIdents: true,
      discardUnused: true,
      minifySelectors: true,
      minifyParams: true,
      minifyFontValues: { removeQuotes: true },
      normalizeWhitespace: true,
      colormin: true,
      calc: true,
      convertValues: {
        length: true,
        time: true,
        angle: true
      },
      orderedValues: true,
      minifyGradients: true,
      cssDeclarationSorter: { order: 'smacss' },
      uniqueSelectors: true,
      mergeRules: true,
      mergeLonghand: true,
      discardDuplicates: true,
      discardOverridden: true,
      normalizeCharset: true,
      minifyFontWeight: true,
      normalizeUrl: { stripWWW: false },
      fontVariant: true,
      colorOptimize: true,
      zindex: true,
      svgo: true
    }]
  },
  purgecss: {
    content: [
      './src/**/*.html',
      './src/**/*.js',
      './*.html',
      './*.js'
    ],
    defaultExtractor: content => {
      const broadMatches = content.match(/[^<>"'`\\s]*[^<>"'`\\s:]/g) || [];
      const innerMatches = content.match(/[^<>"'`\\s.()]*[^<>"'`\\s.():]/g) || [];
      return broadMatches.concat(innerMatches);
    },
    safelist: {
      standard: [
        /^(sm|md|lg|xl|2xl):/,
        /^(hover|focus|active|disabled|visited):/,
        /^animate-/,
        /^transition-/,
        /^transform/,
        /^scale-/,
        /^rotate-/,
        /^translate-/,
        /^skew-/,
        /^origin-/,
        /^filter/,
        /^backdrop/,
        /^gradient/,
        /^shadow/,
        /^ring/,
        /^divide/,
        /^space/,
        /^placeholder/,
        /^opacity-/,
        /^bg-opacity-/,
        /^text-opacity-/,
        /^border-opacity-/
      ],
      deep: [/^chart/, /^medical/, /^visualization/, /^three/],
      greedy: [/modal/, /tooltip/, /dropdown/, /popover/]
    },
    fontFace: true,
    keyframes: true,
    variables: true
  }
};

async function minifyCSS(inputPath, outputPath) {
  try {
    const css = await fs.readFile(inputPath, 'utf8');

    // Apply PostCSS plugins
    const result = await postcss([
      autoprefixer({
        overrideBrowserslist: ['>0.2%', 'not dead', 'not op_mini all'],
        grid: 'autoplace'
      }),
      purgecss(cssOptimizationConfig.purgecss),
      cssnano(cssOptimizationConfig.cssnano)
    ]).process(css, {
      from: inputPath,
      to: outputPath,
      map: { inline: false }
    });

    // Write minified CSS
    await fs.writeFile(outputPath, result.css);

    // Write source map if generated
    if (result.map) {
      await fs.writeFile(`${outputPath}.map`, result.map.toString());
    }

    // Calculate compression stats
    const originalSize = Buffer.byteLength(css, 'utf8');
    const minifiedSize = Buffer.byteLength(result.css, 'utf8');
    const compressionRatio = ((1 - minifiedSize / originalSize) * 100).toFixed(2);

    return {
      file: path.basename(inputPath),
      originalSize,
      minifiedSize,
      compressionRatio,
      saved: originalSize - minifiedSize
    };
  } catch (error) {
    console.error(`Error minifying ${inputPath}:`, error);
    throw error;
  }
}

async function extractCriticalCSS(htmlPath, cssPath) {
  const critical = require('critical');

  try {
    const { css, html } = await critical.generate({
      base: path.dirname(htmlPath),
      src: path.basename(htmlPath),
      css: [cssPath],
      width: 1920,
      height: 1080,
      inline: true,
      extract: true,
      penthouse: {
        blockJSRequests: false,
        timeout: 30000
      }
    });

    return { css, html };
  } catch (error) {
    console.error(`Error extracting critical CSS:`, error);
    throw error;
  }
}

async function processAllCSS() {
  const cssFiles = [
    'unified_styles.css',
    'gallery.css',
    'icons.css'
  ];

  const stats = [];

  for (const file of cssFiles) {
    const inputPath = path.join(__dirname, '..', file);
    const outputPath = path.join(__dirname, '..', file.replace('.css', '.min.css'));

    try {
      const result = await minifyCSS(inputPath, outputPath);
      stats.push(result);
      console.log(`✓ Minified ${file} - Saved ${result.saved} bytes (${result.compressionRatio}% reduction)`);
    } catch (error) {
      console.error(`✗ Failed to minify ${file}`);
    }
  }

  // Print summary
  const totalOriginal = stats.reduce((sum, s) => sum + s.originalSize, 0);
  const totalMinified = stats.reduce((sum, s) => sum + s.minifiedSize, 0);
  const totalSaved = totalOriginal - totalMinified;
  const avgCompression = ((1 - totalMinified / totalOriginal) * 100).toFixed(2);

  console.log('\n=== CSS Optimization Summary ===');
  console.log(`Total files processed: ${stats.length}`);
  console.log(`Original size: ${(totalOriginal / 1024).toFixed(2)} KB`);
  console.log(`Minified size: ${(totalMinified / 1024).toFixed(2)} KB`);
  console.log(`Total saved: ${(totalSaved / 1024).toFixed(2)} KB`);
  console.log(`Average compression: ${avgCompression}%`);

  // Generate critical CSS for main HTML files
  console.log('\n=== Extracting Critical CSS ===');
  const htmlFiles = [
    'visualization_hub.html',
    'medical_dashboard.html',
    'enhanced_3d_anatomy.html'
  ];

  for (const htmlFile of htmlFiles) {
    try {
      const htmlPath = path.join(__dirname, '..', htmlFile);
      const cssPath = path.join(__dirname, '..', 'unified_styles.min.css');

      // Check if files exist before processing
      if (await fs.access(htmlPath).then(() => true).catch(() => false)) {
        const { css, html } = await extractCriticalCSS(htmlPath, cssPath);

        // Save critical CSS
        const criticalPath = path.join(__dirname, '..', htmlFile.replace('.html', '.critical.css'));
        await fs.writeFile(criticalPath, css);

        // Save optimized HTML with inlined critical CSS
        const optimizedHtmlPath = path.join(__dirname, '..', htmlFile.replace('.html', '.optimized.html'));
        await fs.writeFile(optimizedHtmlPath, html);

        console.log(`✓ Generated critical CSS for ${htmlFile}`);
      }
    } catch (error) {
      console.error(`✗ Failed to extract critical CSS for ${htmlFile}`);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  processAllCSS().catch(console.error);
}

module.exports = { minifyCSS, extractCriticalCSS, processAllCSS };
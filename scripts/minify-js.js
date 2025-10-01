const fs = require('fs').promises;
const path = require('path');
const { minify } = require('terser');
const { rollup } = require('rollup');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { babel } = require('@rollup/plugin-babel');
const replace = require('@rollup/plugin-replace');

// JavaScript optimization configuration
const jsOptimizationConfig = {
  terser: {
    ecma: 2020,
    module: true,
    toplevel: true,
    compress: {
      ecma: 2020,
      module: true,
      toplevel: true,
      arrows: true,
      drop_console: true,
      drop_debugger: true,
      passes: 3,
      pure_getters: true,
      unsafe: true,
      unsafe_arrows: true,
      unsafe_comps: true,
      unsafe_Function: true,
      unsafe_math: true,
      unsafe_methods: true,
      unsafe_proto: true,
      unsafe_regexp: true,
      unsafe_symbols: true,
      unused: true,
      dead_code: true,
      conditionals: true,
      comparisons: true,
      evaluate: true,
      booleans: true,
      typeofs: true,
      loops: true,
      properties: true,
      hoist_funs: true,
      hoist_vars: false,
      if_return: true,
      join_vars: true,
      reduce_vars: true,
      side_effects: true,
      switches: true,
      computed_props: true,
      negate_iife: true,
      inline: true,
      pure_funcs: [
        'console.log',
        'console.info',
        'console.debug',
        'console.warn',
        'console.trace'
      ],
      global_defs: {
        '@DEBUG': false,
        '@PRODUCTION': true
      }
    },
    mangle: {
      toplevel: true,
      properties: {
        regex: /^_/,
        reserved: ['__proto__', '__esModule']
      }
    },
    format: {
      ecma: 2020,
      comments: false,
      ascii_only: true,
      wrap_iife: true,
      wrap_func_args: true
    }
  },
  rollup: {
    input: {
      preserveEntrySignatures: false,
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
        correctVarValueBeforeDeclaration: true,
        manualPureFunctions: ['console.log', 'console.info']
      }
    },
    output: {
      format: 'es',
      compact: true,
      generatedCode: {
        arrowFunctions: true,
        constBindings: true,
        objectShorthand: true,
        reservedNamesAsProps: false,
        symbols: true
      }
    }
  }
};

async function minifyJS(inputPath, outputPath) {
  try {
    const code = await fs.readFile(inputPath, 'utf8');

    // Minify with Terser
    const result = await minify(code, {
      ...jsOptimizationConfig.terser,
      sourceMap: {
        filename: path.basename(outputPath),
        url: `${path.basename(outputPath)}.map`
      }
    });

    if (result.error) {
      throw result.error;
    }

    // Write minified JS
    await fs.writeFile(outputPath, result.code);

    // Write source map
    if (result.map) {
      await fs.writeFile(`${outputPath}.map`, result.map);
    }

    // Calculate compression stats
    const originalSize = Buffer.byteLength(code, 'utf8');
    const minifiedSize = Buffer.byteLength(result.code, 'utf8');
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

async function bundleAndTreeShake(entryPoint, outputPath) {
  try {
    // Create bundle with tree shaking
    const bundle = await rollup({
      input: entryPoint,
      ...jsOptimizationConfig.rollup.input,
      plugins: [
        replace({
          preventAssignment: true,
          'process.env.NODE_ENV': JSON.stringify('production'),
          '__DEV__': false,
          '__PROD__': true
        }),
        nodeResolve({
          browser: true,
          preferBuiltins: false,
          extensions: ['.js', '.jsx', '.mjs']
        }),
        commonjs({
          include: /node_modules/,
          sourceMap: false,
          transformMixedEsModules: true
        }),
        babel({
          babelHelpers: 'bundled',
          exclude: 'node_modules/**',
          presets: [
            ['@babel/preset-env', {
              targets: { browsers: ['>0.25%', 'not dead'] },
              modules: false,
              loose: true
            }]
          ],
          plugins: [
            '@babel/plugin-transform-runtime',
            ['transform-remove-console', { exclude: ['error'] }]
          ]
        })
      ],
      onwarn(warning, warn) {
        // Suppress certain warnings
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.code === 'EVAL') return;
        warn(warning);
      }
    });

    // Generate output
    const { output } = await bundle.generate(jsOptimizationConfig.rollup.output);

    // Minify bundled code
    const minified = await minify(output[0].code, jsOptimizationConfig.terser);

    // Write final output
    await fs.writeFile(outputPath, minified.code);
    if (minified.map) {
      await fs.writeFile(`${outputPath}.map`, minified.map);
    }

    // Close bundle
    await bundle.close();

    return {
      originalSize: output[0].code.length,
      minifiedSize: minified.code.length,
      compressionRatio: ((1 - minified.code.length / output[0].code.length) * 100).toFixed(2)
    };
  } catch (error) {
    console.error(`Error bundling ${entryPoint}:`, error);
    throw error;
  }
}

async function createCodeSplittedBundles() {
  // Create lazy-loadable chunks
  const lazyLoadConfig = `
// Lazy load heavy dependencies
const loadThree = () => import(/* webpackChunkName: "three" */ 'three');
const loadCharts = () => import(/* webpackChunkName: "charts" */ './charts.js');
const loadMedical = () => import(/* webpackChunkName: "medical" */ './medical_dashboard.js');
const load3D = () => import(/* webpackChunkName: "3d" */ './enhanced_3d_anatomy.js');

// Intersection Observer for lazy loading
const lazyLoadObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const element = entry.target;
      const loader = element.dataset.loader;

      switch(loader) {
        case 'three':
          loadThree().then(module => {
            window.THREE = module;
            element.dispatchEvent(new CustomEvent('three-loaded'));
          });
          break;
        case 'charts':
          loadCharts().then(module => {
            window.Charts = module;
            element.dispatchEvent(new CustomEvent('charts-loaded'));
          });
          break;
        case 'medical':
          loadMedical().then(module => {
            window.MedicalDashboard = module;
            element.dispatchEvent(new CustomEvent('medical-loaded'));
          });
          break;
        case '3d':
          load3D().then(module => {
            window.Anatomy3D = module;
            element.dispatchEvent(new CustomEvent('3d-loaded'));
          });
          break;
      }

      lazyLoadObserver.unobserve(element);
    }
  });
}, {
  rootMargin: '50px 0px',
  threshold: 0.01
});

// Auto-observe elements with data-loader attribute
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-loader]').forEach(el => {
    lazyLoadObserver.observe(el);
  });
});

export { loadThree, loadCharts, loadMedical, load3D, lazyLoadObserver };
`;

  await fs.writeFile(
    path.join(__dirname, '..', 'lazy-loader.js'),
    lazyLoadConfig
  );
}

async function processAllJS() {
  const jsFiles = [
    'integration.js',
    'charts.js',
    'enhanced_3d_anatomy.js',
    'advanced_medical_visualization.js',
    'mobile_integration_hub.js',
    'mobile_3d_viewer.js',
    'mobile_gestures.js',
    'accessibility-system.js'
  ];

  const stats = [];

  for (const file of jsFiles) {
    const inputPath = path.join(__dirname, '..', file);
    const outputPath = path.join(__dirname, '..', file.replace('.js', '.min.js'));

    // Check if file exists
    try {
      await fs.access(inputPath);
      const result = await minifyJS(inputPath, outputPath);
      stats.push(result);
      console.log(`✓ Minified ${file} - Saved ${result.saved} bytes (${result.compressionRatio}% reduction)`);
    } catch (error) {
      console.log(`⚠ Skipping ${file} (file not found)`);
    }
  }

  // Create lazy loading configuration
  await createCodeSplittedBundles();
  console.log('✓ Created lazy loading configuration');

  // Print summary
  if (stats.length > 0) {
    const totalOriginal = stats.reduce((sum, s) => sum + s.originalSize, 0);
    const totalMinified = stats.reduce((sum, s) => sum + s.minifiedSize, 0);
    const totalSaved = totalOriginal - totalMinified;
    const avgCompression = ((1 - totalMinified / totalOriginal) * 100).toFixed(2);

    console.log('\n=== JavaScript Optimization Summary ===');
    console.log(`Total files processed: ${stats.length}`);
    console.log(`Original size: ${(totalOriginal / 1024).toFixed(2)} KB`);
    console.log(`Minified size: ${(totalMinified / 1024).toFixed(2)} KB`);
    console.log(`Total saved: ${(totalSaved / 1024).toFixed(2)} KB`);
    console.log(`Average compression: ${avgCompression}%`);
  }
}

// Run if executed directly
if (require.main === module) {
  processAllJS().catch(console.error);
}

module.exports = { minifyJS, bundleAndTreeShake, processAllJS };
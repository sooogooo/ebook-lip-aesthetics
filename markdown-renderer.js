/**
 * Markdown Document Rendering System
 * Professional markdown-to-HTML converter with Chinese support
 * 专业的Markdown文档渲染系统，完美支持中文内容
 */

class MarkdownRenderer {
    constructor() {
        this.config = {
            enableHighlight: true,
            enableTOC: true,
            enableMermaid: true,
            enableMath: true,
            theme: 'default',
            fontFamily: '"Microsoft YaHei", "微软雅黑", "PingFang SC", "苹方", "Hiragino Sans GB", "Heiti SC", "Source Han Sans CN", sans-serif'
        };

        this.headings = [];
        this.currentId = 0;
    }

    /**
     * Render markdown content to HTML
     */
    render(markdown) {
        if (!markdown) return '';

        // Reset headings for TOC
        this.headings = [];
        this.currentId = 0;

        let html = markdown;

        // Process in order
        html = this.processCodeBlocks(html);
        html = this.processHeadings(html);
        html = this.processLists(html);
        html = this.processBlockquotes(html);
        html = this.processTables(html);
        html = this.processEmphasis(html);
        html = this.processLinks(html);
        html = this.processImages(html);
        html = this.processParagraphs(html);
        html = this.processLineBreaks(html);

        return html;
    }

    /**
     * Process code blocks with syntax highlighting
     */
    processCodeBlocks(text) {
        // Fenced code blocks with language
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'plaintext';
            const escaped = this.escapeHtml(code.trim());
            return `<pre class="code-block"><code class="language-${language}" data-lang="${language}">${escaped}</code></pre>`;
        });

        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        return text;
    }

    /**
     * Process headings and build TOC
     */
    processHeadings(text) {
        return text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
            const level = hashes.length;
            const id = `heading-${++this.currentId}`;

            // Add to TOC
            this.headings.push({
                id,
                level,
                text: content,
                anchor: this.slugify(content)
            });

            return `<h${level} id="${id}" class="markdown-heading level-${level}">
                <a href="#${id}" class="heading-anchor">#</a>
                ${content}
            </h${level}>`;
        });
    }

    /**
     * Process lists (ordered and unordered)
     */
    processLists(text) {
        // Unordered lists
        text = text.replace(/^(\s*)[-*+]\s+(.+)$/gm, (match, indent, content) => {
            const level = Math.floor(indent.length / 2);
            return `<ul class="markdown-list level-${level}"><li>${content}</li></ul>`;
        });

        // Ordered lists
        text = text.replace(/^(\s*)(\d+)\.\s+(.+)$/gm, (match, indent, num, content) => {
            const level = Math.floor(indent.length / 2);
            return `<ol class="markdown-list level-${level}" start="${num}"><li>${content}</li></ol>`;
        });

        // Merge consecutive list items
        text = text.replace(/<\/ul>\n<ul[^>]*>/g, '');
        text = text.replace(/<\/ol>\n<ol[^>]*>/g, '');

        return text;
    }

    /**
     * Process blockquotes
     */
    processBlockquotes(text) {
        return text.replace(/^>\s+(.+)$/gm, '<blockquote class="markdown-blockquote">$1</blockquote>')
            .replace(/<\/blockquote>\n<blockquote[^>]*>/g, '\n');
    }

    /**
     * Process tables
     */
    processTables(text) {
        const tableRegex = /^\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/gm;

        return text.replace(tableRegex, (match, header, body) => {
            const headers = header.split('|').filter(h => h.trim());
            const rows = body.trim().split('\n').map(row =>
                row.split('|').filter(cell => cell !== undefined && cell !== '')
            );

            let table = '<table class="markdown-table">\n<thead>\n<tr>\n';
            headers.forEach(h => {
                table += `<th>${h.trim()}</th>\n`;
            });
            table += '</tr>\n</thead>\n<tbody>\n';

            rows.forEach(row => {
                table += '<tr>\n';
                row.forEach(cell => {
                    table += `<td>${cell.trim()}</td>\n`;
                });
                table += '</tr>\n';
            });

            table += '</tbody>\n</table>';
            return table;
        });
    }

    /**
     * Process emphasis (bold, italic, strikethrough)
     */
    processEmphasis(text) {
        // Bold
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');

        // Italic
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Strikethrough
        text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

        return text;
    }

    /**
     * Process links
     */
    processLinks(text) {
        // Links with title
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\s+"([^"]+)"\)/g,
            '<a href="$2" title="$3" class="markdown-link">$1</a>');

        // Links without title
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" class="markdown-link">$1</a>');

        // Auto-links
        text = text.replace(/<(https?:\/\/[^>]+)>/g,
            '<a href="$1" class="markdown-link">$1</a>');

        return text;
    }

    /**
     * Process images
     */
    processImages(text) {
        // Images with alt text
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
            '<img src="$2" alt="$1" class="markdown-image" loading="lazy">');

        // Images with title
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\s+"([^"]+)"\)/g,
            '<img src="$2" alt="$1" title="$3" class="markdown-image" loading="lazy">');

        return text;
    }

    /**
     * Process paragraphs
     */
    processParagraphs(text) {
        const lines = text.split('\n');
        const processed = [];
        let inBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line === '') {
                inBlock = false;
                processed.push('');
            } else if (this.isBlockElement(line)) {
                inBlock = false;
                processed.push(line);
            } else if (!inBlock) {
                inBlock = true;
                processed.push(`<p class="markdown-paragraph">${line}`);
            } else {
                processed.push(line);
            }

            if (inBlock && (i === lines.length - 1 || lines[i + 1].trim() === '' || this.isBlockElement(lines[i + 1]))) {
                processed[processed.length - 1] += '</p>';
                inBlock = false;
            }
        }

        return processed.join('\n');
    }

    /**
     * Process line breaks
     */
    processLineBreaks(text) {
        return text.replace(/  $/gm, '<br>');
    }

    /**
     * Check if line is a block element
     */
    isBlockElement(line) {
        return line.startsWith('<h') ||
               line.startsWith('<ul') ||
               line.startsWith('<ol') ||
               line.startsWith('<blockquote') ||
               line.startsWith('<pre') ||
               line.startsWith('<table') ||
               line.startsWith('<div');
    }

    /**
     * Generate table of contents
     */
    generateTOC() {
        if (this.headings.length === 0) return '';

        let toc = '<nav class="markdown-toc">\n';
        toc += '<h3 class="toc-title">目录</h3>\n';
        toc += '<ul class="toc-list">\n';

        let currentLevel = 0;
        this.headings.forEach(heading => {
            while (currentLevel < heading.level) {
                toc += '<ul class="toc-sublist">\n';
                currentLevel++;
            }
            while (currentLevel > heading.level) {
                toc += '</ul>\n';
                currentLevel--;
            }

            toc += `<li class="toc-item level-${heading.level}">
                <a href="#${heading.id}" class="toc-link">${heading.text}</a>
            </li>\n`;
        });

        while (currentLevel > 0) {
            toc += '</ul>\n';
            currentLevel--;
        }

        toc += '</ul>\n</nav>';
        return toc;
    }

    /**
     * Create slug from text
     */
    slugify(text) {
        return text.toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Escape HTML characters
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Apply syntax highlighting to code blocks
     */
    highlightCode(element) {
        const codeBlocks = element.querySelectorAll('pre code');

        codeBlocks.forEach(block => {
            const language = block.dataset.lang || 'plaintext';
            const code = block.textContent;

            if (this.config.enableHighlight && window.hljs) {
                try {
                    const highlighted = window.hljs.highlight(code, { language }).value;
                    block.innerHTML = highlighted;
                } catch (e) {
                    console.warn('Syntax highlighting failed:', e);
                }
            }
        });
    }

    /**
     * Setup smooth scrolling for TOC links
     */
    setupSmoothScroll(container) {
        const links = container.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);

                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update URL without scrolling
                    history.pushState(null, null, `#${targetId}`);
                }
            });
        });
    }

    /**
     * Render markdown file from URL
     */
    async renderFromFile(url, container) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

            const markdown = await response.text();
            const html = this.render(markdown);
            const toc = this.generateTOC();

            const fullContent = `
                <div class="markdown-container">
                    ${this.config.enableTOC ? `<aside class="markdown-sidebar">${toc}</aside>` : ''}
                    <article class="markdown-content">
                        ${html}
                    </article>
                </div>
            `;

            container.innerHTML = fullContent;

            // Post-processing
            this.highlightCode(container);
            this.setupSmoothScroll(container);

            return { html, toc, headings: this.headings };
        } catch (error) {
            console.error('Error rendering markdown:', error);
            container.innerHTML = `
                <div class="markdown-error">
                    <h3>加载失败</h3>
                    <p>无法加载文档：${error.message}</p>
                </div>
            `;
            return null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownRenderer;
}
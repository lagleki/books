const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const hljs = require('markdown-it-highlightjs');
const anchor = require('markdown-it-anchor');
const toc = require('markdown-it-toc-done-right');
const { JSDOM } = require('jsdom');
const { window } = new JSDOM('');
const DOMPurify = require('dompurify')(window);

// Configure markdown processor
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// Variables to store TOC data
let currentTocHtml = ''; // Variable to store TOC HTML for the current file
let currentTocData = []; // Variable to store structured TOC data

// Apply highlight.js
md.use(hljs);

// Configure anchor generation
md.use(anchor, {
  permalink: anchor.permalink.headerLink(),
  slugify: s => String(s).toLowerCase().replace(/[^\w]+/g, '-')
});

// Function to generate TOC from HTML using JSDOM
function generateTocFromHtml(html) {
  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const headings = doc.querySelectorAll('h1, h2, h3');
    
    if (headings.length === 0) {
      return {
        tocHtml: `
          <div class="toc-empty-notice p-4 bg-gray-100 dark:bg-slate-700 rounded-md">
            <p class="text-sm text-gray-600 dark:text-gray-300">No table of contents available</p>
          </div>
        `,
        tocData: [],
        updatedHtml: html
      };
    }
    
    let tocHtml = '<div class="toc"><ul>';
    const tocData = [];
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.slice(1));
      const text = heading.textContent;
      const id = heading.id || text.toLowerCase().replace(/[^\w]+/g, '-');
      
      // Ensure heading has ID for linking
      if (!heading.id) {
        heading.id = id;
      }
      
      tocHtml += `<li class="toc-item toc-level-${level}"><a href="#${id}" class="toc-link">${text}</a></li>`;
      tocData.push({ level, content: text, anchor: id });
    });
    
    tocHtml += '</ul></div>';
    
    // Use body innerHTML to avoid serializing the whole document (prevents nested <html> tags)
    const updatedHtml = doc.body.innerHTML;
    
    return {
      tocHtml: DOMPurify.sanitize(tocHtml),
      tocData,
      updatedHtml
    };
  } catch (error) {
    console.error('TOC generation from HTML error:', error);
    return {
      tocHtml: '',
      tocData: [],
      updatedHtml: html
    };
  }
}

// After markdown rendering, generate TOC from HTML
const originalRender = md.render;
md.render = function(...args) {
  let html = originalRender.apply(this, args);
  
  // Generate TOC from rendered HTML
  const { tocHtml, tocData, updatedHtml } = generateTocFromHtml(html);
  currentTocHtml = tocHtml;
  currentTocData = tocData;
  
  // Replace TOC placeholder if exists
  return updatedHtml.replace('[[toc]]', currentTocHtml);
};

// Custom link renderer to convert .md to .html
(function() {
  const defaultLinkOpen = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const hrefIndex = token.attrIndex('href');
    
    if (hrefIndex >= 0) {
      const href = token.attrs[hrefIndex][1];
      if (href.endsWith('.md')) {
        token.attrs[hrefIndex][1] = href.slice(0, -3) + '.html';
      }
    }
    
    return defaultLinkOpen(tokens, idx, options, env, self);
  };
})();

// Create output directories if they don't exist
fs.ensureDirSync('dist');
fs.ensureDirSync('temp');
fs.ensureDirSync('docs');

// Copy static assets (e.g. favicon) to docs
const staticDir = 'static';
if (fs.existsSync(staticDir)) {
  const staticFiles = fs.readdirSync(staticDir);
  staticFiles.forEach(file => {
    const src = path.join(staticDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copySync(src, path.join('docs', file));
    }
  });
}

// Read template file
const template = fs.readFileSync('templates/universal_book_template.html', 'utf8');
const tailwindCss = fs.readFileSync('dist/styles.css', 'utf8');

// Get ordered list of markdown files in a directory
function getOrderedMarkdownFiles(dir) {
  const files = fs.readdirSync(dir);
  const markdownFiles = files
    .filter(file => path.extname(file) === '.md')
    .sort()
    .map(file => path.join(dir, file));
  
  // Check for index.md to determine order
  const indexFile = path.join(dir, 'index.md');
  if (fs.existsSync(indexFile)) {
    const indexContent = fs.readFileSync(indexFile, 'utf8');
    const chapterOrder = indexContent
      .split('\n')
      .filter(line => line.match(/^\s*\*\s+\[.*\]\(.*\.md\)/))
      .map(line => line.match(/\(([^)]+\.md)\)/)[1]);
    
    if (chapterOrder.length > 0) {
      return chapterOrder.map(chapter => path.join(dir, chapter));
    }
  }
  
  return markdownFiles;
}

// Process all markdown files in data directory
function processMarkdownFiles() {
  const markdownFiles = getMarkdownFiles('data');
  
  // Group files by directory
  const filesByDir = {};
  markdownFiles.forEach(filePath => {
    const dir = path.dirname(filePath);
    if (!filesByDir[dir]) {
      filesByDir[dir] = getOrderedMarkdownFiles(dir);
    }
  });
  
  markdownFiles.forEach(filePath => {
    try {
      // Read markdown content
      const markdown = fs.readFileSync(filePath, 'utf8');
      // currentTocHtml is reset by the callback logic for each md.render() effectively,
      // but good practice to ensure it's clean if render is somehow called without toc generation.
      // However, the plugin's callback should handle this per render.
      // Let's ensure it's explicitly reset before md.render() if there's any doubt.
      // currentTocHtml reset handled by plugin callback

      // Extract first H1 from markdown
      let firstH1 = '';
      const h1Match = markdown.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1]) {
        firstH1 = h1Match[1].trim();
      }
      
      // Convert to HTML
      console.log(`Processing ${filePath}...`);
      console.log('Markdown content:', markdown.substr(0, 200) + '...');
      let html = md.render(markdown);
      console.log('Rendered HTML:', html.substr(0, 500) + '...');
      console.log(`TOC generated for ${filePath}:`, currentTocData.length ? 'Success' : 'Fallback');
      console.log(`TOC generated for ${filePath}:`, currentTocData.length ? 'Success' : 'Fallback');
      
      // Sanitize HTML
      html = DOMPurify.sanitize(html);
      
      // Get relative path for output
      const relativePath = path.relative('data', filePath);
      const outputPath = path.join('docs', path.dirname(relativePath));
      const outputFile = path.join(outputPath, path.basename(filePath, '.md') + '.html');
      
      // Process template - handle missing placeholders
      let finalHtml = template;
      if (finalHtml.includes('{%TAILWIND_CSS%}')) {
        finalHtml = finalHtml.replace('{%TAILWIND_CSS%}', tailwindCss);
      }
      if (finalHtml.includes('{%MARKDOWN_CONTENT%}')) {
        finalHtml = finalHtml.replace('{%MARKDOWN_CONTENT%}', html);
      }
      // Get navigation links
      const dir = path.dirname(filePath);
      const filesInDir = filesByDir[dir].sort((a, b) => {
        // Extract numbers from filenames for natural sorting
        const numA = parseInt(a.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.match(/\d+/)?.[0] || 0);
        return numA - numB;
      });
      const currentIndex = filesInDir.indexOf(filePath);
      const isIndexFile = path.basename(filePath) === 'index.md';
      
      let prevLink = '';
      let nextLink = '';
      let tocLink = '';
      
      if (isIndexFile) {
        // For index.md, only show first chapter link if available
        if (filesInDir.length > 1) {
          const firstChapter = filesInDir.find(f => path.basename(f) !== 'index.md');
          if (firstChapter) {
            nextLink = `<a href="${path.basename(firstChapter, '.md') + '.html'}" class="nav-link">
              <span>First chapter</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5-5 5M18 12H6"></path></svg>
            </a>`;
          } else {
            nextLink = `<span class="nav-link-disabled">No chapters</span>`;
          }
          prevLink = `<span class="nav-link-disabled"></span>`;
          tocLink = `<span class="nav-link-disabled">Book Index</span>`;
        }
      } else {
        // Regular behavior for non-index files
        // Previous link
        if (currentIndex > 0) {
          const prevFile = filesInDir[currentIndex - 1];
          const isIndex = path.basename(prevFile) === 'index.md';
          const prevFileName = isIndex ? 'Contents' : 'Previous';
          prevLink = `<a href="${path.basename(prevFile, '.md') + '.html'}" class="nav-link">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5 5-5M6 12h12"></path></svg>
            <span>${prevFileName}</span>
          </a>`;
        } else {
          prevLink = `<span class="nav-link-disabled"></span>`;
        }
        
        // Next link
        if (currentIndex < filesInDir.length - 1) {
          const nextFile = filesInDir[currentIndex + 1];
          nextLink = `<a href="${path.basename(nextFile, '.md') + '.html'}" class="nav-link">
            <span>Next</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5-5 5M18 12H6"></path></svg>
          </a>`;
        } else {
          nextLink = `<span class="nav-link-disabled">End</span>`;
        }
        
        // TOC link (points to index.html in current directory)
        // Check if current file is not index.md to show TOC link
        if (path.basename(filePath) !== 'index.md') {
            const indexFileInDir = filesInDir.find(f => path.basename(f) === 'index.md');
            if (indexFileInDir) {
                 tocLink = `<a href="index.html" class="nav-link">
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                   <span class="hidden sm:inline">Table of Contents</span>
                   <span class="sm:hidden">TOC</span>
                 </a>`;
            } else {
                tocLink = `<span class="nav-link-disabled">TOC</span>`;
            }
        } else {
             tocLink = `<span class="nav-link-disabled"></span>`;
        }
      }
      
      finalHtml = finalHtml
        .replace(/{{page_title}}/g, firstH1 || path.basename(filePath, '.md'))
        .replace(/{{nav_previous_link}}/g, prevLink)
        .replace(/{{nav_toc_link}}/g, tocLink)
        .replace(/{{nav_next_link}}/g, nextLink)
        .replace(/{%PAGE_TOC%}/g, currentTocHtml)
        .replace(/{%PAGE_TOC_DATA%}/g, JSON.stringify(currentTocData));
      
      // Ensure output directory exists
      fs.ensureDirSync(outputPath);
      
      // Write final HTML file
      fs.writeFileSync(outputFile, finalHtml);
      
      console.log(`Generated: ${outputFile}`);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
      process.exit(1);
    }
  });
}

// Recursively find all markdown files in directory (skips dot-directories like .specstory)
function getMarkdownFiles(dir) {
  const files = fs.readdirSync(dir);
  let markdownFiles = [];
  
  files.forEach(file => {
    if (file.startsWith('.')) return; // skip dot-files and dot-directories
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      markdownFiles = markdownFiles.concat(getMarkdownFiles(fullPath));
    } else if (path.extname(file) === '.md') {
      markdownFiles.push(fullPath);
    }
  });
  
  return markdownFiles;
}

// Run the build
processMarkdownFiles();
generateAllBooksPage();

// Generate the all-books' index.html page listing all available books
function generateAllBooksPage() {
  const booksDir = 'data';
  const outputFile = 'docs/index.html';
  
  // Get all book directories (exclude dot-directories like .specstory)
  const bookDirs = fs.readdirSync(booksDir)
    .filter(file => !file.startsWith('.') && fs.statSync(path.join(booksDir, file)).isDirectory());

  // Process each book to get its name and path; include every book, fallback name if no index H1
  const books = bookDirs.map(dir => {
    const bookPath = path.join(booksDir, dir);
    const name = getBookName(bookPath, dir) || dir.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return { name, path: dir };
  });

  // Generate HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>All Books – Lojban Booker</title>
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
  <style id="tailwind-styles">
    ${tailwindCss}
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen flex flex-col transition-colors duration-300">
  <div class="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:py-12 flex flex-col flex-grow">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
      <div class="flex-1 min-w-0">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">Library</h1>
        <p class="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">Discover a collection of books optimized for an immersive reading experience. Pick a title to start your journey.</p>
      </div>
      <button id="darkModeToggle" aria-label="Toggle dark mode" class="self-start sm:self-center p-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 transition-colors touch-manipulation flex-shrink-0">
        <svg id="theme-toggle-dark-icon" class="w-5 h-5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
        <svg id="theme-toggle-light-icon" class="hidden w-5 h-5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 10.607a1 1 0 011.414-1.414l-.707-.707a1 1 0 01-1.414 1.414l.707.707zm12.728 0l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
      </button>
    </header>

    <main class="flex-1">
      <ul class="space-y-4 sm:space-y-5" role="list">
        ${books.map(book => `
          <li>
            <a href="${book.path}/index.html" class="group block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-teal-500/30 dark:hover:border-teal-500/30 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-300 p-6 sm:p-8 lg:p-10 flex items-center justify-between gap-6">
              <h2 class="text-2xl sm:text-3xl font-serif font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">${book.name}</h2>
              <div class="flex-shrink-0 w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300" aria-hidden="true">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </a>
          </li>
        `).join('')}
      </ul>
      ${books.length === 0 ? '<p class="text-center text-slate-500 dark:text-slate-400 py-12">No books found. Run the build script to generate content.</p>' : ''}
    </main>

    <footer class="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
      <p>&copy; ${new Date().getFullYear()} Lojban Booker</p>
    </footer>
  </div>
  <script>
    // Dark Mode Toggle Script
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const darkModeToggle = document.getElementById('darkModeToggle');

    function updateIcons(isDark) {
        if (isDark) {
            themeToggleLightIcon.classList.remove('hidden'); // Show Sun icon
            themeToggleDarkIcon.classList.add('hidden');    // Hide Moon icon
        } else {
            themeToggleDarkIcon.classList.remove('hidden');  // Show Moon icon
            themeToggleLightIcon.classList.add('hidden');   // Hide Sun icon
        }
    }

    function applyTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        updateIcons(isDark);
        localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
    }

    // Initial theme application
    let initialUserPrefersDark = false;
    const storedUserTheme = localStorage.getItem('color-theme');

    if (storedUserTheme) {
        initialUserPrefersDark = storedUserTheme === 'dark';
    } else {
        initialUserPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme(initialUserPrefersDark);

    darkModeToggle.addEventListener('click', () => {
        const isCurrentlyDark = document.documentElement.classList.contains('dark');
        applyTheme(!isCurrentlyDark);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('color-theme') === null) { // Only if no user override
             applyTheme(e.matches);
        }
    });
  </script>
</body>
</html>
  `;

  // Write the file
  fs.writeFileSync(outputFile, htmlContent);
  console.log(`Generated: ${outputFile}`);
}

// Get book name from either index.md or index.html
function getBookName(bookPath, dirName) {
  // Try to get from index.md first
  const mdIndex = path.join(bookPath, 'index.md');
  if (fs.existsSync(mdIndex)) {
    const content = fs.readFileSync(mdIndex, 'utf8');
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match && h1Match[1]) {
      return h1Match[1].trim();
    }
  }

  // Fallback to index.html
  const htmlIndex = path.join('docs', dirName, 'index.html');
  if (fs.existsSync(htmlIndex)) {
    const content = fs.readFileSync(htmlIndex, 'utf8');
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      return h1Match[1].trim();
    }
  }

  // If neither works, return null (will be filtered out)
  return null;
}
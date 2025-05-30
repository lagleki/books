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
            <p极客 class="text-sm text-gray-600 dark:text-gray-300">No table of contents available</p>
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
    
    // Update the HTML with any added IDs
    const serializer = new dom.window.XMLSerializer();
    const updatedHtml = serializer.serializeToString(doc);
    
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
            nextLink = `<a href="${path.basename(firstChapter, '.md') + '.html'}" class="nav-link">First chapter</a>`;
          } else {
            nextLink = `<span class="nav-link-disabled">First chapter</span>`;
          }
          prevLink = `<span class="nav-link-disabled">Previous</span>`; // No previous for main index
          tocLink = `<span class="nav-link-disabled">Table of Contents</span>`; // No TOC for main index pointing to itself
        }
      } else {
        // Regular behavior for non-index files
        // Previous link
        if (currentIndex > 0) {
          const prevFile = filesInDir[currentIndex - 1];
          // Handle if prevFile is index.md
          const prevFileName = path.basename(prevFile) === 'index.md' ? 'Up to Contents' : 'Previous';
          prevLink = `<a href="${path.basename(prevFile, '.md') + '.html'}" class="nav-link">${prevFileName}</a>`;
        } else {
          prevLink = `<span class="nav-link-disabled">Previous</span>`;
        }
        
        // Next link
        if (currentIndex < filesInDir.length - 1) {
          const nextFile = filesInDir[currentIndex + 1];
          nextLink = `<a href="${path.basename(nextFile, '.md') + '.html'}" class="nav-link">Next</a>`;
        } else {
          nextLink = `<span class="nav-link-disabled">Next</span>`;
        }
        
        // TOC link (points to index.html in current directory)
        // Check if current file is not index.md to show TOC link
        if (path.basename(filePath) !== 'index.md') {
            const indexFileInDir = filesInDir.find(f => path.basename(f) === 'index.md');
            if (indexFileInDir) {
                 tocLink = `<a href="index.html" class="nav-link">Table of Contents</a>`;
            } else {
                // If there's no index.md, maybe disable TOC or link to main book listing?
                // For now, disable if no index.md in the current book's directory.
                tocLink = `<span class="nav-link-disabled">Table of Contents</span>`;
            }
        } else {
             tocLink = `<span class="nav-link-disabled">Table of Contents</span>`; // Already on TOC
        }
      }
      
      finalHtml = finalHtml
        .replace(/{{page_title}}/g, firstH1 || path.basename(filePath, '.md'))
        .replace(/{{nav_previous_link}}/g, prevLink)
        .replace(/{{nav_toc_link}}/g, tocLink)
        .replace(/{{nav_next_link}}/g, nextLink)
        .replace(/{%PAGE_TOC%}/g, currentTocHtml)
        .replace(/{%PAGE_TOC_DATA%}/g, JSON.stringify(currentTocData)); // Add structured TOC data
      
      // Ensure output directory exists
      fs.ensureDirSync(outputPath);
      
      // Write final HTML file with TOC data
      const finalHtmlWithToc = finalHtml
          .replace('{%PAGE_TOC%}', currentTocHtml)
          .replace('{%PAGE_TOC_DATA%}', JSON.stringify(currentTocData));
      fs.writeFileSync(outputFile, finalHtmlWithToc);
      
      console.log(`Generated: ${outputFile}`);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
      process.exit(1);
    }
  });
}

// Recursively find all markdown files in directory
function getMarkdownFiles(dir) {
  const files = fs.readdirSync(dir);
  let markdownFiles = [];
  
  files.forEach(file => {
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
  
  // Get all book directories
  const bookDirs = fs.readdirSync(booksDir)
    .filter(file => {
      const fullPath = path.join(booksDir, file);
      return fs.statSync(fullPath).isDirectory();
    });

  // Process each book to get its name and path
  const books = bookDirs.map(dir => {
    const bookPath = path.join(booksDir, dir);
    const name = getBookName(bookPath, dir);
    return { name, path: dir };
  }).filter(book => book.name); // Filter out books without names

  // Generate HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Books - Lojban Booker</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style id="tailwind-styles">
    ${tailwindCss}
    /* Minimal inline styles for body if Tailwind doesn't load, and for basic structure */
    body {
        font-family: 'Inter', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen flex flex-col items-center py-8 sm:py-12 transition-colors duration-300">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-3xl">
    <header class="mb-10 flex justify-between items-center">
      <div class="text-center flex-grow">
        <h1 class="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">All Available Books</h1>
        <p class="mt-3 text-lg text-slate-600 dark:text-slate-400">Browse our collection of programming books.</p>
      </div>
      <button id="darkModeToggle" aria-label="Toggle dark mode" class="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0">
          <svg id="theme-toggle-dark-icon" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
          <svg id="theme-toggle-light-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 10.607a1 1 0 011.414-1.414l-.707-.707a1 1 0 01-1.414 1.414l.707.707zm12.728 0l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
      </button>
    </header>
    
    <main>
      <ul class="space-y-4">
        ${books.map(book => `
          <li class="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
            <a href="${book.path}/index.html" class="block p-6 sm:p-8">
              <h2 class="text-2xl font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors duration-150">${book.name}</h2>
              <p class="mt-2 text-slate-500 dark:text-slate-400">Open the book &rarr;</p>
            </a>
          </li>
        `).join('')}
      </ul>
      ${books.length === 0 ? '<p class="text-center text-slate-500 dark:text-slate-400 mt-8">No books found. Try running the build script.</p>' : ''}
    </main>

    <footer class="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
      <p>&copy; ${new Date().getFullYear()} Lojban Booker. All rights reserved.</p>
      <p class="mt-1">Generated by Booker Script</p>
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
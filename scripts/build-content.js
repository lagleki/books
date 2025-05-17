const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const hljs = require('markdown-it-highlightjs');
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

// Apply highlight.js plugin
md.use(hljs);

// Apply TOC plugin
md.use(toc, {
  containerClass: 'toc',
  listType: 'ul',
  level: [2, 3]
});

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
      
      // Extract first H1 from markdown
      let firstH1 = '';
      const h1Match = markdown.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1]) {
        firstH1 = h1Match[1].trim();
      }
      
      // Convert to HTML
      let html = md.render(markdown);
      
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
      const filesInDir = filesByDir[dir];
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
          }
        }
      } else {
        // Regular behavior for non-index files
        // Previous link
        if (currentIndex > 0) {
          const prevFile = filesInDir[currentIndex - 1];
          prevLink = `<a href="${path.basename(prevFile, '.md') + '.html'}" class="nav-link">Previous</a>`;
        }
        
        // Next link
        if (currentIndex < filesInDir.length - 1) {
          const nextFile = filesInDir[currentIndex + 1];
          nextLink = `<a href="${path.basename(nextFile, '.md') + '.html'}" class="nav-link">Next</a>`;
        }
        
        // TOC link (points to index.html in current directory)
        tocLink = `<a href="index.html" class="nav-link">Table of Contents</a>`;
      }
      
      finalHtml = finalHtml
        .replace(/{{page_title}}/g, firstH1 || path.basename(filePath, '.md'))
        .replace(/{{nav_previous_link}}/g, prevLink)
        .replace(/{{nav_toc_link}}/g, tocLink)
        .replace(/{{nav_next_link}}/g, nextLink);
      
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Books</title>
  <style>
    body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    ul { list-style: none; padding: 0; }
    li { margin: 10px 0; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>All Books</h1>
  <ul>
    ${books.map(book => `
      <li><a href="${book.path}/index.html">${book.name}</a></li>
    `).join('')}
  </ul>
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
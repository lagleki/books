# Publishing the Books to GitHub Pages

Follow these steps to publish the generated HTML books to GitHub Pages:

## 1. Push the Project to GitHub
1. Create a new repository on GitHub (or use an existing one)
2. Initialize Git in your project directory if not already done:
   ```bash
   git init
   ```
3. Add all files and commit:
   ```bash
   git add .
   git commit -m "Initial commit with book content"
   ```
4. Add the GitHub repository as remote and push:
   ```bash
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

## 2. Configure GitHub Pages
1. Go to your repository on GitHub
2. Click on "Settings" in the top navigation
3. In the left sidebar, click on "Pages"
4. Under "Build and deployment":
   - Select your branch (typically `main` or `master`)
   - Select `/docs` as the source folder
5. Click "Save"

## 3. Accessing the Published Books
After GitHub Pages is configured (may take a few minutes to build):
- The main site will be available at:  
  `https://your-username.github.io/your-repo/`

The individual books can be accessed at:
- C# Book:  
  `https://your-username.github.io/your-repo/c-sharp/index.html`
- Go Book:  
  `https://your-username.github.io/your-repo/golang/index.html`

## Notes
- Changes pushed to the repository will automatically update the published pages
- The site may take a few minutes to update after pushing changes
- Make sure all book content is in the `docs/` folder before pushing
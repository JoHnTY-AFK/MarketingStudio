const fs = require('fs');
const files = [
  'src/components/Sidebar/WorkspaceTab.tsx',
  'src/components/Sidebar/DirectorTab.tsx',
  'src/components/TopBar/TopBar.tsx',
  'src/App.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/bg-indigo-500 hover:bg-indigo-600/g, 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});

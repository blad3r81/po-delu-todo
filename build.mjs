import {mkdir, copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const files = ['index.html','styles.css','hero-refresh.css','app.js','store.js',
  'assets/favicon.svg','assets/manrope.ttf','assets/manrope-medium.ttf',
  'assets/manrope-semibold.ttf','assets/manrope-bold.ttf','assets/Manrope-OFL.txt',
  'assets/planning-long.mp4','assets/planning-long-poster.jpg'];
for (const file of files) {
  const destination = path.join(root,'dist',file);
  await mkdir(path.dirname(destination),{recursive:true});
  await copyFile(path.join(root,file),destination);
}
console.log(`Built ${files.length} static files in dist/`);

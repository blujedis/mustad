const { readFileSync, writeFileSync } = require('fs');
const argv = process.argv.slice(2);

const options = {
  path: './temp.json',
  type: 'path'
};

try {
  const pkg = JSON.parse(readFileSync(options.path).toString());
  console.log('\n[ARIBBA]', `start ${type}:`, pkg.version);
  const segments = pkg.version.split('.');
  const patch = parseInt(segments.pop()) + 1;
  segments.push(patch);
  pkg.version = segments.join('.');
  writeFileSync(options.path, JSON.stringify(pkg, null, 2));
  console.log('[BUMP]', `end ${type}:`, pkg.version + '\n');
}
catch(err) {
  console.error('\n[BUMP]', err.message + '\n');
}


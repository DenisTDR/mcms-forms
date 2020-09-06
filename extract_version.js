const packageJson = require('./package.json');
const version = packageJson.version;
const fs = require('fs');
fs.writeFileSync('version.txt', version);

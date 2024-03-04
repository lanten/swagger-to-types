const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

async function build() {
  const rootPath = process.cwd()
  const distPath = path.join(rootPath, './out')

  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true })
  }

  execSync('tsc -p ./ --sourceMap false', { cwd: rootPath })
}

build()

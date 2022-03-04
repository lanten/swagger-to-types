/**
 * This is template config for extension: [Create Item By Template]
 * This is a JavaScript code file that will be executed in the Node environment
 * And you can add any Javascript(commonjs) code here
 * For more advanced usage, please see this wiki: https://github.com/lanten/create-item-by-template/wiki/Template-Example
 */

/** file list */
const files = {
  'Javascript Log': (name) => {
    return `console.log('${name}: is created')`
  },
}

/** folder list */
const folders = {
  'Web Folder': (name, query, paths) => {
    return {
      'index.html': [
        `<!DOCTYPE html>`,
        `<html lang="en">`,
        `<head>`,
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">`,
        `  <meta http-equiv="X-UA-Compatible" content="ie=edge">`,
        `  <script src="./${name}.js"></script>`,
        `  <title>${name}</title>`,
        `</head>`,
        `<body>`,
        `  <p>${JSON.stringify(query)}</p>`,
        `  <p>${JSON.stringify(paths)}</p>`,
        `</body>`,
        `</html>`,
      ],
      [`${name}.js`]: files['Javascript Log'](name),
    }
  },
}

module.exports = { files, folders }

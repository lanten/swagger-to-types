export function parseSwaggerJson(swaggerJson: SwaggerJson): SwaggerJsonTreeItem[] {
  const { tags, paths } = swaggerJson
  console.log(swaggerJson)
  let res: SwaggerJsonTreeItem[] = []
  const tagsMap = {}
  if (tags && tags.length) {
    res = tags.map((v, i) => {
      tagsMap[v.name] = i
      return {
        title: v.name,
        subTitle: v.description,
        type: 'tag',
      }
    })
  }

  for (const path in paths) {
    const v = paths[path]
    const method = Object.keys(v)[0]
    const item = v[method]
    const itemRes = {
      method,
      title: item.summary,
      subTitle: path,
      type: 'interface',
    }

    if (item.tags && item.tags.length) {
      item.tags.forEach(tagStr => {
        const resIndex = tagsMap[tagStr]
        if (res[resIndex].children && Array.isArray(res[resIndex].children)) {
          // @ts-ignore
          res[resIndex].children.push(itemRes)
        } else {
          res[resIndex].children = [itemRes]
        }
      })
    }
  }

  return res
}

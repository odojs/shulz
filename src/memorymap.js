module.exports = (map) => {
  if (map == null) map = {}
  return {
    set: (key, value) => map[key] = value,
    get: (key) => map[key],
    clear: (key) => delete map[key],
    length: () => Object.keys(map).length,
    all: () => map
  }
}

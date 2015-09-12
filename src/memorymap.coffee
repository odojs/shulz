module.exports = (map) ->
  map = {} if !map?

  set: (key, value) -> map[key] = value
  get: (key) -> map[key]
  clear: (key) -> delete map[key]
  length: -> Object.keys(map).length
  all: -> map
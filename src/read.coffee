fs = require 'graceful-fs'
markers = require './markers'
roundbyte = require './roundbyte'
{ ShulzMapCorrupt } = require './errors'

module.exports = (path) ->
  result = {}
  buffer = fs.readFileSync path
  offset = 0
  while offset < buffer.length
    marker = buffer.readUInt32BE offset
    offset += 4
    break if marker is markers.noop
    if marker is markers.set
      keylength = buffer.readUInt32BE offset
      offset += 4
      key = buffer.toString 'utf8', offset, offset + keylength
      offset += keylength
      offset = roundbyte offset
      valuelength = buffer.readUInt32BE offset
      offset += 4
      value = buffer.toString 'utf8', offset, offset + valuelength
      offset += valuelength
      offset = roundbyte offset
      result[key] = value
    else if marker is markers.clear
      keylength = buffer.readUInt32BE offset
      offset += 4
      key = buffer.toString 'utf8', offset, offset + keylength
      offset += keylength
      offset = roundbyte offset
      delete result[key]
    else
      throw new ShulzMapCorrupt()
  result

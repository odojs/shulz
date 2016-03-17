# A file backed queue.

# Incremental backoff on EMFILE
fs = require 'graceful-fs'
Memmap = require './memorymap'
markers = require './markers'
roundbyte = require './roundbyte'
{ ShulzMapBusy } = require './errors'

# default buffer size 128k
DEFAULT_BUFFER_SIZE = 1024 * 128

shulz =
  assert: (path) ->
    if fs.existsSync "#{path}.lock"
      throw new ShulzMapBusy()
  create: (path, buffersize) ->
    _isclosed = no
    shulz.assert path
    fs.writeFileSync "#{path}.lock", ''
    # default buffer size
    buffersize = buffersize ? DEFAULT_BUFFER_SIZE
    noopbuffer = new Buffer buffersize
    noopbuffer.fill markers.noop
    fd = fs.openSync path, 'w'
    fs.writeSync fd, noopbuffer, 0, buffersize, 0
    fs.fsyncSync fd
    offset = 0
    allocated = buffersize
    memmap = Memmap()
    fsmap =
      set: (key, value) ->
        value = JSON.stringify value
        keylength = Buffer.byteLength key
        valuelength = Buffer.byteLength value
        size = 8 + (roundbyte keylength) + 4 + (roundbyte valuelength)
        allocatesize = size
        if offset + size > allocated
          allocated = Math.ceil((offset + size) / buffersize) * buffersize
          allocatesize = allocated - offset
        buffer = new Buffer allocatesize
        buffer.writeUInt32BE markers.set, 0
        buffer.writeUInt32BE keylength, 4
        buffer.write key, 8, keylength
        buffer.writeUInt32BE valuelength, 8 + (roundbyte keylength)
        buffer.write value, 12 + (roundbyte keylength), valuelength
        if 12 + (roundbyte keylength) + valuelength < allocatesize
          buffer.fill markers.noop, 12 + (roundbyte keylength) + valuelength
        fs.writeSync fd, buffer, 0, allocatesize, offset
        fs.fsyncSync fd
        offset += size
      clear: (key) ->
        length = Buffer.byteLength key
        size = roundbyte length + 8
        allocatesize = size
        if offset + size > allocated
          allocated = Math.ceil((offset + size) / buffersize) * buffersize
          allocatesize = allocated - offset
        buffer = new Buffer allocatesize
        buffer.writeUInt32BE markers.clear, 0
        buffer.writeUInt32BE length, 4
        buffer.write key, 8, length
        if length + 8 < allocatesize
          buffer.fill markers.noop, length + 8
        fs.writeSync fd, buffer, 0, allocatesize, offset
        fs.fsyncSync fd
        offset += size
      compact: ->
        fd = fs.openSync "#{path}.new", 'w'
        fs.writeSync fd, noopbuffer, 0, buffersize, 0
        fs.fsyncSync fd
        offset = 0
        allocated = buffersize
        for key, value of memmap.all()
          fsmap.set key, value
        fs.renameSync "#{path}.new", path
      rename: (newpath) ->
        path = newpath
      close: ->
        fs.unlinkSync "#{path}.lock"
        fs.closeSync fd

    get: (key) -> memmap.get key
    set: (key, value) ->
      fsmap.set key, value
      memmap.set key, value
    clear: (key) ->
      fsmap.clear key
      memmap.clear key
    length: ->
      memmap.length()
    all: ->
      memmap.all()
    compact: ->
      fsmap.compact()
    rename: (newpath) ->
      fsmap.rename newpath
    close: ->
      return if _isclosed
      _isclosed = yes
      fsmap.close()

  open: (path, buffersize) ->
    buffersize = buffersize ? DEFAULT_BUFFER_SIZE
    shulz.assert path
    fs.writeFileSync "#{path}.lock", ''
    map = shulz.create "#{path}.new", buffersize
    if fs.existsSync path
      object = shulz.read path
      for key, value of object
        map.set key, value
    fs.renameSync "#{path}.new", path
    fs.unlink "#{path}.new.lock"
    map.rename path
    map

  print: require './print'
  read: require './read'

module.exports = shulz
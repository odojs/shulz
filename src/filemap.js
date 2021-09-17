// A file backed queue.

// Incremental backoff on EMFILE
import fs from 'graceful-fs'
import markers from './markers.js'
import roundbyte from './roundbyte.js'
import { ShulzMapBusy } from './errors.js'
import print from './print.js'
import read from './read.js'

// default buffer size 128k
const DEFAULT_BUFFER_SIZE = 1024 * 128

const shulz = {
  assert: (path) => {
    if (fs.existsSync(`${path}.lock`))
      throw new ShulzMapBusy()
  },
  create: (path, buffersize) => {
    let _isclosed = false
    shulz.assert(path)
    fs.writeFileSync(`${path}.lock`, '')
    // default buffer size
    buffersize = buffersize != null ? buffersize : DEFAULT_BUFFER_SIZE
    const noopbuffer = Buffer.alloc(buffersize)
    let fd = fs.openSync(path, 'w')
    fs.writeSync(fd, noopbuffer, 0, buffersize, 0)
    fs.fsyncSync(fd)
    let offset = 0
    let allocated = buffersize
    const memmap = new Map()
    const fsmap = {
      set: (key, value) => {
        value = JSON.stringify(value)
        const keylength = Buffer.byteLength(key)
        const valuelength = Buffer.byteLength(value)
        const size = 8 + (roundbyte(keylength)) + 4 + (roundbyte(valuelength))
        let allocatesize = size
        if (offset + size > allocated) {
          allocated = Math.ceil((offset + size) / buffersize) * buffersize
          allocatesize = allocated - offset
        }
        const buffer = Buffer.allocUnsafe(allocatesize)
        buffer.writeUInt32BE(markers.set, 0)
        buffer.writeUInt32BE(keylength, 4)
        buffer.write(key, 8, keylength)
        buffer.writeUInt32BE(valuelength, 8 + (roundbyte(keylength)))
        buffer.write(value, 12 + (roundbyte(keylength)), valuelength)
        if (12 + (roundbyte(keylength)) + valuelength < allocatesize)
          buffer.fill(markers.noop, 12 + (roundbyte(keylength)) + valuelength)
        fs.writeSync(fd, buffer, 0, allocatesize, offset)
        fs.fsyncSync(fd)
        offset += size
      },
      delete: key => {
        const length = Buffer.byteLength(key)
        const size = roundbyte(length + 8)
        let allocatesize = size
        if (offset + size > allocated) {
          allocated = Math.ceil((offset + size) / buffersize) * buffersize
          allocatesize = allocated - offset
        }
        const buffer = Buffer.allocUnsafe(allocatesize)
        buffer.writeUInt32BE(markers.delete, 0)
        buffer.writeUInt32BE(length, 4)
        buffer.write(key, 8, length)
        if (length + 8 < allocatesize)
          buffer.fill(markers.noop, length + 8)
        fs.writeSync(fd, buffer, 0, allocatesize, offset)
        fs.fsyncSync(fd)
        offset += size
      },
      compact: () => {
        var key, ref, value
        fd = fs.openSync(`${path}.new`, 'w')
        fs.writeSync(fd, noopbuffer, 0, buffersize, 0)
        fs.fsyncSync(fd)
        offset = 0
        allocated = buffersize
        for (const [key, value] of memmap.entries())
          fsmap.set(key, value)
        fs.renameSync(`${path}.new`, path)
      },
      rename: newpath => path = newpath,
      close: () => {
        fs.unlinkSync(`${path}.lock`)
        fs.closeSync(fd)
      }
    }
    return {
      get: key => memmap.get(key),
      set: (key, value) => {
        fsmap.set(key, value)
        memmap.set(key, value)
      },
      delete: key => {
        fsmap.delete(key)
        memmap.delete(key)
      },
      length: () => memmap.size,
      entries: () => memmap.entries(),
      compact: () => fsmap.compact(),
      rename: newpath => fsmap.rename(newpath),
      close: () => {
        if (_isclosed) return
        _isclosed = true
        fsmap.close()
      }
    }
  },
  open: (path, buffersize) => {
    buffersize = buffersize != null ? buffersize : DEFAULT_BUFFER_SIZE
    shulz.assert(path)
    fs.writeFileSync(`${path}.lock`, '')
    const map = shulz.create(`${path}.new`, buffersize)
    if (fs.existsSync(path)) {
      const object = shulz.read(path)
      for (const [key, value] of Object.entries(object))
        map.set(key, value)
    }
    fs.renameSync(`${path}.new`, path)
    fs.unlinkSync(`${path}.new.lock`)
    map.rename(path)
    return map
  },
  print,
  read
}

export default shulz

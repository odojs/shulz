import fs from 'graceful-fs'
import markers from './markers.js'
import roundbyte from './roundbyte.js'
import { ShulzMapCorrupt } from './errors.js'

const fn = path => {
  const result = {}
  const buffer = fs.readFileSync(path)
  let offset = 0
  while (offset < buffer.length) {
    const marker = buffer.readUInt32BE(offset)
    offset += 4
    if (marker === markers.noop) break
    if (marker === markers.set) {
      const keylength = buffer.readUInt32BE(offset)
      offset += 4
      const key = buffer.toString('utf8', offset, offset + keylength)
      offset += keylength
      offset = roundbyte(offset)
      const valuelength = buffer.readUInt32BE(offset)
      offset += 4
      const value = buffer.toString('utf8', offset, offset + valuelength)
      offset += valuelength
      offset = roundbyte(offset)
      result[key] = JSON.parse(value)
    }
    else if (marker === markers.delete) {
      const keylength = buffer.readUInt32BE(offset)
      offset += 4
      const key = buffer.toString('utf8', offset, offset + keylength)
      offset += keylength
      offset = roundbyte(offset)
      delete result[key]
    }
    else throw new ShulzMapCorrupt()
  }
  return result
}
export default fn

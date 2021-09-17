import fs from 'graceful-fs'
import markers from './markers.js'
import roundbyte from './roundbyte.js'
import { ShulzMapCorrupt } from './errors.js'

const fn = path => {
  const buffer = fs.readFileSync(path)
  let offset = 0
  while (offset < buffer.length) {
    marker = buffer.readUInt32BE(offset)
    offset += 4
    if (marker === markers.noop) break
    if (marker === markers.set) {
      const keylength = buffer.readUInt32BE(offset)
      offset += 4
      const key = buffer.toString('utf8', offset, offset + keylength)
      offset += keylength
      offset = roundbyte(offset)
      valuelength = buffer.readUInt32BE(offset)
      offset += 4
      value = buffer.toString('utf8', offset, offset + valuelength)
      offset += valuelength
      offset = roundbyte(offset)
      value = JSON.parse(value)
      console.log(`set ${key} ${JSON.stringify(value)}`)
    } else if (marker === markers.delete) {
      const keylength = buffer.readUInt32BE(offset)
      offset += 4
      const key = buffer.toString('utf8', offset, offset + keylength)
      offset += keylength
      offset = roundbyte(offset)
      console.log(`delete ${key}`)
    } else
      throw new ShulzMapCorrupt()
  }
  console.log('noop')
}
export default fn

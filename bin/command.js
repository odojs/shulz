const usage = "Usage: shulz command [key] [value] file\n\nView:\n  cat                     Print entire map contents\n  print                   Print full operations\n  get key                 Print the value for key\n\nManipulate:\n  set key value           Set key to value\n  clear key               Remove key from the hashmap\n  purge                   Remove all entries from the hashmap\n  compact                 Remove expired hashmap contents\n\nOptions:\n  -h                      Display this usage information\n  -v                      Display the version number\n"

process.on('uncaughtException', (err) => {
  console.error('Caught exception: ')
  console.error(err.stack)
  process.exit(1)
})

// General purpose printing an error and usage
const usage_error = (message) => {
  console.error()
  console.error(`  ${message}`)
  console.error()
  console.error(usage)
  process.exit(1)
}

const args = process.argv.slice(2)

if (args.length === 0) return console.error(usage)

const shulz = require('../')

const {ShulzMapBusy} = require('../src/errors')

const commands = {
  cat: (path) => {
    const object = shulz.read(path)
    const results = []
    for (key in object) {
      const value = object[key]
      results.push(console.log(`${key} => ${JSON.stringify(value)}`))
    }
    return results
  },
  print: (path) => shulz.print(path),
  purge: (path) => {
    const map = shulz.create(path)
    map.close()
  },
  compact: (path) => {
    const map = shulz.open(path)
    map.compact()
    map.close()
  },
  get: (key, path) => {
    const map = shulz.open(path)
    console.log(JSON.stringify(map.get(key)))
    map.close()
  },
  set: (key, value, path) => {
    const map = shulz.open(path)
    console.log(key, value, path)
    map.set(key, JSON.parse(value))
    map.close()
  },
  clear: (key, path) => {
    const map = shulz.open(path)
    map.clear(key)
    map.close()
  }
}

const cmds = {
  cat: () => {
    if (args.length === 1) return commands.cat(args[0])
    usage_error('shulz cat requires one argument - the map path')
  },
  print: () => {
    if (args.length === 1) return commands.print(args[0])
    usage_error('shulz print requires one argument - the map path')
  },
  get: () => {
    if (args.length === 2) return commands.get(args[0], args[1])
    usage_error('shulz get requires two arguments - the key to retrieve and the map path')
  },
  set: () => {
    if (args.length === 3) return commands.set(args[0], args[1], args[2])
    usage_error('shulz set requires three arguments - the key to set, the value to set it to and the map path')
  },
  clear: () => {
    if (args.length === 2) return commands.clear(args[0], args[1])
    usage_error('shulz clear requires two arguments - the key to clear and the map path')
  },
  purge: () => {
    if (args.length === 1) return commands.purge(args[0])
    usage_error('shulz purge requires one argument - the map path')
  },
  compact: () => {
    if (args.length === 1) return commands.compact(args[0])
    usage_error('shulz compact requires one argument - the map path')
  },
  '-h': () => console.log(usage),
  '-v': () => {
    const pjson = require('../package.json')
    console.log(pjson.version)
  }
}

const command = args[0]

args.shift()

try {
  if (cmds[command] != null) return cmds[command]()
} catch (err) {
  if (err instanceof ShulzMapBusy) {
    console.error(err.message)
    console.error()
  } else {
    console.error('Caught exception: ')
    console.error(err.stack)
  }
  process.exit(1)
}

usage_error(`${command} is not a known shulz command`)

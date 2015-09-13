usage = """
Usage: shulz command [key] [value] file

View:
  cat                     Print entire map contents
  get key                 Print the value for key

Manipulate:
  set key value           Set key to value
  clear key               Remove key from the hashmap
  purge                   Remove all entries from the hashmap
  compact                 Remove expired hashmap contents

Options:
  -h                      Display this usage information
  -v                      Display the version number

"""

process.on 'uncaughtException', (err) ->
  console.error 'Caught exception: '
  console.error err.stack
  process.exit 1

# General purpose printing an error and usage
usage_error = (message) =>
  console.error()
  console.error "  #{message}"
  console.error()
  console.error usage
  process.exit 1

args = process.argv[2..]

return console.error usage if args.length is 0

shulz = require '../'
{ ShulzMapBusy } = require '../src/errors'

commands =
  cat: (path) ->
    object = shulz.read path
    for key, value of object
      console.log "#{key} => #{JSON.stringify value}"

  purge: (path) ->
    map = shulz.create path
    map.close()

  compact: (path) ->
    map = shulz.open path
    map.compact()
    map.close()

  get: (key, path) ->
    map = shulz.open path
    console.log JSON.stringify map.get key
    map.close()

  set: (key, value, path) ->
    map = shulz.open path
    console.log map.set key, JSON.parse value
    map.close()

  clear: (key, path) ->
    map = shulz.open path
    map.clear key
    map.close()

cmds =
  cat: ->
    return commands.cat args[0] if args.length is 1
    usage_error 'shulz cat requires one argument - the map path'

  get: ->
    return commands.get args[0], args[1] if args.length is 2
    usage_error 'shulz get requires two arguments - the key to retrieve and the map path'

  set: ->
    return commands.set args[0], args[1], args[2] if args.length is 3
    usage_error 'shulz set requires three arguments - the key to set, the value to set it to and the map path'

  clear: ->
    return commands.clear args[0], args[1] if args.length is 2
    usage_error 'shulz clear requires two arguments - the key to clear and the map path'

  purge: ->
    return commands.purge args[0] if args.length is 1
    usage_error 'shulz purge requires one argument - the map path'

  compact: ->
    return commands.compact args[0] if args.length is 1
    usage_error 'shulz compact requires one argument - the map path'

  '-h': ->
    console.log usage

  '-v': ->
    pjson = require '../package.json'
    console.log pjson.version

command = args[0]
args.shift()
try
  return cmds[command]() if cmds[command]?
catch err
  if err instanceof ShulzMapBusy
    console.error err.message
    console.error()
  else
    console.error 'Caught exception: '
    console.error err.stack
  process.exit 1
usage_error "#{command} is not a known shulz command"
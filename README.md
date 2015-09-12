# Shulz
Resilient, persistent in process hashmaps for Node.js.

Hashmaps are backed by an append only binary file format for persistence. The binary format is compacted on restart or manually compacted by calling `map.compact()`. An internal hashmap mirrors the file operations.

On disk persistence
- Crash resistant
- Atomic operations
- Preallocates blocks (defaults to 128k)
- Syncronous Node.js operations including fsync after every write

In memory hashmap
- String keys only

```js
var shulz = require('shulz');

// Open a hashmap
// Automatically compacts the hashmap
var map = shulz.open('./test.shulz');
// Look at an element
// Returns undefined if not available
console.log(map.get('key'));
// Strings are the only valid datatype (for now)
map.set('key', 'value');
map.clear('key');
// Optional manual compact call (hashmaps shouldn't take up too much space)
// Best practice is to compact after x sets, or on a scheudule
map.compact();
// Close is only needed on shutdown
map.close();

// Print the contents of the hashmap, e.g. sets
// Mostly for debugging
shulz.print('./test.map');
// Will output something like:
// set key1 value1
// set key1 value2
// set key2 value3
// unset key1
// noop

// Read in a hashmap contents
var object = shulz.read('./test.map');
console.log(object);
// Will output:
// {'key1': 'value2', 'key2': 'value3'}

// Write out a new hashmap
var object = {'key1': 'value2', 'key2': 'value3'};
var map = shulz.create('./test.map');
for (var key in object) {
    map.set(key, object[key]);
}
map.close();
```

# Command line tool

```console
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

```

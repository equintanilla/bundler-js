# bundler-js

Utility to 



## Usage


```javascript
var bundlerJs = require("bundler-js");
var config = {
            appScript: '/path/to/script.js',
            outputFile: 'bundle.js',
            dest: 'build/output'}
  var bundled = bundler(config);         

```
## var bundled = bundlerJs(opts={})

##Options

`opts.appScript`(required) is the initial script that holds the dependencies you want to load

`opts.dest`(required) is the folder for the output

`opts.outputFile`(required) is the name of the output file

`opts.shouldWatchify` whether or not you want your files to be watchified

`opts.shouldUglify` whether or not you want your files to be uglified

`opts.shouldWriteSourceMaps` whether or not you want source maps


`opts.errorHook` function that would be called if an error event occurs at  any piping of the stream process

`opts.finishHook` function that would be called at the end of the stream process

`opts.finishHook` function that would be called if a finish event occurs at any pipiping of the stream process

## ES6 Polyfill 

If you want to include a ES6 polyfill include the following line in your code

```
//browser code 
require('bundler-js/es-polyfill');

```


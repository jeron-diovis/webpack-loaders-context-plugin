# webpack-loaders-context-plugin

Allows to apply loaders only in certain context, simplifying configuration of loader's `test` option.

## Installation

```
npm install --save-dev webpack-loaders-context-plugin
```

## The Need

Did you ever think about why `test` option of webpack loaders is matched against absolute path to module? I never understood this. Does your project ever need files outside of it's working directory? If it does indeed, such cases seems to me a very rare. So why absolute paths? When `test` is defined as regexp, it does not make a big difference, but if you want to just list several string paths there, or define it as a function, it quickly becomes painful: you need to write things like `path.resolve(__dirname, "my/path")` all around your config (which is especially fun, if config is split apart, and somewhere `__dirname` is not the root of your project, so now you need to use `process.cwd()`). It's ridiculous. Webpack works in certain [context](https://webpack.github.io/docs/configuration.html#context) – and I want my loaders to work in that context too.

## The Solution

Let say you have files structure like this:
```
.
└── src
	├── another_module.js
	├── index.js
	└── some_module.js
```
and lodash in dependencies.

Then, running webpack with following config:

```js
// webpack.config.js

var WebpackLoadersContextPlugin = require("webpack-loaders-context-plugin")

module.exports = {
	context: __dirname + "/src",

	entry: "index.js",

	plugins: [
		new WebpackLoadersContextPlugin(), // <----
	],

	module: {
		loaders: [
			{
				loader: "loader1",
				test: str => console.log("loader1", str),
			},

			{
				loader: "loader2",
				context: true, 		// <----
				test: str => console.log("loader2", str),
			}
		],
	},
}
```

you will get output like this:

```
...
loader_1 /path/to/project/node_modules/lodash/_metaMap.js
loader_1 /path/to/project/node_modules/lodash/_createRecurry.js
loader_1 /path/to/project/node_modules/lodash/_getHolder.js
loader_1 /path/to/project/node_modules/lodash/_replaceHolders.js
...
loader_1 /path/to/project/src/index.js
loader_1 /path/to/project/src/some_module.js
loader_1 /path/to/project/src/another_module.js
...
loader_2 index.js
loader_2 some_module.js
loader_2 another_module.js
```

Note the last part? Second loader only receives files from your `src` folder, and these paths are relative to that folder.

## And so what?

And so, as it was mentioned above – you don't need to take into account absolute path whenever you need to customize `test` expression beyond standard `/\.js$/`. For example:
```js
{
	loader: "bundle",
	query: {
		lazy: true,
	},
	context: true,
	test: [
		"containers/Profile",
		"containers/Inbox",
		...
	],
},
```

Just list desired source modules – simple, intuitively and readable, instead of smth like

```
test: /containers\/(Profile|Inbox|...)/,
exclude: /node_modules/, // or 'include: path.resolve(__dirname, "src"')
```

Matching is not performed at all, if file is not in context – in difference from standard behaviour, when first `test` is always matched against ALL files, and then result is filtered by `include` / `exclude`.

Also, options `include` and `exclude` now works with same logic too.

## API

### `new WebpackLoadersContextPlugin(useByDefault = false)`

Set `useByDefault` to true in constructor to turn all your loaders in new mode by default.
For those loaders which really need to deal with 3-party modules (on my view, they are always in the minority), you may explicitly set `context: false`.

### `loader.context: Bool|String`

Default value is `useByDefault` from plugin's constructor.

Boolean values used to explicitly enable/disable using context for this loader.

Default context is a [compiler context](https://webpack.github.io/docs/configuration.html#context).
You may customize it with for certain loader like this:

```js
loader: "my-loader",
context: "/absolute/path/to/desired/folder",
``` 

Here path still must be absolute – because, who knows, maybe you really need something from outside of working dir?

## Is it really so important?

Well, on my view – yes, it is. When you need to *program* your *config* even in simplest it's parts (using things like `path.resolve` all around, or `loader: "my-loader?" + JSON.stringify({ ... })`) – it's not how it should be. 
I just want to see a bit more readable and declarative config.
import sysPath from "path"

export default class WebpackLoadersContextPlugin {
  constructor(useByDefault = false) {
    if (typeof useByDefault !== "boolean") {
      throw new Error("[WebpackLoaderContextPlugin] 'useByDefault' option must be boolean")
    }

    this.useByDefault = useByDefault

    this._patchLoader = this._patchLoader.bind(this)
  }

  apply(compiler) {
    this.compilerContext = compiler.context

    compiler.plugin("normal-module-factory", ({ loaders: LoadersList }) => {
      this.LoadersList = LoadersList
      LoadersList.list.forEach(this._patchLoader)
    })
  }

  _patchLoader(loader) {
    const context = this._getLoaderContext(loader)
    if (context === false) {
      return
    }

    [ "test", "include", "exclude" ].forEach(key => {
      const origin = loader[key]
      loader[key] = absoluteModulePath => {
        if (absoluteModulePath.indexOf(context) !== 0) {
          return false
        }
        return this.LoadersList.matchPart(path.relative(context, absoluteModulePath), origin)
      }
    })
  }

  _getLoaderContext(loader) {
    const { context = this.useByDefault } = loader

    switch (context) {
      case false:
        return false

      case true:
        return this.compilerContext

      default:
        if (typeof context !== "string") {
          throw new Error("[WebpackLoaderContextPlugin] 'loader.context' must be either boolean or string")
        }
        return context
    }
  }
}

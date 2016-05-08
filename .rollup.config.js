
export default {
  entry: 'src/tangojs-connector-mtango.js',
  dest: 'lib/tangojs-connector-mtango.js',
  format: 'umd',
  moduleId: 'tangojs-connector-mtango',
  moduleName: 'tangojs.connector.mtango',
  plugins: [],
  external: [
    'tangojs-core',
    'node-fetch',
    'btoa'
  ],
  globals: {
    'tangojs-core': 'tangojs.core',
    'node-fetch': 'fetch',
    'btoa': 'btoa'
  },
  sourceMap: true
}

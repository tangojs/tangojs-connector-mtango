
export default {
  entry: 'src/tangojs-connector-mtango.js',
  dest: 'lib/tangojs-connector-mtango.js',
  format: 'umd',
  moduleId: 'tangojs-connector-mtango',
  moduleName: 'tangojs.connector.mtango',
  plugins: [],
  external: [
    'tangojs-core'
  ],
  globals: {
    'tangojs-core': 'tangojs'
  },
  sourceMap: true
}

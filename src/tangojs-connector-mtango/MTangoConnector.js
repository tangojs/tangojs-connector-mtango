
import * as tangojs from 'tangojs-core'

/** @private */
function extractPropnames (propnames) {
  return (Array.isArray(propnames) ? propnames : [propnames])
    .map(p => (p instanceof tangojs.core.api.DbDatum) ? p.name
            : (typeof p === 'string' || p instanceof String) ? p
            : '')
    .filter(p => p !== '')
}

const wrapAsPromisedArray = (x) => Promise.resolve(Array.isArray(x) ? x : [x])

// FIXME add support for node
const fetchFn = window.fetch
const btoaFn = window.btoa
const fetchResponse = window.Response

export class MTangoConnector extends tangojs.core.Connector {

  /**
   * @param {string} endpoint
   * @param {string} username
   * @param {string} password
   */
  constructor(endpoint, username, password) {
    super()
    this._endpoint = endpoint
    this._username = username
    this._password = password

    this._headers = {
      // FIXME what with node?
      'Authorization': 'Basic ' + btoaFn(`${username}:${password}`)
    }
  }

  /**
   * @param {string} method
   * @param {string} address
   * @return {Promise<Response,Error>}
   * @private
   */
  _fetch(method, address) {
    return fetchFn(`${this._endpoint}/${address}`, {
      method: method,
      mode: 'cors',
      headers: this._headers
    }).then(response => {
      return response.ok ? response.json() : Promise.reject(response)
    }).catch(error => {
      if (error instanceof fetchResponse) {
        console.error(`Failed request: ${error.status} ${error.statusText}`,
                      error)
      } else {
        console.error(`Network error:`, error)
      }
    })
  }

  /**
   * @return {Promise<string>}
   * @param {string} devname
   */
  get_device_status(devname) {

    // 'http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/state'

    return this._fetch('get', `devices/${devname}/state`)
      .then(state => state.status)
  }

  /**
   * @return {Promise<DevState>}
   * @param {string} devname
   */
  get_device_state(devname) {

    // 'http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/state'

    return this._fetch('get', `devices/${devname}/state`)
      .then(state => tangojs.core.tango.DevState[state.state])
  }

  /**
   * @return {Promise<DeviceInfo>}
   * @param {string} devname
   */
  get_device_info(devname) {

    // http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1

    return this._fetch('get', `devices/${devname}`)
      .then(device => new tangojs.core.api.DeviceInfo(device.info))
  }

  /**
   * @return {Promise<string[]>}
   * @param {string} pattern
   */
  get_device_list(pattern) {

    // http://localhost:8080/mtango/rest/rc2/devices
    // FIXME handle pattern

    return this._fetch('get', 'devices')
      .then(devices => {
        return devices.map(d => d.name).filter(n => !n.startsWith('dserver'))
      })
  }

  /**
   * @return {Promise<string[]>}
   * @param {string} pattern
   */
  get_device_domain(pattern) {
    pattern
    throw new Error('not implemented yet')
  }

  /**
   * @return {Promise<string[]>}
   * @param {string} pattern
   */
  get_device_family(pattern) {
    pattern
    throw new Error('not implemented yet')
  }

  /**
   * @return {Promise<string[]>}
   * @param {string} pattern
   */
  get_device_member(pattern) {
    pattern
    throw new Error('not implemented yet')
  }

  /**
   * @return {Promise<string[]>}
   * @param {string} devname
   * @param {string} pattern
   */
  get_device_property_list(devname, pattern) {
    // http://localhost:8080/mtango/rest/rc2/devices/test/rest/1/properties
    // returns error
    devname, pattern
    throw new Error('not implemented yet')
  }

  /**
   * @return {Promise<DbDatum>|Promise<DbDatum[]>}
   * @param {string} devname
   * @param {string|string[]|DbDatum[]} propnames
   */
  get_device_property(devname, propnames) {
    // properties are not working
    // let props = extractPropnames(propnames)
    devname, propnames
    throw new Error('not implemented yet')
  }

  /**
   * @return {Promise<undefined>}
   * @param {string} devname
   * @param {DbDatum[]} properties
   */
  put_device_property(devname, properties) {
    devname, properties
    throw new Error('not implemented yet')
  }

  /**
   * @return {Promise<undefined>}
   * @param {string} devname
   * @param {string|string[]|DbDatum[]} propnames property names
   */
  delete_device_property(devname, propnames) {
    devname, propnames
    throw new Error('not implemented yet')
  }

  /**
   * @return {Promise<string[]>}
   * @param {string} devname
   */
  get_device_attribute_list(devname) {

    // http://localhost:8080/mtango/rest/rc2/devices/test/rest/1/attributes

    return this._fetch('get', `devices/${devname}/attributes`)
      .then(attributes => attributes.map(a => a.name))
  }

  /**
   * @return {Promise<AttributeInfo>|Promise<AttributeInfo[]>}
   * @param {string} devname
   * @param {undefined|string|string[]} attnames
   */
  get_device_attribute_info(devname, attnames) {

    // http://localhost:8080/mtango/rest/rc2/devices/test/rest/1/attributes/staticValueExpirationDelay/info

    const getOr = (val, ctor) => val ? ctor[val] : val

    const namePromises = attnames
      ? wrapAsPromisedArray(attnames)
      : this.get_device_attribute_list(devname)

    return namePromises.then(names => {
      return Promise.all(names.map(n => {
        return this._fetch('get', `devices/${devname}/attributes/${n}/info`)
          .then(info => {
            return new tangojs.core.api.AttributeInfo(Object.assign(info, {
              writable: getOr(info.writable, tangojs.core.tango.AttrWriteType),
              data_format: getOr(info.data_format, tangojs.core.tango.AttrDataFormat),
              level: getOr(info.level, tangojs.core.tango.DispLevel),
              att_alarm: info.att_alarm, // FIXME AttributeAlarm,
              event_prop: info.event_prop // FIXME EventProperties
            }))
          })
      }))
    })
    .then(infos => {
      return attnames ? Array.isArray(attnames) ? infos : infos[0]
        : infos
    })
  }

  /**
   * @return {Promise<DeviceAttribute>|Promise<DeviceAttribute[]>}
   * @param {string} devname
   * @param {string|string[]} attname
   */
  read_device_attribute(devname, attnames) {

    // http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/attributes/long_scalar/value

    const getOr = (val, ctor) => val ? ctor[val] : val

    return wrapAsPromisedArray(attnames).then(attnames => {
      return Promise.all(attnames.map(n => {
        return this._fetch('get', `devices/${devname}/attributes/${n}/value`)
          .then(value => {
            return new tangojs.core.api.DeviceAttribute(Object.assign(value, {
              quality: getOr(value.quality, tangojs.core.tango.AttrQuality),
              time: {
                tv_sec: 0,
                tv_usec: 0,
                tv_nsec: 0
              } // FIXME convert timestamp
            }))
          })
      }))
    })
    .then(attrs => Array.isArray(attnames) ? attrs : attrs[0] )
  }

  /**
   * @return {Promise<undefined>}
   * @param {string} devname
   * @param {DeviceAttribute|DeviceAttribute[]} attrs
   */
  write_device_attribute(devname, attrs) {

    // PUT http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/attributes/long_scalar?value=xx

    return wrapAsPromisedArray(attrs)
      .then(attrs => attrs.map(a => [a.name, a.value]))
      .then(nvList => Promise.all(nvList.map(([name, value]) => {
        this._fetch('put',
                    `devices/${devname}/attributes/${name}?value=${value}`)
      })))
  }

  /**
   * @return {Promise<DeviceAttribute>|Promise<DeviceAttribute[]>}
   * @param {string} devname
   * @param {DeviceAttribute|DeviceAttribute[]} attrs
   */
  write_read_device_attribute(devname, attrs) {
    attrs
    throw new Error('not implemented yet')
  }

  /**
   * @return {Promise<DeviceData>}
   * @param {string} devname
   * @param {string} cmdname
   * @param {undefined|DeviceData} argin
   */
  device_command_inout(devname, cmdname, argin) {

    // PUT http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/commands/State?input
    // FIXME handle result

    const input = argin ? `?input=${argin.value}` : ''
    return this._fetch('put', `devices/${devname}/commands/${cmdname}${input}`)
  }

  /**
   * @return {Promise<CommandInfo>}
   * @param {string} devname
   * @param {string} cmdname
   */
  device_command_query(devname, cmdname) {

    // http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/commands/State

    return this._fetch('get', `devices/${devname}/commands/${cmdname}`)
      .then(({info}) => {
        return new tangojs.core.api.CommandInfo(Object.assign(info, {
          level: info.level
            ? tangojs.core.tango.DispLevel[info.level]
            : info.level
        }))
      })
  }

  /**
   * @return {Promise<CommandInfo[]>}
   * @param {string} devname
   */
  device_command_list_query(devname) {

    // http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/commands

    return this._fetch('get', `devices/${devname}/commands`)
      .then(cmdList => {
        return cmdList.map(({info}) => {
          return new tangojs.core.api.CommandInfo(Object.assign(info, {
            level: info.level
              ? tangojs.core.tango.DispLevel[info.level]
              : info.level
          }))
        })
      })
  }

}


import * as tangojs from 'tangojs-core'
import * as fetchFn from 'node-fetch'
import * as btoaFn from 'btoa'

function normalizeAttrQuality (quality) {
  if (quality) {
    return tangojs.tango.AttrQuality[`ATTR_${quality}`]
  } else {
    return tangojs.tango.AttrQuality.ATTR_INVALID
  }
}

function convertTypeToAttributeDataType (type) {
  // TODO: handle ATT_STATE, DEVICE_STATE
  const ADT = tangojs.tango.AttributeDataType
  switch (type) {
    case 'DevBoolean': return ADT.ATT_BOOL.value
    case 'DevShort': return ADT.ATT_SHORT.value
    case 'DevLong': return ADT.ATT_LONG.value
    case 'DevLong64': return ADT.ATT_LONG64.value
    case 'DevFloat': return ADT.ATT_FLOAT.value
    case 'DevDouble': return ADT.ATT_DOUBLE.value
    case 'DevUChar': return ADT.ATT_UCHAR.value
    case 'DevUShort': return ADT.ATT_USHORT.value
    case 'DevULong': return ADT.ATT_ULONG.value
    case 'DevULong64': return ADT.ATT_ULONG64.value
    case 'DevString': return ADT.ATT_STRING.value
    case 'DevEncoded': return ADT.ATT_ENCODED.value
    default: return ADT.ATT_NO_DATA.value
  }
}

const isResponse = object => object.status && Number.isInteger(object.status)

export class MTangoConnector extends tangojs.Connector {

  /**
   * @param {string} endpoint
   * @param {string} username
   * @param {string} password
   */
  constructor (endpoint, username, password) {
    super()
    this._endpoint = endpoint
    this._username = username
    this._password = password

    const authorization = btoaFn(`${username}:${password}`)

    this._headers = {
      'Authorization': `Basic ${authorization}`
    }
  }

  /**
   * @param {string} method
   * @param {string} address
   * @return {Promise<Response,Error>}
   * @private
   */
  _fetch (method, address, body = undefined) {
    return fetchFn(`${this._endpoint}/${address}`, {
      method: method,
      mode: 'cors',
      headers: this._headers,
      body
    }).then(response => {
      return response.ok ? response.json() : Promise.reject(response)
    }).catch(error => {
      if (isResponse(error)) {
        console.error(`Failed request: ${error.status} ${error.statusText}`,
                      error)
      } else {
        console.error('Network error:', error)
      }
    })
  }

  /**
   * @param {string} devname
   * @return {Promise<string,Error>}
   */
  get_device_status (devname) {

    // 'http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/state'

    return this._fetch('get', `devices/${devname}/state`)
      .then(state => state.status)
  }

  /**
   * @param {string} devname
   * @return {Promise<DevState,Error>}
   */
  get_device_state (devname) {

    // 'http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/state'

    return this._fetch('get', `devices/${devname}/state`)
      .then(state => tangojs.tango.DevState[state.state])
  }

  /**
   * @param {string} devname
   * @return {Promise<DeviceInfo,Error>}
   */
  get_device_info (devname) {

    // http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1

    return this._fetch('get', `devices/${devname}`)
      .then(device => new tangojs.api.DeviceInfo(device.info))
  }

  /**
   * @param {string} pattern
   * @return {Promise<string[],Error>}
   */
  get_device_list (pattern) {

    pattern
    // http://localhost:8080/mtango/rest/rc2/devices
    // FIXME handle pattern

    return this._fetch('get', 'devices')
      .then(devices => {
        return devices.map(d => d.name).filter(n => !n.startsWith('dserver'))
      })
  }

  /**
   * @param {string} pattern
   * @return {Promise<string[],Error>}
   */
  get_device_domain (pattern) {
    pattern
    throw new Error('not implemented yet')
  }

  /**
   * @param {string} pattern
   * @return {Promise<string[],Error>}
   */
  get_device_family (pattern) {
    pattern
    throw new Error('not implemented yet')
  }

  /**
   * @param {string} pattern
   * @return {Promise<string[],Error>}
   */
  get_device_member (pattern) {
    pattern
    throw new Error('not implemented yet')
  }

  /**
   * @param {string} devname
   * @param {string} pattern
   * @return {Promise<string[],Error>}
   */
  get_device_property_list (devname, pattern) {
    // http://localhost:8080/mtango/rest/rc2/devices/test/rest/1/properties
    // returns error
    devname, pattern
    throw new Error('not implemented yet')
  }

  /**
   * @param {string} devname
   * @param {DbDatum[]} propnames
   * @return {Promise<DbDatum[],Error>}
   */
  get_device_property (devname, propnames) {
    // properties are not working
    // let props = extractPropnames(propnames)
    devname, propnames
    throw new Error('not implemented yet')
  }

  /**
   * @param {string} devname
   * @param {DbDatum[]} properties
   * @return {Promise<undefined,Error>}
   */
  put_device_property (devname, properties) {
    devname, properties
    throw new Error('not implemented yet')
  }

  /**
   * @param {string} devname
   * @param {string[]} propnames
   * @return {Promise<undefined,Error>}
   */
  delete_device_property (devname, propnames) {
    devname, propnames
    throw new Error('not implemented yet')
  }

  /**
   * @param {string} devname
   * @return {Promise<string[],Error>}
   */
  get_device_attribute_list (devname) {

    // http://localhost:8080/mtango/rest/rc2/devices/test/rest/1/attributes

    return this._fetch('get', `devices/${devname}/attributes`)
      .then(attributes => attributes.map(a => a.name))
  }

  /**
   * @param {string} devname
   * @param {string[]} attnames
   * @return {Promise<AttributeInfo[],Error>}
   */
  get_device_attribute_info (devname, attnames) {

    // http://localhost:8080/mtango/rest/rc2/devices/test/rest/1/attributes/staticValueExpirationDelay/info

    const getOr = (val, ctor) => val ? ctor[val] : val

    return Promise.all(attnames.map(n => {
      return this._fetch('get', `devices/${devname}/attributes/${n}/info`)
        .then(info => {
          return new tangojs.api.AttributeInfo(Object.assign(info, {
            writable: getOr(info.writable, tangojs.tango.AttrWriteType),
            data_format: getOr(info.data_format, tangojs.tango.AttrDataFormat),
            level: getOr(info.level, tangojs.tango.DispLevel),
            data_type: convertTypeToAttributeDataType(info.data_type),
            att_alarm: new tangojs.tango.AttributeAlarm(info.att_alarm),
            event_prop: new tangojs.tango.EventProperties(info.event_prop)
          }))
        })
    }))
  }

  /**
   * @param {string} devname
   * @param {string[]} attnames
   * @return {Promise<DeviceAttribute[],Error>}
   */
  read_device_attribute (devname, attnames) {

    // http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/attributes/long_scalar/value

    return Promise.all(attnames.map(n => {
      return this._fetch('get', `devices/${devname}/attributes/${n}/value`)
        .then(value => {
          return new tangojs.api.DeviceAttribute(Object.assign(value, {
            quality: normalizeAttrQuality(value.quality),
            time: {
              tv_sec: 0,
              tv_usec: 0,
              tv_nsec: 0
            } // FIXME convert timestamp
          }))
        })
    }))
  }

  /**
   * @param {string} devname
   * @param {DeviceAttribute[]} attrs
   * @return {Promise<undefined,Error>}
   */
  write_device_attribute (devname, attrs) {

    // PUT http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/attributes/long_scalar?value=xx

    const nvList = attrs.map(a => [a.name, a.value])

    return Promise.all(nvList.map(([name, value]) => {
      this._fetch('put', `devices/${devname}/attributes/${name}?value=${value}`)
    }))
  }

  /**
   * @param {string} devname
   * @param {DeviceAttribute[]} attrs
   * @return {Promise<DeviceAttribute[],Error>}
   */
  write_read_device_attribute (devname, attrs) {
    attrs
    throw new Error('not implemented yet')
  }

  /**
   * @param {string} devname
   * @param {string} cmdname
   * @param {undefined|DeviceData} argin
   * @return {Promise<DeviceData,Error>}
   */
  device_command_inout (devname, cmdname, argin) {

    // PUT http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/commands/State?input
    // FIXME handle result

    const input = argin ? `?input=${argin.value}` : ''
    return this._fetch('put', `devices/${devname}/commands/${cmdname}${input}`)
  }

  /**
   * @param {string} devname
   * @param {string} cmdname
   * @return {Promise<CommandInfo,Error>}
   */
  device_command_query (devname, cmdname) {

    // http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/commands/State

    return this._fetch('get', `devices/${devname}/commands/${cmdname}`)
      .then(({info}) => {
        return new tangojs.api.CommandInfo(Object.assign(info, {
          level: info.level
            ? tangojs.tango.DispLevel[info.level]
            : info.level
        }))
      })
  }

  /**
   * @param {string} devname
   * @return {Promise<CommandInfo[],Error>}
   */
  device_command_list_query (devname) {

    // http://localhost:8080/mtango/rest/rc2/devices/sys/tg_test/1/commands

    return this._fetch('get', `devices/${devname}/commands`)
      .then(cmdList => {
        return cmdList.map(({info}) => {
          return new tangojs.api.CommandInfo(Object.assign(info, {
            level: info.level
              ? tangojs.tango.DispLevel[info.level]
              : info.level
          }))
        })
      })
  }

}

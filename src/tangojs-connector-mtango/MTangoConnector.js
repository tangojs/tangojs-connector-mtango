import * as tangojs from 'tangojs-core'
import * as fetchFn from 'node-fetch'
import * as btoaFn from 'btoa'

function none()
{
  return []
}

/**
 * @param {string} type
 * @return {tangojs.tango.AttributeDataType}
 */
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

/**
 * @param {number} timestamp timestmap in milliseconds
 * @return {tangojs.tango.TimeVal}
 */
function convertTimestampToTimeVal (timestamp) {
  return new tangojs.tango.TimeVal({
    tv_sec: Math.floor(timestamp/1000),
    tv_usec: (timestamp % 1000) * 1000,
    tv_nsec: 0
  })
}

const isResponse = object => object.status && Number.isInteger(object.status)

export class MTangoConnector extends tangojs.Connector {

  /**
   * @param {string} endpoint - http://{host}/tango/rest/rc3
   * @param {string} tango_host host name
   * @param {string} tango_port port number
   * @param {string} username
   * @param {string} password
   */
  constructor (endpoint, tango_host, tango_port, username, password) {
    super()
    this._endpoint = `${endpoint}/hosts/${tango_host}/${tango_port}`
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
      credentials: 'include',
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

    // 'http://localhost:8080/tango/rest/rc3/hosts/localhost/10000/devices/sys/tg_test/1/state'

    return this._fetch('get', `devices/${devname}/state`)
      .then(state => state.status)
  }

  /**
   * @param {string} devname
   * @return {Promise<DevState,Error>}
   */
  get_device_state (devname) {

    // 'http://localhost:8080/mtango/rest/rc3/hosts/localhost/10000/devices/sys/tg_test/1/state'

    return this._fetch('get', `devices/${devname}/state`)
      .then(state => tangojs.tango.DevState[state.state])
  }

  /**
   * @param {string} devname
   * @return {Promise<DeviceInfo,Error>}
   */
  get_device_info (devname) {

    // http://localhost:8080/mtango/rest/rc3/hosts/localhost/10000/devices/sys/tg_test/1

    return this._fetch('get', `devices/${devname}`)
      .then(device => new tangojs.api.DeviceInfo(device.info))
  }

  /**
   * @param {string} pattern
   * @return {Promise<string[],Error>}
   */
  get_device_list (pattern) {

    pattern
    // http://localhost:8080/mtango/rest/rc3/hosts/localhost/10000/devices
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
    // http://localhost:8080/mtango/rest/rc3/hosts/localhost/10000/devices/test/rest/1/properties
    // returns error
    pattern
    // FIXME handle pattern
    return this._fetch('get', `devices/${devname}/properties`)
      .then(properties => {
        return properties.map(p => p.name)
      })
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
    // FIXME Promise.all put each property
    throw new Error('not implemented yet')
  }

  /**
   * @param {string} devname
   * @param {string} propname
   * @return {Promise<undefined,Error>}
   */
  delete_device_property (devname, propname) {
    return this._fetch('delete', `devices/${devname}/properties/${propname}`)
  }

  /**
   * @param {string} devname
   * @return {Promise<string[],Error>}
   */
  get_device_attribute_list (devname) {

    // http://localhost:8080/mtango/rest/rc3/hosts/localhost/10000/devices/test/rest/1/attributes

    return this._fetch('get', `devices/${devname}/attributes`)
      .then(attributes => attributes.map(a => a.name))
      .catch(none)
  }

  /**
   * @param {string} devname
   * @param {string[]} attnames
   * @return {Promise<AttributeInfo[],Error>}
   */
  get_device_attribute_info (devname, attnames) {

    // http://localhost:8080/mtango/rest/rc3/hosts/localhost/10000/devices/test/rest/1/attributes/staticValueExpirationDelay/info

    const getOr = (val, ctor) => val ? ctor[val] : val

    const atts = attnames.map(a => `attr=${a}`).join('&')

    return this._fetch('get', `devices/${devname}/attributes/info?${atts}`)
      .then(infos => infos.map( info => {
        return new tangojs.api.AttributeInfo(Object.assign(info, {
          writable: getOr(info.writable, tangojs.tango.AttrWriteType),
          data_format: getOr(info.data_format, tangojs.tango.AttrDataFormat),
          level: getOr(info.level, tangojs.tango.DispLevel),
          data_type: convertTypeToAttributeDataType(info.data_type),
          att_alarm: new tangojs.tango.AttributeAlarm(info.att_alarm),
          event_prop: new tangojs.tango.EventProperties(info.event_prop)
        }))
      }))
      .catch(none)
  }

  /**
   * @param {string} devname
   * @param {string[]} attnames
   * @return {Promise<DeviceAttribute[],Error>}
   */
  read_device_attribute (devname, attnames) {

    const atts = attnames.map(a => `attr=${a}`).join('&')
    // http://localhost:8080/mtango/rest/rc3/hosts/localhost/10000/devices/sys/tg_test/1/attributes/value?attr=long_scalar
    return this._fetch('get', `devices/${devname}/attributes/value?${atts}`)
      .then(values => values.map(value => {
        return new tangojs.api.DeviceAttribute({
          name: value.name,
          value: value.value,
          quality: tangojs.tango.AttrQuality[value.quality],
          time: convertTimestampToTimeVal(value.timestamp)
        })
      }))
  }

  /**
   * @param {string} devname
   * @param {DeviceAttribute[]} attrs
   * @return {Promise<undefined,Error>}
   */
  write_device_attribute (devname, attrs) {

    // PUT http://localhost:8080/mtango/rest/rc3/hosts/localhost/10000/devices/sys/tg_test/1/attributes/values?long_scalar=xx

    return this.write_read_device_attribute(devname, attrs)
      .then(() => undefined)
  }

  /**
   * @param {string} devname
   * @param {DeviceAttribute[]} attrs
   * @return {Promise<DeviceAttribute[],Error>}
   */
  write_read_device_attribute (devname, attrs) {
    const atts = attrs.map(a => `${a.name}=${a.value}`).join('&')
    return this._fetch('put', `devices/${devname}/attributes/value?${atts}`)
      .then(values => values.map(value => {
        return new tangojs.api.DeviceAttribute({
          name: value.name,
          value: value.value,
          quality: tangojs.tango.AttrQuality[value.quality],
          time: convertTimestampToTimeVal(value.timestamp)
        })
      }))
  }

  /**
   * @param {string} devname
   * @param {string} cmdname
   * @param {undefined|DeviceData} argin
   * @return {Promise<DeviceData,Error>}
   */
  device_command_inout (devname, cmdname, argin) {

    // PUT http://localhost:8080/mtango/rest/rc3/hosts/localhost/10000/devices/sys/tg_test/1/commands/State?input
    // FIXME handle result

    const input = argin ? argin.value : ''
    return this._fetch('put', `devices/${devname}/commands/${cmdname}`, input)
  }

  /**
   * @param {string} devname
   * @param {string} cmdname
   * @return {Promise<CommandInfo,Error>}
   */
  device_command_query (devname, cmdname) {

    // http://localhost:8080/mtango/rest/rc3/hosts/localhost/10000/devices/sys/tg_test/1/commands/State

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

    // http://localhost:8080/mtango/rest/rc3/hosts/localhost/10000/devices/sys/tg_test/1/commands

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
      .catch(none)
  }

}

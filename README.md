# tangojs-connector-mtango

[mTango](https://bitbucket.org/hzgwpn/mtango/wiki/Home) backend support for
TangoJS.

## Example

The module exports single constructor function, `MTangoConnector.` Create the
connector and pass it to the `setConnector` method:

```javascript
const connector = new window.tangojs.connector.mtango.MTangoConnector(
  'http://localhost:8080/mtango/rest/rc2', // endpoint
  'tango',                                 // username
  'tango')                                 // password

window.tangojs.core.setConnector(connector)
```

## Configuration

To use this connector, CORS support must be enabled in mTango. This may be
configured in your servlet container - bundled (`*.jar`) version of mTango
won't work. Required steps are described below.

1. Deploy mTango on [Apache Tomcat](https://tomcat.apache.org/download-80.cgi),
   according to [these instructions](https://bitbucket.org/hzgwpn/mtango/wiki/Home#markdown-header-war).

1. Make sure everything works, e.g. you can see the list of all devices if you
   access `http://localhost:8080/mtango/rest/rc2/devices` in your browser.

1. Shutdown the container.

1. Modify `<security-constraint>` for RESTful endpoint (declared in
   `${CATALINA_HOME}/webapps/mtango/WEB-INF/web.xml`). The constraint shall
   apply to all HTTP methods except OPTIONS, which is used for CORS preflight:
   ```xml
  <security-constraint>
    <web-resource-collection>
      <web-resource-name>Tango RESTful gateway</web-resource-name>
      <url-pattern>/rest/*</url-pattern>
      <http-method>GET</http-method>
      <http-method>HEAD</http-method>
      <http-method>POST</http-method>
      <http-method>PUT</http-method>
      <http-method>DELETE</http-method>
    </web-resource-collection>
    <auth-constraint>
      <role-name>mtango-rest</role-name>
    </auth-constraint>
  </security-constraint>
   ```

1. Add servlet filter for CORS requests to `${CATALINA_HOME}conf/web.xml`
   (this should also work when added to mtango-specific `web.xml`).
   ```xml
  <filter>
    <filter-name>CorsFilter</filter-name>
    <filter-class>org.apache.catalina.filters.CorsFilter</filter-class>

    <init-param>
      <param-name>cors.allowed.methods</param-name>
      <param-value>GET,HEAD,POST,PUT,DELETE,OPTIONS</param-value>
    </init-param>

    <init-param>
      <param-name>cors.allowed.headers</param-name>
      <param-value>Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization,Accept-Encoding,Accept-Language,Access-Control-Request-Method,Cache-Control,Connection,Host,Referer,User-Agent</param-value>
    </init-param>

  </filter>

  <filter-mapping>
    <filter-name>CorsFilter</filter-name>
    <url-pattern>/rest/*</url-pattern>
  </filter-mapping>
   ```

Ext.define('Ext.data.proxy.BaseRest', {
    extend: 'Ext.data.proxy.Rest',

    alias : 'proxy.baserest',

    /*
     * Override:
     * Prevent auto put id as a request param
     */
    appendId: false,

    /*
     * Override:
     * Allow caching
     */
    noCache: false,

    /*
     * Override:
     * Removing page, start and limit params from request. It is used after on body request
     */
    pageParam: false,
    startParam: false,
    limitParam: false,

    constructor: function () {
        this.callParent(arguments);

        /*
         * Override:
         * Declaring default URL server method
         */
        const originalUrl = this.getUrl();
        const useOriginal = originalUrl && !originalUrl.match(/Model/);
        
        this.setUrl(useOriginal ? originalUrl : 'server/api/');
    },

    /*
     * Added:
     * Used to declare params on proxy store or model
     * setObjParams to set this value and getObjParams to get this value
     */
    config: {
        objParams: {}
    },

    setObjParams: function (objParams) {
        this.objParams = objParams;
    },

    getObjParams: function () {
        return this.objParams;
    },

    /*
     * Override:
     * Declaring default URL reader and writer
     */
    reader: {
        type: 'json',
        rootProperty: 'result[0].rows',
        successProperty: 'result[0].success',
        totalProperty: 'result[0].total'
    },

    writer : {
        type : 'json',
        writeAllFields: true,
        encode : false
    },

    /*
     * Override:
     * Overriding this method from Ext.data.proxy.Ajax
     */
    doRequest: function(operation) {
        var me = this,
            writer  = me.getWriter(),
            request = me.buildRequest(operation),
            method  = me.getMethod(request),
            jsonData, params;

        if (writer && operation.allowWrite()) {
            request = writer.write(request);
        }

        request.setConfig({
            binary              : me.getBinary(),
            headers             : me.getHeaders(),
            timeout             : me.getTimeout(),
            scope               : me,
            callback            : me.createRequestCallback(request, operation),
            method              : method,
            useDefaultXhrHeader : me.getUseDefaultXhrHeader(),
            disableCaching      : false
        });

        /*
         * Override:
         * Buildind custom params to Delphi server in POST/PUT/DELETE methods (those differents of GET)
         */
        if (method.toUpperCase() !== 'GET') {
            jsonData = [];
            params = this.buildProxyParams();

            if (params) {
                for (var i in params) {
                    jsonData.push(params[i]);
                }

                request.setJsonData(jsonData);
                request.setDisableCaching(false);
            }
        }

        if (me.getWithCredentials()) {
            request.setWithCredentials(true);
            request.setUsername(me.getUsername());
            request.setPassword(me.getPassword());
        }

        return me.sendRequest(request);
    },

    /*
     * Added:
     * Buildind custom params to mORMot/Delphi server
     */
    buildProxyParams: function () {
        var parametros = this.getObjParams().parametros,
            strjson = this.getObjParams().strjson || '{}',
            strParametros = '',
            i;

        if(parametros){
            if(typeof parametros == 'object'){
                for (i in parametros) {
                    strParametros += parametros[i] + '|';
                }

                strParametros = strParametros.slice(0, strParametros.length - 1);

            } else {
                strParametros = parametros;
            }

            if(strParametros[strParametros.length - 1] == '|') {
                strParametros += '0';
            }

            this.setUrl(this.getUrl().split('/api/')[0] + '/api/' + parametros.type);

            return {
                parametros: strParametros,
                strjson: strjson
            };

        } else {
            console.error('"parametros" is required');
            return false;
        }
    }
});

Ext.define('Ext.data.BaseStore', {
    extend: 'Ext.data.Store',

    alias: 'store.basestore',

    config: {
        api: null
    },

    /*
     * Override:
     * Setting default proxy
     */
    proxy: {
        type: 'baserest'
    },

    load: function() {
        /*
         * Override:
         * Returning a Promise
         */
        return new Ext.Promise((resolve, reject) => {
            this.pendingLoadOptions = {
                callback: (records, operation, success) => {
                    if (success) {
                        resolve(records, this);
                    } else {
                        reject(operation.getError(), this)
                    }
                }
            };

            this.doLoad();
        });
    },

    /*
     * Added:
     * Custom Load store for rest proxy
     */
    doLoad: function () {
        const proxy = this.getProxy();

        if (proxy && proxy.getUrl) {
            var urlArray =  proxy.getUrl().split('/');
            urlArray[0] = urlArray[0].match(/http/) ? urlArray[0] : (this.getApi() || configs.getApiNode());
            proxy.setUrl(urlArray.join('/'));
        }

        this.buildProxyParams();

        if (!this.loadTimer) {
            this.loadTimer = Ext.asap(this.flushLoad, this);
        }
    },

    /*
     * Added:
     * Buildind custom params to Delphi server
     */
    buildProxyParams: function () {
        const proxy = this.getProxy();
        const parametros = proxy.getObjParams().parametros;
        const strjson = proxy.getObjParams().strjson || '{}';
        
        let strParametros = '';

        if(parametros){
            if(typeof parametros == 'object'){
                for (let i in parametros) {
                    if(i == 'start') {
                        strParametros += this.getStart() + '|';

                    } else if(i == 'limit') {
                        strParametros += this.getLimit() + '|';

                    } else {
                        strParametros += parametros[i] + '|';
                    }
                }

                strParametros = strParametros.slice(0, strParametros.length - 1);

            } else {
                strParametros = parametros;
            }

            if(strParametros[strParametros.length - 1] == '|') {
                strParametros += '0';
            }

            proxy.setUrl(proxy.getUrl().split('/api/')[0] + '/api/' + parametros.type);

            proxy.setExtraParams({
                parametros: strParametros,
                strjson: strjson
            });

        } else {
            console.error('"parametros" is required');
            return;
        }
    },

    /*
     * Added:
     * getStart and getLimit functions to easily use
     */
    getStart: function () {
        return (this.currentPage - 1) * this.pageSize;
    },

    getLimit: function () {
        return this.pageSize;
    },

    setParams: function (params) {
        var proxy = this.getProxy();

        if(proxy.setObjParams) {
            proxy.setObjParams(params);
        }
    }
});

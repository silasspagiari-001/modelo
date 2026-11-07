Ext.define('Ext.data.NodeJSStore', {
    extend: 'Ext.data.Store',

    alias: 'store.nodejsstore',

    /*
     * Override:
     * Setting default proxy
     */
    proxy: {
        type: 'nodejsrest'
    },

    load: function(options) {
        /*
         * Override:
         * Returning a Promise
         */
        return new Ext.Promise((resolve, reject) => {
            this.pendingLoadOptions = Ext.apply({
                callback: (records, operation, success) => {
                    if (success) {
                        resolve(records, this);
                    } else {
                        try{
                            console.error(operation.error.response.responseText)
                        } catch(e){}
                    }
                }
            }, options);

            /*
             * Override:
             * Custom Load store for rest proxy
             */
            if (this.getProxy().type.match(/rest/)) {
                this.doLoad();

                this.getProxy().on('exception', (proxy, response) => {
                    reject(response, this);
                });

            } else {
                if (this.getAsynchronousLoad()) {
                     this.loadTimer = Ext.asap(this.flushLoad, this);

                } else {
                    this.flushLoad();
                }
            }
        });
    },

    /*
     * Added:
     * Custom Load store for rest proxy
     */
    doLoad: function () {
        const proxy = this.getProxy();
        const api = this.api || configs.getApiNode();

        if (proxy && proxy.getUrl) {
            const log     = proxy.getExtraParams()['log'];

            proxy.setExtraParam('log', log || `GET ${proxy.getUrl().replace('server', '').replace(api, '')}`);

            let urlArray = proxy.getUrl().split('/');

            if(urlArray[0].match(/http/)){
                urlArray[2] = api.replace('https://', '').replace('http://', '');
            } else {
                urlArray[0] = api;
            }

            proxy.setUrl(urlArray.join('/'));
        }

        if (!this.loadTimer) {
            this.loadTimer = Ext.asap(this.flushLoad, this);
        }
    }
});

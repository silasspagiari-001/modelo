Ext.define('Overrides.data.Store', {
    override: 'Ext.data.Store',

    load: function(options) {
        var me = this;
 
        // Legacy option. Specifying a function was allowed. 
        if (typeof options === 'function') {
            options = {
                callback: options
            };
        } else {
            // We may mutate the options object in setLoadOptions. 
            options = options ? Ext.Object.chain(options) : {};
        }
 
        me.pendingLoadOptions = options;
 
        // If we are configured to load asynchronously (the default for async proxies) 
        // then schedule a flush, unless one is already scheduled. 
        /*
        * Override:
        * Custom Load store for rest proxy
        */
        if (this.getProxy().type.match(/rest/)) {
            this.doLoad();

        } else {
            if (this.getAsynchronousLoad()) {
                    this.loadTimer = Ext.asap(this.flushLoad, this);

            } else {
                this.flushLoad();
            }
        }

        return me;
    },

    /*
     * Added:
     * Custom Load store for rest proxy
     */
    doLoad: function () {
        var proxy = this.getProxy(),
            urlArray;

        if (proxy && proxy.getUrl) {
            urlArray =  proxy.getUrl().split('/');
            urlArray[0] = urlArray[0].match(/http/) ? urlArray[0] : configs.getApiNode();
            proxy.setUrl(urlArray.join('/'));
        }

        if (!this.loadTimer) {
            this.loadTimer = Ext.asap(this.flushLoad, this);
        }
    }
});

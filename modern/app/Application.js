Ext.define('SamosAdminModern.Application', {
    extend: 'Ext.app.Application',
    name: 'SamosAdminModern',

    requires: [
        'SamosUtils.*',
        'SamosWidgetsModern.*',
        'SamosAdminModern.login.View',
        'Ext.field.InputMask'
    ],

    launch: function () {        
        if (!!Ext.ClientConfig) {
            const faviconLink = document.querySelector("link[rel*='icon']") || document.createElement('link');
            
            this.removerLoad();
            configs.set(Ext.ClientConfig);
            configs.setApiNode(Ext.ClientConfig.apiNode[0]);
            localStorage.setItem('tema', configs.getTema());

            //momentTz: instancia do moment.tz com o timezone do config
            //momentServer: data/hora servidor (sempre atualizada)
            moment.locale('pt-br');

            window.momentTz = function() {
                const args = Array.from(arguments);
                args.push(configs.getTimezone());
                return moment.tz.apply(this, args);
            };
            
            window.momentServer = momentTz.bind(window, momentTz().utc().format());

            faviconLink.type = 'image/x-icon';
            faviconLink.rel = 'shortcut icon';
            faviconLink.href = `favicon.ico`;
            document.getElementsByTagName('head')[0].appendChild(faviconLink); 

            const login = Ext.create({ xtype: 'main' });
            Ext.Viewport.add(login);

        } else {
            setTimeout(() => this.launch(), 200);
        }

        Ext.getBody().dom.oncontextmenu = () => false;
    },

    onAppUpdate: function () {
        window.location.reload();
    },

    removerLoad: function() {
        try{
            Ext.get('loading').remove();
            Ext.get('loading-mask').remove();
        } catch(e) {}
    }
});

Ext.util.Format.defaultDateFormat = 'd/m/Y';
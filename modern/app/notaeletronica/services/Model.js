Ext.define('SamosAdminModern.notaeletronica.services.Model', {
    alternateClassName: 'NotaEletronica.services.Model',
    singleton: true,

    get: function(id, params) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdminModern.notaeletronica.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/movimentos/${id}`
            }
        });

        if(params){
            store.getProxy().setExtraParams(params);
        }

        return store.load()
            .then(records => records)
            .catch(() => {
                Ext.Note('error', 'Erro no servidor');
                Ext.$('container')[0].stopGauge();
            });
    }
});

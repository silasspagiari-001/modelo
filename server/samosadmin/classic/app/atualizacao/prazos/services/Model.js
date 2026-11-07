Ext.define('SamosAdmin.atualizacao.prazos.services.Model', {
    alternateClassName: 'Prazo.services.Model',
    singleton: true,

    get: function(parcelas) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.atualizacao.prazos.Model',
            proxy: {
                url: 'server/consultas/getidprazo',
                extraParams: {
                    parcelas: parcelas
                }
            }
        });
        
        return store.load().then(records => records[0]);
    }
});

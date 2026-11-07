Ext.define('SamosAdmin.atualizacao.regrafiscal.services.Model', {
    alternateClassName: 'Regrafiscal.services.Model',
    singleton: true,

    get: function(id) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.atualizacao.regrafiscal.Model',
            proxy: {
                url: 'server/regrafiscal'
            }
        });

        if(parseInt(id)){
            store.getProxy().setExtraParam('conteudo', `.${id}`);
        }

        return store.load()
            .then(records => records[0])
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    }
});
 
Ext.define('SamosAdmin.atualizacao.empresas.services.Model', {
    alternateClassName: 'Empresa.services.Model',
    singleton: true,

    get: function(id) {
        const store = this.instanciarStore();
        store.getProxy().setExtraParam('conteudo', id);

        return store.load()
            .then(records => records[0])
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    },

    instanciarStore: function() {
        return Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.atualizacao.empresas.Model',
            proxy: {
                url: 'server/empresas',
                extraParams: {
                    ordem: 4,
                    status: 2,
                    start: 0,
                    limit: 1
                }
            }
        });
    }
});

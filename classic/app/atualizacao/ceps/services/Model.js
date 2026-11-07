Ext.define('SamosAdmin.atualizacao.ceps.services.Model', {
    alternateClassName: 'Cep.services.Model',
    singleton: true,

    get: function(cep) {
        const store = this.instanciarStore();
        store.getProxy().setExtraParam('conteudo', cep);

        return store.load()
            .then(records => records[0])
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    },

    instanciarStore: function() {
        return Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.atualizacao.ceps.Model',
            proxy: {
                url: 'server/consultas/ceps',
                extraParams: {
                    ordem: 0,
                    start: 0,
                    limit: 1
                }
            }
        });
    }
});

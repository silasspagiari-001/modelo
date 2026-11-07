Ext.define('SamosAdmin.atualizacao.relacoes.services.Model', {
    alternateClassName: 'Relacao.services.Model',
    singleton: true,

    get: function(id) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.atualizacao.relacoes.Model',
            proxy: {
                url: 'server/consultas/relacoes'
            }
        });

        if(parseInt(id)){
            store.getProxy().setExtraParam('conteudo', `${id}`);
        }

        return store.load()
            .then(records => records[0])
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    }
});
 
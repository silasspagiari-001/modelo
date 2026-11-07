Ext.define('SamosAdmin.atualizacao.operacoes.services.Model', {
    alternateClassName: 'Operacao.services.Model',
    singleton: true,

    get: function(id) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.atualizacao.operacoes.Model',
            proxy: {
                url: 'server/operacoes'
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
 
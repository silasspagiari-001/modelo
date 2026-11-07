Ext.define('SamosAdmin.atualizacao.pessoas.form.assistencias.services.Model', {
    alternateClassName: 'Assistencia.services.Model',
    singleton: true,

    get: function(id) {
        const store = this.criarStoreAssistencias();

        if(parseInt(id)){
            store.getProxy().setExtraParam('conteudo', `.${id}`);
        }

        return store.load()
            .then(records => records[0])
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    },

    criarStoreAssistencias: function() {
        return Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.atualizacao.pessoas.form.assistencias.Model',
            proxy: {
                url: 'server/assistencias'
            }
        });
    }
});

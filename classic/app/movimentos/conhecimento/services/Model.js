Ext.define('SamosAdmin.movimentos.conhecimento.services.Model', {
    alternateClassName: 'Conhecimento.services.Model',
    singleton: true,

    get: function(id) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.movimentos.conhecimento.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/conhecimento/${id}`
            }
        });

        return store.load()
            .then(records => records)
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    },

    definirValoresPadrao: async function(form, nomeDocumento) {
        const documento = await Documento.services.Model.get(nomeDocumento);
        form.model.set('CONHECIMENTOS_ID_DOCUMENTOS', documento.get('DOCUMENTOS_ID'));
        form.model.set('CONHECIMENTOS_ID_OPERACOES', documento.get('DOCUMENTOS_ID_OPERACOES'));
        form.model.set('OPERACOES_NOME', documento.get('OPERACOES_NOME'));
        return documento;
    }
});

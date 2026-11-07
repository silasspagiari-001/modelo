Ext.define('SamosAdmin.movimentos.manifestos.services.Model', {
    alternateClassName: 'Manifesto.services.Model',
    singleton: true,

    get: function(id) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.movimentos.manifestos.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/manifestos/${id}`
            }
        });

        return store.load()
            .then(records => records)
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    },

    definirValoresPadrao: async function(form, nomeDocumento) {
        const documento = await Documento.services.Model.get(nomeDocumento)
        form.model.set('MANIFESTOS_ID_DOCUMENTOS', documento.get('DOCUMENTOS_ID'));
        form.model.set('MANIFESTOS_ID_CARREGAMENTO', documento.get('EMPRESAS_ID_CIDADES'));        
        form.model.set('CIDADES_NOMECARREGA', documento.get('CIDADES_NOMEEMPRESA'));                
        form.model.set('CIDADES_ESTADOCARREGA', documento.get('CIDADES_ESTADOEMPRESA'));
        form.model.set('CIDADES_IBGECARREGA', documento.get('CIDADES_IBGEEMPRESA'));
        form.model.set('MANIFESTOS_CEPORIGEM', documento.get('EMPRESAS_CEP'));
        return documento;
    }
});

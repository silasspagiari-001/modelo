Ext.define('SamosAdmin.movimentos.encomendas.services.Model', {
    alternateClassName: 'Encomenda.services.Model',
    singleton: true,

    get: function(id, params) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.movimentos.encomendas.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/encomendas/${id}`
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
    },

    definirValoresPadrao: async function(form, nomeDocumento) {
        const documento = await Documento.services.Model.get(nomeDocumento)
        await Encomenda.services.Documento.atribuirDocumento(documento, form.model);
        form.applyTextSearches();
        return documento;
    }
});

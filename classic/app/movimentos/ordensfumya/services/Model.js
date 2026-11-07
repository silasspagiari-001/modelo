Ext.define('SamosAdmin.movimentos.ordensfumya.services.Model', {
    alternateClassName: 'Ordemfumya.services.Model',
    singleton: true,

    get: function(id, params) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.movimentos.ordensfumya.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/ordensfumya/${id}`
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
        await Ordemfumya.services.Documento.atribuirDocumento(documento, form.model);
        form.applyTextSearches();
        return documento;
    }
});

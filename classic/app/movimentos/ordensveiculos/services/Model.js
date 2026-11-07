Ext.define('SamosAdmin.movimentos.ordensveiculos.services.Model', {
    alternateClassName: 'Ordemveiculos.services.Model',
    singleton: true,

    get: function(id, params) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.movimentos.ordensveiculos.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/ordensveiculos/${id}`
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
        const documento = await Documento.services.Model.get(nomeDocumento);
        await Ordemveiculos.services.Documento.atribuirDocumento(documento, form.model);
        form.getViewModel().set('isOSConsumidor', false);
        form.applyTextSearches();
        return documento;
    }
});

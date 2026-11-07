Ext.define('SamosAdminModern.orcamentos.services.Model', {
    alternateClassName: 'Orcamento.services.Model',
    singleton: true,

    get: function(id, params) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdminModern.orcamentos.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/movimentos/${id}`
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

    definirValoresPadrao: async function(movimento, nomeDocumento) {
        const documento = await Orcamento.services.Documento.get(nomeDocumento);
        await Orcamento.services.Documento.atribuirDocumento(documento, movimento);
        return documento;
    }
});

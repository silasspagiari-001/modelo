Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.services.Model', {
    alternateClassName: 'Romaneioconstrucao.services.Model',
    singleton: true,

    definirValoresPadrao: async function(form, nomeDocumento) {
        const documento = await Documento.services.Model.get(nomeDocumento);
        await Romaneioconstrucao.services.Documento.atribuirDocumento(documento, form.model);
        form.applyTextSearches();
        return documento;
    },

    get: function(id) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.movimentos.romaneiosconstrucao.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/romaneiosconstrucao/${id}`
            }
        });

        return store.load()
            .then(records => records)
            .catch(() => {
                Ext.Note('error', 'Erro no servidor');
                Ext.$('container')[0].stopGauge();
            });
    },

    removerItensNaoEntregues: function(form, store){
        const naoEntregar = store.data.items.filter(pedido => pedido.get('ITENS_SELECAO') != 'T');
        
        store.remove(naoEntregar);

        return new Ext.Promise((resolve, reject) => {
            if(naoEntregar.length == 0){
                resolve();
            } else {
                setTimeout(() => {
                    form.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());
                    setTimeout(() => {
                        resolve();
                    }, 500);
                }, 500);                        
            }
        });
    }
    
});

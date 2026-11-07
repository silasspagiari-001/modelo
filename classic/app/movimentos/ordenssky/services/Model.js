Ext.define('SamosAdmin.movimentos.ordenssky.services.Model', {
    alternateClassName: 'Ordemsky.services.Model',
    singleton: true,

    get: function(id, params) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.movimentos.ordenssky.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/ordenssky/${id}`
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
        await Ordem.services.Documento.atribuirDocumento(documento, form.model);
        form.applyTextSearches();
        return documento;
    },

    exibirPedidoGerado: function(idPedido) {
        const view = Ext.$('ordensskyavanco')[0];

        view.initGauge('Gerando arquivo para impressão...');

        SamosUtils.Request.nodeApi({
            url: `/relatorios/${configs.getClientName()}/pedidos`,
            method: 'GET',
            query: {
                id: idPedido,
                titledocumento : 'Pedido'
            }
        })
        .done(res => {
            view.getController().onSairClick();

            SamosUtils.Pdf.exibir({
                local: 'window',
                caminho: res.results[0]['name'], 
                serverType: 'nodejs'
            });
        })
        .fail(err => {
            view.stopGauge();

            Ext.Note('error', 'Erro no servidor');
            console.error(err);
        });
    }
});

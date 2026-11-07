Ext.define('SamosAdminModern.pedidos.services.Documento', {
    alternateClassName: 'Pedido.services.Documento',
    singleton: true,

    get: function(nomeDocumento, idEmpresa) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            //model: 'SamosAdmin.atualizacao.documentos.Model',
            proxy: {
                url: 'server/documentos',
                extraParams: {
                    ordem: '0',
                    status: 2,
                    start: 0,
                    limit: 1
                }
            }
        });
        
        store.getProxy().setExtraParam('conteudo', nomeDocumento || '')
        store.getProxy().setExtraParam('empresa',  idEmpresa || configs.getEmpresa().id);

        return store.load()
            .then(records => records[0])
            .catch(error => SamosUtils.Msg.error(error, 'Erro no servidor'));
    }
});

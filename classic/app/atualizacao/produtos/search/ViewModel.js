Ext.define('SamosAdmin.atualizacao.produtos.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.produtossearch',

    constructor: function () {
        this.callParent(arguments);

        let isMovimento = Ext.$('formmovimentos')[0] ? true : false;
        let isPedidoCompra = (isMovimento ? (Ext.$('formmovimentos')[0].getViewModel().get('isPedidoCompra') ? true : false) : false);
        let isPedidoAssistencia = (isMovimento ? (Ext.$('formmovimentos')[0].getViewModel().get('model.MOVIMENTOS_SITUACAO') == 'A' ? true : false) : false);

        this.setData({
            valueOrdem: configs.getProdutos().ordemBusca,
            valueStatus: (isPedidoCompra && isPedidoAssistencia) ? 'A' : configs.getProdutos().statusConsultaPreco
        });

        this.setFormulas({
            isSupervisor: function(get) {

                if(configs.getClientName() == 'hermes') {
                    return configs.getUsuario().tipo == 0;
                } else {
                    return configs.getUsuario().privilegiado;
                }

            }
        });

    }
});

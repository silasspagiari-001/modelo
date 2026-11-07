Ext.define('SamosAdmin.relatorios.pedidoscompra.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriospedidoscompralist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueGrupo     : '',
            valueFornecedor: '',
            valueIdGrupo   : '',
            valueIdPessoa  : '',
            valueItens     : '1',
            valueStatus    : '0',
            valueInicio    : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal     : momentServer().endOf('month').format('DD/MM/YYYY')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});

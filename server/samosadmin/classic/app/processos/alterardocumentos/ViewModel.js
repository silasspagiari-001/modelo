Ext.define('SamosAdmin.processos.alterardocumentos.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.processosalterardocumentos',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideEfetivar    : false,
            hideImprimir    : false,
            valueDocumento  : 'Requisições',
            valueNumero     : '',
            valueEmail      : '',
            valueProdutos   : 'F',
            valueInicio     : momentServer().subtract(1, 'month').startOf('month').format('DD/MM/YYYY'),
            valueFinal      : momentServer().subtract(1, 'month').endOf('month').format('DD/MM/YYYY'),
            valueNovaEmissao: momentServer().format('DD/MM/YYYY')
        });
    }
});

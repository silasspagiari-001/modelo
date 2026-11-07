Ext.define('SamosAdmin.processos.gerarpdfsnfe.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.processosgerarpdfsnfe',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideEfetivar    : false,
            hideImprimir    : false,
            valueDocumento  : 'Nota Eletrônica',
            valueNumero     : '',
            valueEmail      : '',
            valueProdutos   : 'F',
            valueInicio     : momentServer().subtract(1, 'month').startOf('month').format('DD/MM/YYYY'),
            valueFinal      : momentServer().subtract(1, 'month').endOf('month').format('DD/MM/YYYY'),
            valueNovaEmissao: momentServer().format('DD/MM/YYYY')
        });

        this.setFormulas({
            hideDownload: function(get){
                return false;
            },

            hideEnviarEmail: function(get){
                return false;
            }
        });
    }
});

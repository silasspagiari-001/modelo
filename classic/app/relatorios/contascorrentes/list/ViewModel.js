Ext.define('SamosAdmin.relatorios.contascorrentes.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioscontascorrenteslist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir      : false,
            valueInicio       : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal        : momentServer().endOf('month').format('YYYY-MM-DD'),
            valueTipo         : 1,
            valueDespesas     : 1,
            valueIdContai     : 1,
            valueIdContaf     : 999999,
            valueIdAplicacaoi : 1,
            valueIdAplicacaof : 999999
        });
    }
});

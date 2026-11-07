Ext.define('SamosAdmin.relatorios.bancos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosbancoslist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueTipo         : 0,
            valueIdAplicacaoi : 1,
            valueIdAplicacaof : 999999,
            valueIdPortadori  : 1,
            valueIdPortadorf  : 999999,
            valueInicio       : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal        : momentServer().format('YYYY-MM-DD')
        });

        this.setFormulas({
            hideImprimir: function(get){
                return false;
            }
        });
    }    
});
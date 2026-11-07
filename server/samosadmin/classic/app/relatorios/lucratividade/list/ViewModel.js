Ext.define('SamosAdmin.relatorios.lucratividade.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioslucratividadelist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdProdutoi: 1,
            valueIdProdutof: 999999,
            valueIdGrupoi  : 1,
            valueIdGrupof  : 999999,
            valueInicio    : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal     : momentServer().format('YYYY-MM-DD'),
            valueIdUsuario: null 
        });

        this.setFormulas({
            hideImprimir: function(get){
                return false;
            }
        });
    }    
});

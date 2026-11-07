Ext.define('SamosAdmin.relatorios.inventario.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosinventariolist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir : false,
            valueIdGrupoi: 1,
            valueIdGrupof: 999999,
            valueTipo    : 0,
            valuePreco   : configs.getClientName() == 'biomart' ? 0 : 3,
            valueTiposaldo: 0,
            valueAcresDecrescimo: 0,
            percentualAcrescimoDecrescimo: 0,
            valueDataBase: momentServer().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
        });
    }
});

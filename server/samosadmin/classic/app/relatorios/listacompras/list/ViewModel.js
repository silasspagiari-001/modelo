Ext.define('SamosAdmin.relatorios.listacompras.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioslistacompraslist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({            
            hideImprimir : false,
            valueIdGrupoi: 0,
            valueIdGrupof: 999999,
            valueIdPessoai: 0,
            valueIdPessoaf: 999999,
            valuePrecos: 0
        });
    }
});

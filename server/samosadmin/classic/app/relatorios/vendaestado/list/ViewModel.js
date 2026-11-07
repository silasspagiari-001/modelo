Ext.define('SamosAdmin.relatorios.vendaestado.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendaestadolist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            codpessoai      : 0,
            codpessoaf      : 0,
            codprodutoi     : 0,
            codprodutof     : 0,
            codgrupoi       : 0,
            codgrupof       : 0,
            valueEstado     : 'Todos',
            valueDocumento  : 1,
            valueInicio     : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal      : momentServer().format('YYYY-MM-DD')
        })

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});

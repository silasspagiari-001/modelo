Ext.define('SamosAdmin.relatorios.vendapessoa.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendapessoalist',

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
            valueItens      : 0, 
            valueOperacoes  : 0,
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

Ext.define('SamosAdmin.relatorios.produtos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosprodutoslist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio    : '',
            valueFinal     : '',
            valueOrdem     : 0,   // Padrão - Nome
            valueStatus    : 'T',  // Padrão - Ativos
            valueRelacionar: 0
        })
    }    
});

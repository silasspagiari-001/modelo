Ext.define('SamosAdmin.movimentos.ordensproducao.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.ordensproducao',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            hideLotes     : false,
            hideFormulas  : false,
            valuePessoa   : '',
            valueIdPessoa : '',
            valueProduto  : '',
            valueIdProduto: '',
            valueLote     : '',
            valueIdLote   : '',
            valueStatus   : 3,
            valueInicio   : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal    : momentServer().add(1, 'year').format('DD/MM/YYYY'),
        });
    }
});

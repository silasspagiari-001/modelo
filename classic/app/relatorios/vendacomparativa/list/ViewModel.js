Ext.define('SamosAdmin.relatorios.vendacomparativa.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendacomparativalist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            codcidade: undefined,
            codproduto: undefined,
            codgrupoi: 0,
            codgrupof: 999999,
            codpessoai: 0,
            codpessoaf: 999999,
            valueInicio   : momentServer().startOf('year').format('DD/MM/YYYY'),
            valueFinal    : momentServer().format('YYYY-MM-DD'),
            valueTipo: 0,
            valueOrdem: 0
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});

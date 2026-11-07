Ext.define('SamosAdmin.atualizacao.pessoas.form.precos.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formpessoasprecos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            dataPrecos: []
        });

        this.setStores({
            precos: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.produtos.Model',
                autoLoad: true,
                data: '{dataPrecos}',
                proxy: {
                    type: 'memory'
                }
            }
        });
    }
});

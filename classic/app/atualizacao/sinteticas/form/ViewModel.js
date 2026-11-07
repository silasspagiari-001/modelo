Ext.define('SamosAdmin.atualizacao.sinteticas.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formsinteticas',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            ultimaConta: ''
        });

        this.setFormulas({
            
        });

        this.setStores({
            sinteticas: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.sinteticas.Model',
                proxy: {
                    url: 'server/aplicacoes',
                    extraParams: {
                        ordem: 3,
                        razao: Ext.$('sinteticas')[0].getViewModel().get('valueRazao') == 0 ? 1 : 1,
                        start: 0,
                        limit: 9999,
                        tipo: Ext.$('sinteticas')[0].getViewModel().get('valueTipo')
                    }
                },
                autoLoad: true
            }
        });
    }
});

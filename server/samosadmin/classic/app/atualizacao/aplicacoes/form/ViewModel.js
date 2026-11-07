Ext.define('SamosAdmin.atualizacao.aplicacoes.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formaplicacoes',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            ultimaConta: ''
        });

        this.setStores({
            aplicacoes: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.aplicacoes.Model',
                proxy: {
                    url: 'server/aplicacoes',
                    extraParams: {
                        ordem: 3,
                        razao: 1, //Sintetica
                        start: 0,
                        limit: 9999,
                        tipo: 0
                    }
                },
                autoLoad: true
            }
        });
    }
});

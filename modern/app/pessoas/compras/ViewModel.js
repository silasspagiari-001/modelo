Ext.define('SamosAdminModern.pessoas.compras.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.pessoascompras',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            total: 'R$ 0,00'
        })

        this.setStores({
            main: {
                type: 'nodejsstore',
                proxy: {
                    url: 'server/consultas/comprasvendaspessoa',
                    extraParams: {
                        empresa: '{empresa}',
                        pessoa: '{pessoa}',
                        acao: 'VN',
                        inicio: momentServer().subtract(10, 'years').format('DD/MM/YYYY'),
                        final: momentServer().add(1, 'month').format('DD/MM/YYYY'),
                        start: 0,
                        limit: 9999999
                    }
                }
            }
        })
    }
});

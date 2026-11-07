Ext.define('SamosAdmin.atualizacao.permissoes.copiar.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.permissoescopiar',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideCopiar: false,
            hideSair: false
        });

        this.setStores({
            empresas: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.empresas.Model',
                autoLoad: true,
                proxy: {
                    url: 'server/empresas',
                    extraParams: {
                        conteudo: '',
                        ordem: '4',
                        status: '2'
                    }
                }
            }
        });
    }
});

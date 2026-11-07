Ext.define('SamosAdmin.atualizacao.pessoas.form.documentos.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formpessoasdocumentos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            readOnly: true,
            hideVisualizar: false,
            hideBaixar: false,
            hideExcluir: false,
            hideCarregar: false,
            hideSair: false
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.pessoas.form.documentos.Model',
                autoLoad: true,
                pageSize: 9999,
                proxy: {
                    type: 'nodejsrest',
                    url: 'server/pessoasdocumentos',
                    extraParams: {
                        idPessoa: '{idPessoa}'
                    }
                }
            }
        });
    }
});

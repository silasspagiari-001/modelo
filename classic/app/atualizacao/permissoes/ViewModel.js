Ext.define('SamosAdmin.atualizacao.permissoes.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.permissoes',

    requires: [
        'Ext.data.proxy.Rest'
    ],

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            readOnly: true,
            valueOrdem: 0,
            valueStatus: 0,
            selectedEmpresa: 1,
            perfil: 0
        });

        this.setFormulas({
            hideNovo: function (get) {
                return (get('updating') || !get('semPermissoes'));
            },

            hideAlterar: function (get) {
                return (get('updating') || get('semPermissoes'));
            },

            hideCopiar: function (get) {
                return !get('updating');
            },

            hideExcluir: function (get) {
                return (get('updating') || get('semPermissoes'));
            },

            hideSair: function (get) {
                return get('updating');
            },

            hideGravar: function (get) {
                return get('readOnly');
            },

            hideCancelar: function (get) {
                return get('readOnly');
            },

            updating: function (get) {
                return !get('readOnly');
            },

            key: function (get) {
                return get('model.PERMISSOES_ID');
            }
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.permissoes.Model',
                autoLoad: true,
                proxy: {
                    url: 'server/permissoes', 
                    extraParams: {
                        pessoa : '{usuario}',
                        empresa: '{selectedEmpresa}'
                    }
                },
                listeners: {
                    beforeload: 'beforeLoadPermissoes',
                    load: 'afterLoadPermissoes'
                }
            },

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

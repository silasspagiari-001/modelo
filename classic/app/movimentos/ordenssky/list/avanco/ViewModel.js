Ext.define('SamosAdmin.movimentos.ordenssky.list.avanco.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.ordensskyavanco',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            dataAvanco: [],
            hideGravar: false,
            hideSair  : false
        });
    },

    stores: {
        tecnicos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.atualizacao.usuarios.Model',
            proxy: {
                url: 'server/usuarios',
                extraParams: {
                    tipo: '2'
                }
            }
        },

        ordensskyavanco: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordenssky.ModelAvanco',
            autoLoad: true,
            data: '{dataAvanco}',
            proxy: {
                type: 'memory'
            }
        }
    }
});

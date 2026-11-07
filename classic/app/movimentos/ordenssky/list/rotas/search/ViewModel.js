Ext.define('SamosAdmin.movimentos.ordenssky.list.rotas.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.ordensskyrotassearch',

    constructor: function () {
        const hoje = momentServer().hours(0).minutes(0).seconds(0);

        this.callParent(arguments);

        this.setData({
            dataRotas: [],
            hideSelecionar: false,
            hideSair: false,
            valueSelecionarRota: hoje.subtract(momentTz().day() - 1, 'days').format('DD/MM/YYYY')
        });
    },

    stores: {
        ordensskyrotas: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordenssky.ModelRotas',
            autoLoad: true,
            data: '{dataRotas}',
            proxy: {
                type: 'memory'
            }
        }
    }
});

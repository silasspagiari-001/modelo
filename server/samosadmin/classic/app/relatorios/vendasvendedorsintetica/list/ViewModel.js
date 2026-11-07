Ext.define('SamosAdmin.relatorios.vendasvendedorsintetica.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendasvendedorsinteticalist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir   : false,
            valueInicio    : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal     : momentServer().endOf('month').format('YYYY-MM-DD'),
            valueIdUsuarioi: 1,
            valueIdUsuariof: 999999,
            valueIdGrupoi  : 1,
            valueIdGrupof  : 999999,
            valueIdProdutoi: 1,
            valueIdProdutof: 999999,
            valueIdPessoai : 1,
            valueIdPessoaf : 999999,
            valueDocumento : '3',
            valueVacina    : '2',
            valueNfe       : '0'
        });

        this.setFormulas({
            hideVacina: function (get) {
                return !configs.getProdutos().vacinas
            },

            disableUpdate: function (get) {
                return (get('updating') || get('semPermissoes'));
            },

            disableDestroy: function (get) {
                return (get('updating') || get('semPermissoes'));
            },

            hiddenExit: function (get) {
                return get('updating');
            },

            hiddenSave: function (get) {
                return get('readOnly');
            },

            updating: function (get) {
                return !get('readOnly');
            }
        });

    }
});

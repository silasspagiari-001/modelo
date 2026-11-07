Ext.define('SamosAdmin.relatorios.ordemcarregamento.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosordemcarregamentolist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdUsuario: '',
            valueUsuario: '',
            valueNotainicial: 0,
            valueNotafinal: 0
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
Ext.define('SamosAdmin.relatorios.vendatipo.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendatipolist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            idempresa: 0,
            valueInicio: momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal:  momentServer().format('YYYY-MM-DD')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });

    }    
});

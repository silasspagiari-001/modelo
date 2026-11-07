Ext.define('SamosAdmin.movimentos.promocoes.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.promocoes',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: 0,
            valueInicio: momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal : momentServer().format('YYYY-MM-DD')
        });

        this.setFormulas({
            hideAlterarInicioValidade: function(get) {
                return false;
            },
        });
    }
});

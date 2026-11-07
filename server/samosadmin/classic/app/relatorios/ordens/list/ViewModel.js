Ext.define('SamosAdmin.relatorios.ordens.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosordenslist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdPessoa: '',
            valuePessoa: '',
            valueInicio: momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal: momentServer().format('YYYY-MM-DD'),
            valueOrdem: 0,
            valueStatus: 'T'
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
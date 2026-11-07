Ext.define('SamosAdmin.consultas.pendenciasromaneioconstrucao.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',              
    alias: 'viewmodel.pendenciasromaneioconstrucao',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valuePessoa : '',
            valueProduto: '',
            valueInicio : momentServer().startOf('year').format('YYYY-MM-DD')
        });
    }
}); 

Ext.define('SamosAdmin.consultas.pendencias.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.pendenciassearch',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valuePessoa : '',
            valueProduto: '',
            valueInicio : momentServer().startOf('year').format('DD/MM/YYYY'),
            totalGeral  : '0,00'
        });
    }
});

Ext.define('SamosAdmin.processos.xmlcontabilidade.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.xmlcontabilidade',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideEnviar: false,
            valueOrdem: 4,
            valueEmail: configs.getMovimentos().emailXMLCtb || '',
            valueMes  : momentServer().subtract(1, 'month').format('MM'),
            valueAno  : momentServer().subtract(1, 'month').format('YYYY')
        });
    }
});

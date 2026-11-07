Ext.define('SamosAdmin.processos.csvcontabilidade.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.csvcontabilidade',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideEnviar: false,
            valueOrdem: 4,
            valueEmail: '',
            valueMes  : momentServer().subtract(1, 'month').format('MM'),
            valueAno  : momentServer().subtract(1, 'month').format('YYYY')
        });
    }
});

Ext.define('SamosAdmin.processos.spedpiscofins.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.spedpiscofins',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideGerar : false,
            valueOrdem: 4,
            valueTipo : 'spedfiscal',
            valueEmail: '',
            valuePreco: '',
            valueMes  : parseInt(momentServer().subtract(1, 'month').format('MM')),
            valueAno  : momentServer().subtract(1, 'month').format('YYYY')
        });
    }
});

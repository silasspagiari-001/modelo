Ext.define('SamosAdmin.relatorios.vendausuario.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendausuariolist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdEmpresa: '',
            valueIdUsuario: '',
            valueTipo: 0,
            valueDocumento: 2,
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

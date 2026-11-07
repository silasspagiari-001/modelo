Ext.define('SamosAdmin.relatorios.romaneios.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosromaneioslist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdEmpresa: '',            
            valueIdPessoa: '',
            valueIdTransporte: '',
            valueOrdem  : 0,
            valueInicio : momentServer().format('DD/MM/YYYY'),
            valueFinal  : momentServer().format('DD/MM/YYYY')
        });

        this.setFormulas({
            hideImprimir: function(get){
                return false;
            }
        });
    }    
});

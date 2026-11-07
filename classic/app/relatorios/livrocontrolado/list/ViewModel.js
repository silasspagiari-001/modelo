Ext.define('SamosAdmin.relatorios.livrocontrolado.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioslivrocontroladolist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio: momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal : momentServer().format('YYYY-MM-DD'),
            valueTipo  : 'TD'
        });

        this.setFormulas({
            hideImprimir: function(get){
                return false;
            }
        });
    }    
});

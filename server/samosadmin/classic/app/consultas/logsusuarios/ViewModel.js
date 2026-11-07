Ext.define('SamosAdmin.consultas.logsusuarios.ViewModel', {
    extend: 'SamosModule.list.ViewModel',              
    alias: 'viewmodel.logsusuarios',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueUsuario  : '',
            valueIdUsuario: '',
            valueTipo     : 'P',
            valueInicio   : momentServer().format('DD/MM/YYYY'),
            valueFinal    : momentServer().format('DD/MM/YYYY')
        });
    }
}); 

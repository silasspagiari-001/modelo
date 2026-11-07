Ext.define('SamosAdminModern.main.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.main',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideVoltar : true,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        })
    }
});

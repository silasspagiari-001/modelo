Ext.define('SamosAdmin.movimentos.ordenseleve.form.baixar.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formordenselevebaixar',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideSair: false,
            hideBaixar: false,
            dataemissao: momentServer().format('YYYY-MM-DD'),            
            datavcto:    momentServer().add(14, 'days').format('YYYY-MM-DD')
        });
    }
});

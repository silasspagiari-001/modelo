Ext.define('SamosAdmin.consultas.precoproduto.formsaldos.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formprecossaldos',

    onItemDblClick: Ext.emptyFn,

    onFotosClick: function() {
        const view = Ext.create({
            xtype: 'formprodutosfotos'
        });

        view.getViewModel().set({
            'idProduto' : this.getRecord().get('PRODUTOS_ID'),
            'hideBaixar': true,
            'hideExcluir': true,
            'hideCarregar': true
        });
    }

});

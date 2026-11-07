Ext.define('SamosAdmin.movimentos.movimento.searchitens.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.movimentositenssearch',

    getBuscarParams: function () {
        return {
            idmovimento: this.getViewModel().get('valueNumero')
        }
    }
});

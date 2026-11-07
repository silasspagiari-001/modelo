Ext.define('SamosAdminModern.pedidos.pagamentos.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pedidospagamentos',

    showButtons: function() {
        const main = this.getView().up('main');
        main.down('image[reference="logo"]').hide();
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');
        
        main.down('panel').setActiveItem('pedidosform');
        main.down('container[reference="title"]').setHtml('Pedido');

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });
    }
});

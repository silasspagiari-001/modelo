Ext.define('SamosAdminModern.pedidos.produtos.list.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pedidosprodutos',

    onItemClick: async function (dataview, index, target, record, e) {
        this.getViewModel().set({
            'produto' : record,
            'initialValues': Object.assign({}, record.data),
            'hideForm': false
        });
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

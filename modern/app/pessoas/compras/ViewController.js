Ext.define('SamosAdminModern.pessoas.compras.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pessoascompras',

    showButtons: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').hide();
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        })
    },

    onItemClick: Ext.emptyFn,

    onVoltarClick: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').show();
        main.down('panel').setActiveItem('pessoasform');
        main.down('container[reference="title"]').setHtml('Pessoa');
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: false,
            hideAlterar: false,
            hideGravar : true,
            hideNovo   : true
        })
    }
});

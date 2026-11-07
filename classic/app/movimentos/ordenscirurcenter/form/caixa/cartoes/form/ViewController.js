Ext.define('SamosAdmin.movimentos.ordenscirurcenter.form.caixa.cartoes.form.ViewController', {
    extend: 'SamosAdmin.movimentos.ordenscirurcenter.form.caixa.ViewController',
    alias: 'controller.formordenscirurcentercaixaformcartoes',

    onAlterarClick: function() {
        var formMovimento = this.getView().up('formordenscirurcenter'),
            ctrlMovimento = formMovimento.getController(),
            ctrlCartao = formMovimento.down('formordenscirurcentercaixacartoes').getController();

        ctrlCartao.onAlterarClick.call(ctrlCartao);
        ctrlMovimento.setReadOnly.call(this, false);
        ctrlMovimento.doDefaultFocus.call(this);
    },

    onConfirmarClick: function (btn, e) {
        Ext.defer(this.getView().destroy, 200, this.getView());
    }
});

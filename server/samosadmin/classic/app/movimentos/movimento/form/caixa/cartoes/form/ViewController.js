Ext.define('SamosAdmin.movimentos.movimento.form.caixa.cartoes.form.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.caixa.ViewController',
    alias: 'controller.formmovimentoscaixaformcartoes',

    onAlterarClick: function() {
        var formMovimento = this.getView().up('formmovimentos'),
            ctrlMovimento = formMovimento.getController(),
            ctrlCartao = formMovimento.down('formmovimentoscaixacartoes').getController();

        ctrlCartao.onAlterarClick.call(ctrlCartao);
        ctrlMovimento.setReadOnly.call(this, false);
        ctrlMovimento.doDefaultFocus.call(this);
    },

    onConfirmarClick: function (btn, e) {
        Ext.defer(this.getView().destroy, 200, this.getView());
    }
});

Ext.define('SamosAdmin.movimentos.caixa.form.cartoes.form.ViewController', {
    extend: 'SamosAdmin.movimentos.caixa.form.ViewController',
    alias: 'controller.formcaixaformcartoes',

    onAlterarClick: function() {
        const formCaixa = this.getView().up('formcaixa');
        const ctrlCaixa = formCaixa.getController();
        const ctrlCartao = formCaixa.down('formcaixacartoes').getController();

        ctrlCartao.onAlterarClick.call(ctrlCartao);
        ctrlCaixa.setReadOnly.call(this, false);
        ctrlCaixa.doDefaultFocus.call(this);
    },

    onConfirmarClick: function (btn, e) {
        Ext.defer(this.getView().destroy, 200, this.getView());
    }
});

Ext.define('SamosAdmin.movimentos.movimento.form.docsvinculados.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentosdocsvinculados',

    moduleName: 'MOVIMENTOSENVIO',

    onConfirmarClick: function (btn, e) {
        var formMovimento = this.getView().up('formmovimentos'),
            ctrlMovimento = formMovimento.getController(),
            callback = typeof e =='function' ? e : undefined;

        const listTransportes = formMovimento.getViewModel().get('model.MOVIMENTOS_ENVIO');

        listTransportes[0]['MOVIMENTOSENVIO_REFERENTE'] = this.lookup('referente').getValue();

        if(Movimento.services.Transporte.validar()){
            if(btn.getText() == 'Gravar'){
                callback();
            } else {
                this.getView().destroy();
                ctrlMovimento.lookup('observacoes').focus(true);
                ctrlMovimento.finalizarEdicao();
            }
        }
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();
            
        this.onConfirmarClick(btn, () => {
            Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                if (btn == 'yes') {
                    this.getView().initGauge('Gravando...');
                    ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);
                    movimento.save()
                        .then(ctrlMovimento.onGravacaoSucesso.bind(ctrlMovimento))
                        .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                        .finally(() => {
                            ctrlMovimento.aposGravar.call(ctrlMovimento);
                            ctrlMovimento.setReadOnly.call(this, true);
                            this.getView().stopGauge();
                        });
                }
            });
        });
    },

    onCancelarClick: function() {
        this.getViewModel().set('model', undefined);
        this.callParent(arguments);        
    },

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
    }
});

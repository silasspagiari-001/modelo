Ext.define('SamosAdmin.movimentos.movimento.form.dadosimportacao.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentosdadosimportacao',

    moduleName: 'MOVIMENTOSENVIO',

    onConfirmarClick: function (btn, e) {
        var formMovimento = this.getView().up('formmovimentos'),
            ctrlMovimento = formMovimento.getController(),
            callback = typeof e =='function' ? e : undefined;

        const listTransportes = formMovimento.getViewModel().get('model.MOVIMENTOS_ENVIO');

        listTransportes[0]['MOVIMENTOSENVIO_DI']            = this.lookup('di').getValue();
        listTransportes[0]['MOVIMENTOSENVIO_DATADI']        = momentTz(this.lookup('datadi').getValue()).format('YYYY-MM-DD');
        listTransportes[0]['MOVIMENTOSENVIO_DESEMBARQUE']   = this.lookup('desembarque').getValue();
        listTransportes[0]['MOVIMENTOSENVIO_UFDESEMBARQUE'] = this.lookup('ufdesembarque').getValue();
        listTransportes[0]['MOVIMENTOSENVIO_DTDESEMBARQUE'] = momentTz(this.lookup('dtdesembarque').getValue()).format('YYYY-MM-DD');
        listTransportes[0]['MOVIMENTOSENVIO_VIATRANSPORTE'] = this.lookup('viatransporte').getValue();
        listTransportes[0]['MOVIMENTOSENVIO_CODFABRICANTE'] = this.lookup('codfabricante').getValue();
        listTransportes[0]['MOVIMENTOSENVIO_CODEXPORTADOR'] = this.lookup('codexportador').getValue();
        listTransportes[0]['MOVIMENTOSENVIO_INTERMEDIARIO'] = this.lookup('intermediario').getValue();

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

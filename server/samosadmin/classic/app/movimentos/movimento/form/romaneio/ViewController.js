Ext.define('SamosAdmin.movimentos.movimento.form.romaneio.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentosromaneio',

    onAlterarClick: function() {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();
        const id      = movimento.get('MOVIMENTOS_ID');
        const numero  = movimento.get('MOVIMENTOS_NUMERO');
        const serie   = movimento.get('MOVIMENTOS_SERIE');
        const empresa = movimento.get('MOVIMENTOS_ID_EMPRESAS');

        movimento.getProxy().setExtraParam('log', `PUT /movimentos/romaneio/${id} (${numero}|${serie}|${empresa})`);
        SamosUtils.Events.enableWarnReload();
        this.setReadOnly(false);
        this.doDefaultFocus();
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();

        const itens = movimento.get('MOVIMENTOS_ITENS') || []; 

        const algumInvalido = itens.some(item => {
            return grams(item['MOVIMENTOSITENS_IMEDIATA']) > grams(item['MOVIMENTOSITENS_QUANTIDADE']);
        });

        if(algumInvalido) {
            Ext.Note('warning', 'Produto(s) com quantidades inválidas - corrigir');
            return;
        }

        if(Movimento.services.Romaneio.validar()){
            Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', async btn => {
                if (btn == 'yes') {
                    this.getView().initGauge('Gravando...');
                    
                    ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento, false);

                    movimento.save()
                        .then(() => Ext.Note('success', 'Gravado com sucesso'))
                        .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                        .finally(this.onSairClick.bind(this));
                }
            });
        };
    }

});

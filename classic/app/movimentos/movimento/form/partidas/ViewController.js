Ext.define('SamosAdmin.movimentos.movimento.form.partidas.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentospartidas',

    onAlterarClick: function() {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();
        if(
            !this.permiteAlteracao && 
            movimento.get('ROMANEIOS_MOVEIS') &&
            movimento.get('ROMANEIOS_MOVEIS').length > 0
        ){
            Ext.Note('warning', 'Este movimento está em romaneio');

            if(configs.getUsuario().privilegiado) {
                this.permiteAlteracao = true;
                movimento.getProxy().setExtraParam('senhaNivel', 'true');
                this.onAlterarClick();
            } else {
                const nivel = 1;
    
                Ext.create({ xtype: 'samoswidgets-senhanivel' })
                    .iniciar(nivel)
                    .then(() => {
                        this.permiteAlteracao = true;
                        movimento.getProxy().setExtraParam('senhaNivel', 'true');
                        this.onAlterarClick();
                    })
                    .catch(() => {/*acao ao sair*/});
            }
        } else {
            const id      = movimento.get('MOVIMENTOS_ID');
            const numero  = movimento.get('MOVIMENTOS_NUMERO');
            const serie   = movimento.get('MOVIMENTOS_SERIE');
            const empresa = movimento.get('MOVIMENTOS_ID_EMPRESAS');

            movimento.getProxy().setExtraParam('log', `PUT /movimentos/reserva/${id} (${numero}|${serie}|${empresa})`);
            SamosUtils.Events.enableWarnReload();
            this.setReadOnly(false);
            this.doDefaultFocus();
            delete this.permiteAlteracao;
        }
    },

    onGravarClick: function(btn, e) { //??
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();

        Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Gravando...');    
                
                Movimento.services.Partidas.finalizar();

                ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento, false);

                movimento.save()
                    .then(() => Ext.Note('success', 'Gravado com sucesso'))
                    .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                    .finally(this.onSairClick.bind(this));
            }
        });

    }

});

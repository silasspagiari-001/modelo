Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.romaneiosmoveisagendamontagemform',

    onAlterarClick: function() {
        const movimento = this.getRecord();

        if(!this.permiteAlteracao && !configs.getUsuario().privilegiado){
            const nivel = 1;

            Ext.create({ xtype: 'samoswidgets-senhanivel' })
                .iniciar(nivel)
                .then(() => {
                    this.permiteAlteracao = true;
                    movimento.getProxy().setExtraParam('senhaNivel', 'true');
                    this.onAlterarClick();
                })
                .catch(() => {/*acao ao sair*/});
        } else {
            const id      = movimento.get('MOVIMENTOS_ID');
            const numero  = movimento.get('MOVIMENTOS_NUMERO');
            const serie   = movimento.get('MOVIMENTOS_SERIE');
            const empresa = movimento.get('MOVIMENTOS_ID_EMPRESAS');

            movimento.getProxy().setExtraParam('log', `PUT /movimentos/montagemmoveis/${id} (${numero}|${serie}|${empresa})`);
            this.getViewModel().set('readOnly', false);
            delete this.permiteAlteracao;
        }
    },

    onGravarClick: function (btn, e) {
        if(this.validarDatasETurnos()){
            Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                if (btn == 'yes') {
                    const movimento = this.getRecord();
                    this.getView().initGauge('Gravando...');

                    movimento.set({
                        'MOVIMENTOSITENS_DATAENTREGA' : momentTz(movimento.get('MOVIMENTOSITENS_DATAENTREGA')).format('YYYY-MM-DD'),
                        'MOVIMENTOSITENS_DATAMONTAGEM': momentTz(movimento.get('MOVIMENTOSITENS_DATAMONTAGEM')).format('YYYY-MM-DD')
                    });
                        
                    movimento.save()
                        .then(record => {
                            Ext.Note('success', 'Gravado com sucesso');
                            setTimeout(() => {
                                this.onSairClick(true);
                            }, 100);
                        })
                        .catch(this.onGravacaoFalha.bind(this))
                        .finally(() => {
                            this.aposGravar.call(this);
                            this.getView().stopGauge();
                            Ext.defer(this.onSairClick, 500, this);
                        });
                }
            });
        }
    },

    validarDatasETurnos: function() {
        const model         = this.getViewModel().get('model');
        const hoje          = momentServer().hours(0).minutes(0).seconds(0);
        const dataEntrega   = momentTz(model.get('MOVIMENTOSITENS_DATAENTREGA')).hours(0).minutes(0).seconds(0);
        const dataMontagem  = momentTz(model.get('MOVIMENTOSITENS_DATAMONTAGEM')).hours(0).minutes(0).seconds(0);
        const turnoEntrega  = model.get('MOVIMENTOSITENS_HORAENTREGA');
        const turnoMontagem = model.get('MOVIMENTOSITENS_HORAMONTAGEM');

        /*
        if(!model.get('MOVIMENTOSITENS_DATAENTREGA')){
            Ext.Note('warning', 'Informe a data de entrega');
            this.lookup('dataentrega').focus(true);
            return false;
        } else if(momentTz(dataEntrega.format()).isBefore(hoje)){
            Ext.Note('warning', 'Data de entrega inválida');
            this.lookup('dataentrega').focus(true);
            return false;
        } else if(!turnoEntrega){
            Ext.Note('warning', 'Informe o turno de entrega');
            this.lookup('turnoentrega').focus(true);
            return false;
        }
        
        if(momentTz(dataEntrega.format()).isSame(hoje)){
            if(
                parseInt(momentServer().format('HH')) >= 12 &&
                parseInt(momentServer().format('HH')) < 18 &&
                turnoEntrega == 'M'
            ) {
                Ext.Note('warning', 'Entrega hoje somente à tarde/noite');
                this.lookup('turnoentrega').focus(true);
                return false;
            } else if(
                parseInt(momentServer().format('HH')) >= 18 &&
                (turnoEntrega == 'M' || turnoEntrega == 'T')
            ){
                Ext.Note('warning', 'Entrega hoje somente à noite');
                this.lookup('turnoentrega').focus(true);
                return false;
            }
        }*/
        
        if(!model.get('MOVIMENTOSITENS_DATAMONTAGEM')){
            Ext.Note('warning', 'Informe a data de montagem');
            this.lookup('datamontagem').focus(true);
            return false;
        } else if(momentTz(dataMontagem.format()).isBefore(dataEntrega.format())){
            Ext.Note('warning', 'Montagem somente após a entrega');
            this.lookup('datamontagem').focus(true);
            return false;
        } else if(!turnoMontagem){
            Ext.Note('warning', 'Informe o turno de montagem');
            this.lookup('turnomontagem').focus(true);
            return false;
        } else if(
            momentTz(dataMontagem.format()).isSame(dataEntrega.format()) &&
            (
                (
                    (turnoEntrega == 'T' || turnoEntrega == 'N') && 
                    turnoMontagem == 'M'
                ) || 
                turnoEntrega == 'N' && turnoMontagem == 'T'
            )
        ){
            Ext.Note('warning', 'Montagem somente após a entrega');
            this.lookup('turnomontagem').focus(true);
            return false;
        } else {
            return true;
        }
    },

    onCancelarClick: function() {
        this.onSairClick();     
    }
});

Ext.define('SamosAdmin.movimentos.movimento.form.mixins.Status', {
    extend: 'SamosModule.form.ViewController',

    onCancelamentoClick: async function(btn, e) {
        const financeiros = this.getRecord().get('MOVIMENTOS_FINANCEIROS') || [];
        const temFinanceiroPago = financeiros.some(titulo => titulo['FINANCEIROS_STATUS'] == 'P');
        const isPedidoVtex = configs.getClientName() == 'hospitalar' &&
                             this.getRecord().get('MOVIMENTOS_PROTOCOLO') &&
                             this.getRecord().get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0002'
                             

        if(temFinanceiroPago) {
            Ext.Note('warning', 'Existem títulos pagos deste movimento!');
            return;
        }

        if(isPedidoVtex) {
            Ext.Note('warning', 'Pedido VTEX - Cancelamento não permitido');
            return;
        }

        if(!configs.getUsuario().privilegiado || configs.getClientName() == 'acomtf') {
            try {
                await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(3);
            } catch(error) {
                Ext.Note('warning', 'Não autorizado');
                return;
            }
        }

        const motivo = await SamosUtils.Msg.prompt('Cancelamento', 'Descreva o motivo do cancelamento:', '', true);//ultimo true: multiline

        if(motivo === false) { return; }//cancelado pelo usuario

        if(!motivo) {
            Ext.Note('warning', 'Descreva o motivo');
            await SamosUtils.Utils.sleep(100);
            this.onCancelamentoClick();
            return;
        }
        
        this.cancelamento((motivo || '').replace(/\n/ig, ' '));
        const btnOpcoes = this.getView().down('button[text="Opções"]');
        
        if(btnOpcoes) {
            btnOpcoes.getEl().dom.style.backgroundColor = '';
            btnOpcoes.getEl().dom.querySelector('.x-btn-inner').style.color = '';
        }
    },

    onReativarClick: function(btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente reativar o movimento?', btn => {
            if (btn == 'yes') {
                this.reativar();
            }
        });
    },

    onLiberarClick: function(btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente liberar o movimento?', btn => {
            if (btn == 'yes') {
                this.liberar();
            }
        });
    },

    onColocarEmSeparacaoClick: function(btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente colocar em separação?', btn => {
            if (btn == 'yes') {
                this.separar();
            }
        });
    },

    onColocarEmConferenciaClick: function(btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente colocar em conferência?', btn => {
            if (btn == 'yes') {
                this.onConferirClick();
                this.conferir();
            }
        });
    },

    cancelamento: async function(motivo) {
        const model = this.getRecord();

        await SamosUtils.Request.nodeApi({
            url: `/processos/movimentos/cancelamento/${model.get('MOVIMENTOS_ID')}`,
            method: 'PUT',
            data: {
                motivo: motivo
            }
        });

        model.set({
            'MOVIMENTOS_STATUS'      : 'C',
            'MOVIMENTOS_ENTRADASAIDA'   : '1899-12-30',
            'MOVIMENTOS_OBSERVACOES'    : `CANCELADO|Motivo: ${motivo}|||||||||`
        });

        Ext.Note('success', 'Cancelado com sucesso');        
    },

    reativar: function() {
        const model = this.getRecord();

        this.getView().initGauge('Reativando...');

        const isPedido = model.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-2) == '02';

        model.set({
            'MOVIMENTOS_STATUS'      : 'N',
            'MOVIMENTOS_CAIXA'       : [],
            'MOVIMENTOS_ENTRADASAIDA': '1899-12-30'
        });

        if(configs.getClientName() == 'racaforte' && isPedido) {
            model.set({
                'MOVIMENTOS_NUMEROORIGEM': 0,
                'MOVIMENTOS_ID_EMPRESAORIGEM': 0,
                'MOVIMENTOS_SERIEORIGEM': ''
            });    
        }

        this.save(model);
    },

    liberar: function() {
        const model = this.getRecord();
        let status = model.get('MOVIMENTOS_STATUS');

        if(status == 'B'){//cancelado em uso
            status = 'C';
        } else if(status == 'M'){//nao faturado em uso
            status = 'N';
        } else if(status == 'E'){//faturado em uso
            status = 'F';
        }

        this.getView().initGauge('Liberando...');

        const data = { 'MOVIMENTOS_STATUS': status };

        model.set(data);

        SamosUtils.Request.nodeApi({
            url: `/movimentos/${model.get('MOVIMENTOS_ID')}`,
            method: 'PUT',
            data: data
        })
        .done(res => {
            this.getView().stopGauge();
            Ext.Note('success', 'Movimento liberado');
        })
        .fail(err => {
            Ext.Note('error', 'Erro no servidor');
            console.error(err);
        });
    },

    separar: async function() {
        const view = this.getView();
        const model = this.getRecord();

        try {
            view.initGauge('Colocando em separação...');

            if(configs.getClientName() == 'hospitalar') {
                const querySeparacao = await SamosUtils.Request.nodeApi({
                    url: `/processos/vtex/colocaremseparacao/${model.get('MOVIMENTOS_ID')}`,//MOVIMENTOS_NFE é o orderId Vtex
                    method: 'PUT',
                    data: {
                        orderIdVtex: model.get('MOVIMENTOS_NFE')
                    }
                });

                if(!querySeparacao.vtex) {
                    Ext.Note('warning', 'Pedido em separação, mas não foi possível atualizar na VTEX', 5000);
                }

                model.set({ 'MOVIMENTOS_STATUS': 'S' });
                this.onConferenciaClick();
            }

            Ext.Note('success', 'Pedido em separação');

        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro ao colocar em separação');
        }

        view.stopGauge();
    },

    conferir: function() {
        const model = this.getRecord();
        let status = 'P';  // Coloca em conferencia
        let situacao = '0' // A conferir

        this.getView().initGauge('Colocando em conferência...');

        const data = { 'MOVIMENTOS_STATUS': status, 'MOVIMENTOS_SITUACAO': situacao };

        model.set(data);

        SamosUtils.Request.nodeApi({
            url: `/movimentos/${model.get('MOVIMENTOS_ID')}`,
            method: 'PUT',
            data: data
        })
        .done(res => {
            this.getView().stopGauge();
            Ext.Note('success', 'Colocado em conferência');
        })
        .fail(err => {
            Ext.Note('error', 'Erro no servidor');
            console.error(err);
        });
    },

    onBaixarClick: async function(btn, e) {

        //Se for um pedido da pruden aço
        if( configs.getClientName() == 'prudenaco' ){
            const queryFormMovimentos = Ext.$('formmovimentos')[0];
            if(queryFormMovimentos.title == 'Pedido'){
                //Se tiver baixas parciais e se o saldo restante for maior que zero, ele nao deixa baixar
                if( 
                    (queryFormMovimentos.model.get('BAIXASPARCIAIS_MOVIMENTO') || []).length > 0 && 
                    Number( SamosUtils.String.onlyNumbers( Ext.$('formmovimentos')[0].lookupReference('subst').getValue() ) ) > 0
                ){
                    Ext.Note('warning', 'Ainda há valor restante!');
                    return;
                }
            }
        }

        const obsBaixado = await SamosUtils.Msg.prompt('Baixar Pedido', 'Observação:');

        if(obsBaixado === false) { return; }//cancelado pelo usuario

        const model = this.getRecord();

        this.getView().initGauge('Baixando...');

        model.data['MOVIMENTOS_ITENS'].forEach(item => {
            item['MOVIMENTOSITENS_ID_OPERACOES'] = 520000;
        });

        if(obsBaixado.length > 0) {
            novaObs = obsBaixado + '|' + model.get('MOVIMENTOS_OBSERVACOES');
            model.set({
                'MOVIMENTOS_OBSERVACOES': novaObs                
            })
        }

        model.set({
            'MOVIMENTOS_STATUS'      : 'X',
            'MOVIMENTOS_SITUACAO'    : '2', // Baixado
            'MOVIMENTOS_LOG'         :  SamosUtils.Info.getLog(),
            'MOVIMENTOS_ENTRADASAIDA': momentServer().format('YYYY-MM-DD'),
            'MOVIMENTOS_ID_OPERACOES': 520000 // Pedido especial
        });

        this.save(model);

        if(this.getListView()) {
            this.getListView( ).getController( ).onBuscarClick();
        }

    },

    onCascoClick: async function(btn, e) {
        const model = this.getRecord();
        const mensagemConfirmacao = model.get('MOVIMENTOS_SITUACAO') == '1' ? 'Confirma devolução do casco?' : 'Estorna a devolução do casco?';

        if( await SamosUtils.Msg.confirm(mensagemConfirmacao) )
        {
            model.set({
                'MOVIMENTOS_SITUACAO'    : model.get('MOVIMENTOS_SITUACAO') == '1' ? '0' : '1',
                'MOVIMENTOS_LOG'         :  SamosUtils.Info.getLog(),
            });

            this.save(model);

            if(this.getListView()) {
                this.getListView().getController().onBuscarClick();
            }

            Ext.Note('success', 'Gravado com sucesso!');
        }

    },

    save: function(model) {
        this.colocarFilhosNoModel(model);
        model.save()
            .then(this.onGravacaoSucesso.bind(this))
            .catch(this.onGravacaoFalha.bind(this))
            .finally(this.aposGravar.bind(this));
    }
});

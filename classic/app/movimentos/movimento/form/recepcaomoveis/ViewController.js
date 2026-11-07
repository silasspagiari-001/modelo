Ext.define('SamosAdmin.movimentos.movimento.form.recepcaomoveis.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentosrecepcaomoveis',

    initViewModel: function(vm) {
        setTimeout(() =>  this.recalculaReceber(), 200);
    },

    validarQtde: function(txt, griditems) {
        const selection = griditems.getSelection();
        
        if(!selection){ return; }

        const produto = selection.getValues();

        const lojaIncompleta =  produto['MOVIMENTOSITENS_ENTREGUE'].toString().slice(-1) == '.' ||
                                produto['MOVIMENTOSITENS_ENTREGUE'].toString().slice(-2) == '.0' ||
                                produto['MOVIMENTOSITENS_ENTREGUE'].toString().slice(-3) == '.00';

        if(lojaIncompleta) { return; } 

        const qtde       = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
        const entregue   = grams(produto['MOVIMENTOSITENS_ENTREGUE']) || 0;
        const aretirar   = qtde - entregue;

        if(aretirar < 0){
            if(entregue + aretirar >= 0) {
                produto['MOVIMENTOSITENS_ENTREGUE'] = (entregue + aretirar) / 1000;
                produto['ITENS_ENTREGAR'] = 0;
            } else {
                produto['MOVIMENTOSITENS_ENTREGUE'] = 0;
                produto['ITENS_ENTREGAR'] = 0;
                Ext.Note('warning', 'Valor maior que o permitido');
            }
        } else if(entregue > qtde) {
            produto['ITENS_ENTREGAR'] = qtde / 1000;
        } else {
            produto['ITENS_ENTREGAR'] = aretirar / 1000;
        }

        selection.setValues(produto);
    },    

    onSelecionarClick: function (btn, event) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const itens = form.lookup('produtos').getStore().data.items;

        const itensAtualizados = itens.map(item => {
            if(item.get('ITENS_DEVOLUCAO') == 'T') {
                item.set('ITENS_DEVOLUCAO', 'F');
            } else {
                item.set('ITENS_DEVOLUCAO', 'T')
            }
            return item.data;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);
    },

    onRecebidoClick: function (btn, event) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const itens = form.lookup('produtos').getStore().data.items;

        const itensAtualizados = itens.map(item => {
            if(item.get('ITENS_DEVOLUCAO') == 'T') {
                item.set('MOVIMENTOSITENS_ENTREGUE',  item.get('MOVIMENTOSITENS_QUANTIDADE'));
                item.set('ITENS_ENTREGAR',  0);
            }
            return item.data;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);

    },

    onPendenteClick: function (btn, event) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const itens = form.lookup('produtos').getStore().data.items;

        const itensAtualizados = itens.map(item => {
            if(item.get('ITENS_DEVOLUCAO') == 'T') {
                item.set('MOVIMENTOSITENS_ENTREGUE',  0);
                item.set('ITENS_ENTREGAR',  item.get('MOVIMENTOSITENS_QUANTIDADE'));
            }
            return item.data;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);

    },

    onConfirmarClick: async function(btn, e) {
        try {
            const form = Ext.$('formmovimentos')[0];
            const itens = form.lookup('produtos').getStore().data.items;
            
            if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
                await Movimento.services.RecepcaoMoveis.alterar(itens);
                Ext.Note('success', 'Recepção atualizada com sucesso!');
                this.onSairClick();
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao atualizar recepção');
        }
        
        this.onSairClick();
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();

        if(Movimento.services.RecepcaoMoveis.validar(movimento)){
            Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', async btn => {
                if (btn == 'yes') {
                    this.getView().initGauge('Gravando...');

                    ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);

                    this.verificarSituação(movimento);

                    movimento.save()
                        .then(ctrlMovimento.onGravacaoSucesso.bind(ctrlMovimento))
                        .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                        .finally(() => {
                            ctrlMovimento.aposGravar.call(ctrlMovimento);
                            ctrlMovimento.setReadOnly.call(this, true);
                            setTimeout(() => this.getView().stopGauge(true), 500);
/* Aqui vai ficar a rotina pra gerar um novo pedido de compra, com o saldo restante, e baixar o pedido atual.
                            if(
                                configs.getMovimentos().autoGerarRomaneio && 
                                configs.getMovimentos().ramoRomaneio == 'construcao'
                            ) { 
                                Movimento.services.EntregaConstrucao.gerarRomaneio(
                                    {
                                        movimento: movimento.get('MOVIMENTOS_ID'),
                                        empresa: configs.getEmpresa().id,
                                        documento: movimento.get('MOVIMENTOS_ID_DOCUMENTOS'),
                                        numero: movimento.get('MOVIMENTOS_NUMERO'),    
                                        serie: movimento.get('MOVIMENTOS_SERIE'),
                                        emissao: movimento.get('MOVIMENTOS_EMISSAO'),
                                        hora: movimento.get('MOVIMENTOS_HORA'),
                                        usuario: movimento.get('MOVIMENTOS_ID_USUARIOS'),
                                        log: SamosUtils.Info.getLog(),
                                        observacoes: movimento.get('MOVIMENTOS_OBSERVACOES'),
                                        pessoa: movimento.get('MOVIMENTOS_ID_PESSOAS'),
                                        itens: movimento.get('MOVIMENTOS_ITENS')
                                    }
                                )
                            } */
                        });
                }
            });
        };
    },

    recalculaReceber: function (btn, event) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const itens = form.lookup('produtos').getStore().data.items;  

        const itensAtualizados = itens.map(item => {
            let qtde             = item.get('MOVIMENTOSITENS_QUANTIDADE');
            let entregueLoja     = item.get('MOVIMENTOSITENS_ENTREGUE');

            if(!this.getRecord().isNew()) {
                item.set('ITENS_ENTREGAR',  (qtde - entregueLoja));
            }

            return item.data;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);

    }

});

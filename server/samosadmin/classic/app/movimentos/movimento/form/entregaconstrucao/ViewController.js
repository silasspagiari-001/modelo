Ext.define('SamosAdmin.movimentos.movimento.form.entregaconstrucao.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentosentregaconstrucao',

    initViewModel: function(vm) {
        setTimeout(() =>  this.recalculaEntregar(), 200);
    },

    validarQtde: function(txt, griditems) {
        const selection = griditems.getSelection();
        
        if(!selection){ return; }

        const produto = selection.getValues();

        const lojaIncompleta =  produto['MOVIMENTOSITENS_ENTREGUE'].toString().slice(-1) == '.' ||
                                produto['MOVIMENTOSITENS_ENTREGUE'].toString().slice(-2) == '.0' ||
                                produto['MOVIMENTOSITENS_ENTREGUE'].toString().slice(-3) == '.00';

        const depositoIncompleto =  produto['MOVIMENTOSITENS_DEPOSITO'].toString().slice(-1) == '.' ||
                                produto['MOVIMENTOSITENS_DEPOSITO'].toString().slice(-2) == '.0' ||
                                produto['MOVIMENTOSITENS_DEPOSITO'].toString().slice(-3) == '.00';

        const imediataIncompleta =  produto['MOVIMENTOSITENS_IMEDIATA'].toString().slice(-1) == '.' ||
                                produto['MOVIMENTOSITENS_IMEDIATA'].toString().slice(-2) == '.0' ||
                                produto['MOVIMENTOSITENS_IMEDIATA'].toString().slice(-3) == '.00';


        if(lojaIncompleta || depositoIncompleto || imediataIncompleta) { return; } 

        const qtde       = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
        const entregue   = grams(produto['MOVIMENTOSITENS_ENTREGUE']) || 0;
        const deposito   = grams(produto['MOVIMENTOSITENS_DEPOSITO']) || 0;
        const imediata   = grams(produto['MOVIMENTOSITENS_IMEDIATA']) || 0;
        const aretirar   = qtde - entregue - deposito - imediata;

        if(aretirar < 0){
            if(entregue + aretirar >= 0) {
                produto['MOVIMENTOSITENS_ENTREGUE'] = (entregue + aretirar) / 1000;
                produto['ITENS_ENTREGAR'] = 0;
            } else {
                produto['MOVIMENTOSITENS_ENTREGUE'] = 0;
                produto['ITENS_ENTREGAR'] = 0;
                produto['MOVIMENTOSITENS_DEPOSITO'] = 0;
                produto['MOVIMENTOSITENS_IMEDIATA'] = 0;
                Ext.Note('warning', 'Valor maior que o permitido');
            }
        } else if(entregue + deposito + imediata > qtde) {
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

    onLojaClick: function (btn, event) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const itens = form.lookup('produtos').getStore().data.items;

        const itensAtualizados = itens.map(item => {
            if(item.get('ITENS_DEVOLUCAO') == 'T') {
                item.set('MOVIMENTOSITENS_ENTREGUE',  item.get('MOVIMENTOSITENS_QUANTIDADE'));
                item.set('MOVIMENTOSITENS_DEPOSITO',  0);
                item.set('MOVIMENTOSITENS_IMEDIATA',  0);
                item.set('ITENS_ENTREGAR',  0);
            }
            return item.data;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);

    },

    onDepositoClick: function (btn, event) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const itens = form.lookup('produtos').getStore().data.items;

        const itensAtualizados = itens.map(item => {
            if(item.get('ITENS_DEVOLUCAO') == 'T') {
                item.set('MOVIMENTOSITENS_ENTREGUE',  0);
                item.set('MOVIMENTOSITENS_DEPOSITO',  item.get('MOVIMENTOSITENS_QUANTIDADE'));
                item.set('MOVIMENTOSITENS_IMEDIATA',  0);
                item.set('ITENS_ENTREGAR',  0);
            }
            return item.data;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);

    },

    onImediataClick: function (btn, event) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const itens = form.lookup('produtos').getStore().data.items;

        const itensAtualizados = itens.map(item => {
            if(item.get('ITENS_DEVOLUCAO') == 'T') {
                item.set('MOVIMENTOSITENS_ENTREGUE',  0);
                item.set('MOVIMENTOSITENS_DEPOSITO',  0);
                item.set('MOVIMENTOSITENS_IMEDIATA',  item.get('MOVIMENTOSITENS_QUANTIDADE'));
                item.set('ITENS_ENTREGAR',  0);
            }
            return item.data;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);

    },

    onRetirarClick: function (btn, event) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const itens = form.lookup('produtos').getStore().data.items;

        const itensAtualizados = itens.map(item => {
            if(item.get('ITENS_DEVOLUCAO') == 'T') {
                item.set('MOVIMENTOSITENS_ENTREGUE',  0);
                item.set('MOVIMENTOSITENS_DEPOSITO',  0);
                item.set('MOVIMENTOSITENS_IMEDIATA',  0);
                item.set('ITENS_ENTREGAR',  item.get('MOVIMENTOSITENS_QUANTIDADE'));
            }
            return item.data;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);

    },

    onConfirmarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();

        if(Movimento.services.EntregaConstrucao.validar(movimento)){
            ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);
            ctrlMovimento.getViewModel().set('entregaValida', true);
            Ext.defer(ctrlMovimento.onFecharClick, 200, ctrlMovimento);
            Ext.defer(this.onSairClick, 500, this);
        };
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();

        if(Movimento.services.EntregaConstrucao.validar(movimento)){
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
                            }
                        });
                }
            });
        };
    },

    recalculaEntregar: function (btn, event) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const itens = form.lookup('produtos').getStore().data.items;  

        const itensAtualizados = itens.map(item => {
            let qtde             = item.get('MOVIMENTOSITENS_QUANTIDADE');
            let entregueLoja     = item.get('MOVIMENTOSITENS_ENTREGUE');
            let entregueDeposito = item.get('MOVIMENTOSITENS_DEPOSITO');
            let entregaImediata  = item.get('MOVIMENTOSITENS_IMEDIATA');

            if(!this.getRecord().isNew()) {
                item.set('ITENS_ENTREGAR',  (qtde - entregueLoja - entregueDeposito - entregaImediata));
            }

            return item.data;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);

    },

});

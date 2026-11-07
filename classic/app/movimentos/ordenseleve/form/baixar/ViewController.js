Ext.define('SamosAdmin.movimentos.ordenseleve.form.baixar.ViewController', {
    extend: 'SamosAdmin.movimentos.ordenseleve.form.ViewController',
    alias: 'controller.formordenselevebaixar',

    init: function(view) {
        setTimeout(() => {
            this.getView().initGauge();
        }, 100);

        setTimeout(async () => {
            const ordemeleve = view.ordemeleve; 

            const titulo = Ext.create('SamosFinanceiros.titulos.Model', {
                'FINANCEIROS_ID_EMPRESAS'  : ordemeleve.get('ORDENS_ID_EMPRESAS'),
                'FINANCEIROS_ID_DOCUMENTOS': ordemeleve.get('ORDENS_ID_DOCUMENTOS'),
                'FINANCEIROS_ID_ORDENS'    : ordemeleve.get('ORDENS_ID'),
                'FINANCEIROS_NUMERO'       : ordemeleve.get('ORDENS_NUMERO'),
                'FINANCEIROS_SERIE'        : ordemeleve.get('ORDENS_SERIE'),
                'FINANCEIROS_ORIGINAL'     : ordemeleve.get('ORDENS_TOTAL'),
                'FINANCEIROS_ID_PESSOAS'   : ordemeleve.get('ORDENS_ID_PESSOAS'),
                'FINANCEIROS_ID_PORTADORES': configs.getOrdens().bxPortadorId,
                'PORTADORES_NOME'          : configs.getOrdens().bxPortadorNome,
                'FINANCEIROS_ID_APLICACOES': ordemeleve.get('DOCUMENTOS_ID_APLICACOES'),
                'APLICACOES_NOME'          : ordemeleve.get('APLICACOES_NOME'),
                'FINANCEIROS_PARCELAS'     : 1,
                'FINANCEIROS_ID_PRAZOS'    : 11,
                'PRAZOS_NOME'              : '14 DDL',
                'PRAZOS_PARCELAS'          : 1,
                'PRAZOS_PARCELAMENTO'      : '14',
                'FINANCEIROS_VENCIMENTO'   : momentServer().format('YYYY-MM-DD'),
                'FINANCEIROS_OBSERVACOES'  : ''
            });
    
            view.getViewModel().set('model', titulo);
            this.getView().stopGauge();
        }, 500);
    },

    onEmissaoChange: function(){

        const vm = this.getViewModel();
        const model = vm.get('model');
        
        const emissao = momentTz(model.get('FINANCEIROS_EMISSAO')).hours(0).minutes(0).seconds(0).format('YYYY-MM-DD');
        const prazo = parseInt(model.get('PRAZOS_PARCELAMENTO'));
        const novoVencimento = momentTz(emissao).add(prazo, 'days').format('YYYY-MM-DD');

        model.set({'FINANCEIROS_VENCIMENTO': novoVencimento});

    },

    onBaixarClick: function (btn, e) {
        const vm = this.getViewModel();
        const ordemeleve = this.getView().ordemeleve;
        const tituloDefault = vm.get('model');
        const valor = cents(tituloDefault.get('FINANCEIROS_ORIGINAL'));
        const qtdeParcelas = tituloDefault.get('PRAZOS_PARCELAS');
        let parcelamento = tituloDefault.get('PRAZOS_PARCELAMENTO') ? tituloDefault.get('PRAZOS_PARCELAMENTO').split('#').filter(n => parseInt(n).toString() != 'NaN') : undefined;
        
        if(!parcelamento) {
            parcelamento = [];
            for (let i = 0; i < qtdeParcelas; i++) {
                parcelamento.push(i * 30);
            }
        }

        const resto = valor % parcelamento.length;

        const dataFinanceiro = parcelamento.map((days, index) => {
            const vcto = this.getViewModel().get('datavcto');
            const original = parseInt(valor / qtdeParcelas) / 100 + (index === 0 ? resto / 100 : 0);

            return Ext.create('SamosFinanceiros.titulos.Model', {
                'FINANCEIROS_ID'           : (index + 1) * -1,
                'FINANCEIROS_ID_EMPRESAS'  : tituloDefault.get('FINANCEIROS_ID_EMPRESAS'),
                'FINANCEIROS_TIPO'         : 'R', 
                'FINANCEIROS_NUMERO'       : tituloDefault.get('FINANCEIROS_NUMERO'),
                'FINANCEIROS_SERIE'        : tituloDefault.get('FINANCEIROS_SERIE'),
                'FINANCEIROS_ID_MOVIMENTOS': tituloDefault.get('FINANCEIROS_ID_MOVIMENTOS'),
                'FINANCEIROS_ID_ORDENS'    : tituloDefault.get('FINANCEIROS_ID_ORDENS'),
                'FINANCEIROS_ID_DOCUMENTOS': tituloDefault.get('FINANCEIROS_ID_DOCUMENTOS'), 
                'FINANCEIROS_ID_PESSOAS'   : tituloDefault.get('FINANCEIROS_ID_PESSOAS'),
                'FINANCEIROS_ID_USUARIOS'  : configs.getUsuario().id,
                'FINANCEIROS_ID_PORTADORES': tituloDefault.get('FINANCEIROS_ID_PORTADORES'),
                'FINANCEIROS_ID_APLICACOES': tituloDefault.get('FINANCEIROS_ID_APLICACOES') || 1,
                'FINANCEIROS_ID_PRAZOS'    : tituloDefault.get('FINANCEIROS_ID_PRAZOS'),
                'FINANCEIROS_PARCELAS'     : tituloDefault.get('PRAZOS_PARCELAS'),
                'FINANCEIROS_OBSERVACOES'  : tituloDefault.get('FINANCEIROS_OBSERVACOES'),
                'FINANCEIROS_PARCELA'      : index + 1,
                'FINANCEIROS_EMISSAO'      : tituloDefault.get('FINANCEIROS_EMISSAO'),
                'FINANCEIROS_VENCIMENTO'   : tituloDefault.get('FINANCEIROS_VENCIMENTO'),
                'FINANCEIROS_TOTAL'        : valor / 100,
                'FINANCEIROS_ORIGINAL'     : original,
                'FINANCEIROS_BAIXA'        : '1899-12-30',
                'FINANCEIROS_PAGAMENTO'    : '1899-12-30',
                'FINANCEIROS_ABERTO'       : original,
                'FINANCEIROS_PAGO'         : 0,
                'FINANCEIROS_STATUS'       : 'A'
            });
        });

        const valorParcela = parseInt(valor / qtdeParcelas) / 100;

        Ext.Msg.confirm(
            'Confirmação',
            `Deseja realmente gerar ${qtdeParcelas} parcela(s) de ${Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(valorParcela)}?`,
            async confirm => {
                if (confirm == 'yes') {
                    this.getView().initGauge();
                    let idPrimeiroTitulo;
                    
                    Financeiro.services.Lote.incluir(dataFinanceiro)
                        .then(res => {
                            idPrimeiroTitulo = res.results[0]['FINANCEIROS_ID'];

                            ordemeleve.set({
                                'ORDENS_LOG': SamosUtils.Info.getLog(),
                                'ORDENS_STATUS': 'F'
                            });

                            return ordemeleve.save();
                        })
                        .then(() => {
                            return SamosUtils.Request.nodeApi({
                                url: `/relatorios/${configs.getClientName()}/reciboordemeleve`,
                                method: 'GET',
                                query: {
                                    id: idPrimeiroTitulo
                                }
                            })
                            .done(res => {
                                this.onSairClick();

                                setTimeout(() => {
                                    SamosUtils.Pdf.exibir({
                                        local: 'window',
                                        caminho: res.results[0]['name'], 
                                        serverType: 'nodejs'
                                    });
                                    setTimeout(() => {
                                        Ext.Note('success', 'Título(s) gerado(s) com sucesso');
                                    }, 100);
                                }, 300);
                            })
                            .fail(err => {
                                Ext.Note('error', 'Erro no servidor');
                                console.error(err);
                            })
                            .always(() => this.getView().stopGauge());
                        })
                        .then(this.onGravacaoSucesso.bind(this))
                        .catch(this.onGravacaoFalha.bind(this))
                        .finally(() => {
                            this.onSairClick();
                            this.aposGravar()
                        });
                }
            }
        );
    }
});

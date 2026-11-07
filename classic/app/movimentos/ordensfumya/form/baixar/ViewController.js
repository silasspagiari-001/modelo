Ext.define('SamosAdmin.movimentos.ordensfumya.form.baixar.ViewController', {
    extend: 'SamosAdmin.movimentos.ordensfumya.form.ViewController',
    alias: 'controller.formordensfumyabaixar',

    init: function(view) {
        setTimeout(() => {
            this.getView().initGauge();
        }, 100);

        setTimeout(async () => {
            const ordem = view.ordem; 
            const idEmpresa = configs.getEmpresa().id;
            const documento = await Documento.services.Model.get('Pagar', idEmpresa);
            const title = this.getView().up('formordensfumya').listName;

            const titulo = Ext.create('SamosFinanceiros.titulos.Model', {
                'FINANCEIROS_ID_MOVIMENTOS': ordem.get('ORDENS_ID'),
                'FINANCEIROS_ORIGINAL'     : ordem.get('ORDENS_TOTAL'),
                'FINANCEIROS_ID_PESSOAS'   : ordem.get('ORDENS_ID_USUARIOS'),
                'FINANCEIROS_ID_PORTADORES': ordem.get('ORDENS_ID_EMPRESAS'),
                'PORTADORES_NOME'          : 'CARTEIRA',
                'FINANCEIROS_ID_APLICACOES': ordem.get('DOCUMENTOS_ID_APLICACOES'),
                'APLICACOES_NOME'          : ordem.get('APLICACOES_NOME'),
                'FINANCEIROS_PARCELAS'     : 1,
                'FINANCEIROS_ID_PRAZOS'    : 45,
                'PRAZOS_NOME'              : '7 DDL',
                'PRAZOS_PARCELAS'          : 1,
                'PRAZOS_PARCELAMENTO'      : '7',
                'FINANCEIROS_VENCIMENTO'   : momentServer().format('YYYY-MM-DD'),
                'FINANCEIROS_OBSERVACOES'  : title + ' - ' + SamosUtils.String.completeChars(ordem.get('ORDENS_NUMERO'), 6) + ' da filial ' + ordem.get('ORDENS_ID_EMPRESAS')
            });
    
            await Financeiro.services.Model.atribuirDocumento(documento, titulo);
            view.getViewModel().set('model', titulo);
            this.getView().stopGauge();
        }, 500);
    },

    onBaixarClick: function (btn, e) {
        const vm = this.getViewModel();
        const ordem = this.getView().ordem;
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
            const vcto = momentServer().add(days, 'days');
            const original = parseInt(valor / qtdeParcelas) / 100 + (index === 0 ? resto / 100 : 0);

            return Ext.create('SamosFinanceiros.titulos.Model', {
                'FINANCEIROS_ID'           : (index + 1) * -1,
                'FINANCEIROS_TIPO'         : 'P', 
                'FINANCEIROS_ID_MOVIMENTOS': tituloDefault.get('FINANCEIROS_ID_MOVIMENTOS'), 
                'FINANCEIROS_ID_DOCUMENTOS': tituloDefault.get('FINANCEIROS_ID_DOCUMENTOS'), 
                'FINANCEIROS_ID_PESSOAS'   : tituloDefault.get('FINANCEIROS_ID_PESSOAS'),
                'FINANCEIROS_ID_USUARIOS'  : configs.getUsuario().id,
                'FINANCEIROS_ID_PORTADORES': tituloDefault.get('FINANCEIROS_ID_PORTADORES'),
                'FINANCEIROS_ID_APLICACOES': tituloDefault.get('FINANCEIROS_ID_APLICACOES') || 1,
                'FINANCEIROS_ID_PRAZOS'    : tituloDefault.get('FINANCEIROS_ID_PRAZOS'),
                'FINANCEIROS_PARCELAS'     : tituloDefault.get('PRAZOS_PARCELAS'),
                'FINANCEIROS_OBSERVACOES'  : tituloDefault.get('FINANCEIROS_OBSERVACOES'),
                'FINANCEIROS_PARCELA'      : index + 1,
                'FINANCEIROS_VENCIMENTO'   : vcto.format('YYYY-MM-DD'),
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

                            ordem.set({
                                'ORDENS_LOG': SamosUtils.Info.getLog(),
                                'ORDENS_STATUS': 'F'
                            });

                            return ordem.save();
                        })
                        .then(() => {
                            return SamosUtils.Request.nodeApi({
                                url: `/relatorios/${configs.getClientName()}/reciboromaneio`,
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

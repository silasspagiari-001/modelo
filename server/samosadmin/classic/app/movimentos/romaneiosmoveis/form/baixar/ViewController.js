Ext.define('SamosAdmin.movimentos.romaneiosmoveis.form.baixar.ViewController', {
    extend: 'SamosAdmin.movimentos.romaneiosmoveis.form.ViewController',
    alias: 'controller.formromaneiosmoveisbaixar',

    init: function(view) {
        setTimeout(() => {
            this.getView().initGauge();
        }, 100);

        setTimeout(async () => {
            const romaneio = view.romaneio;
            const idEmpresa = configs.getEmpresa().id;
            const title = this.getView().up('formromaneiosmoveis').listName;
            const isEntrega = title.match(/Entrega/);
            const isLocal = romaneio.get('ROMANEIOS_LOCAL') == 'U';
            const idAplicacao = (!isEntrega ? 558 : (isLocal ? 561 : 562));

            const titulo = Ext.create('SamosFinanceiros.titulos.Model', {
                'FINANCEIROS_ID_DOCUMENTOS': romaneio.get('ROMANEIOS_ID_EMPRESAS') + '0009',
                'FINANCEIROS_TIPO'         : 'P',
                'FINANCEIROS_ID_MOVIMENTOS': romaneio.get('ROMANEIOS_ID'),
                'FINANCEIROS_NUMERO'       : romaneio.get('ROMANEIOS_NUMERO'),
                'FINANCEIROS_SERIE'        : romaneio.get('ROMANEIOS_SERIE'),
                'FINANCEIROS_ORIGINAL'     : romaneio.get('ROMANEIOS_FRETE'),
                'FINANCEIROS_ID_PESSOAS'   : romaneio.get('ROMANEIOS_ID_PESSOAS'),
                'FINANCEIROS_ID_PORTADORES': 1,
                'PORTADORES_NOME'          : 'CARTEIRA',
                'FINANCEIROS_ID_APLICACOES': idAplicacao,
                'APLICACOES_NOME'          : !isEntrega ? 'MONTAGEM AUTONOMA' : isLocal ? 'ENTREGAS LOCAIS' : 'ENTREGAS REGIÕES',
                'FINANCEIROS_PARCELAS'     : 1,
                'FINANCEIROS_ID_PRAZOS'    : 55,
                'PRAZOS_NOME'              : '1 DDL',
                'PRAZOS_PARCELAS'          : 1,
                'PRAZOS_PARCELAMENTO'      : '1',
                'FINANCEIROS_VENCIMENTO'   : momentServer().add(1, 'days').format('YYYY-MM-DD'),
                'FINANCEIROS_BOLETO'       : momentServer().format('MMYYYY'),
                'FINANCEIROS_OBSERVACOES'  : title + ' - ' + SamosUtils.String.completeChars(romaneio.get('ROMANEIOS_NUMERO'), 6) + ' da filial ' + romaneio.get('ROMANEIOS_ID_EMPRESAS')
            });
    
            view.getViewModel().set('model', titulo);
            this.getView().stopGauge();
        }, 500);
    },

    onBaixarClick: function (btn, e) {
        const vm = this.getViewModel();
        const romaneio = this.getView().romaneio;
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
                'FINANCEIROS_NUMERO'       : tituloDefault.get('FINANCEIROS_NUMERO'),
                'FINANCEIROS_SERIE'        : tituloDefault.get('FINANCEIROS_SERIE'),
                'FINANCEIROS_ID_PESSOAS'   : tituloDefault.get('FINANCEIROS_ID_PESSOAS'),
                'FINANCEIROS_ID_USUARIOS'  : configs.getUsuario().id,
                'FINANCEIROS_ID_PORTADORES': tituloDefault.get('FINANCEIROS_ID_PORTADORES'),
                'FINANCEIROS_ID_APLICACOES': tituloDefault.get('FINANCEIROS_ID_APLICACOES'),
                'FINANCEIROS_ID_PRAZOS'    : tituloDefault.get('FINANCEIROS_ID_PRAZOS'),
                'FINANCEIROS_PARCELAS'     : tituloDefault.get('PRAZOS_PARCELAS'),
                'FINANCEIROS_OBSERVACOES'  : tituloDefault.get('FINANCEIROS_OBSERVACOES'),
                'FINANCEIROS_BOLETO'       : tituloDefault.get('FINANCEIROS_BOLETO'),
                'FINANCEIROS_PARCELA'      : index + 1,
                'FINANCEIROS_VENCIMENTO'   : qtdeParcelas == 1 ? tituloDefault.get('FINANCEIROS_VENCIMENTO') : vcto.format('YYYY-MM-DD'),
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

                            romaneio.set({
                                'ROMANEIOS_SAIDA': momentServer().format('YYYY-MM-DD'),
                                'ROMANEIOS_LOG': SamosUtils.Info.getLog(),
                                'ROMANEIOS_STATUS': 'F'
                            });

                            return romaneio.save();
                        })
                        .then(() => {
                            return SamosUtils.Request.nodeApi({
                                url: `/relatorios/${configs.getClientName()}/reciboromaneiomoveis`,
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
    },

    atualizarVencimento: function() {

        const prazo = parseInt(this.getViewModel().get('model.PRAZOS_PARCELAMENTO').split('#')[0]);
        const vencimento = momentServer().add(prazo, 'days').format('YYYY-MM-DD');
        const vctlabel = momentTz(vencimento).format('DD/MM/YYYY');
        this.getViewModel().set('model.FINANCEIROS_VENCIMENTO', vencimento);
        this.lookup('vencimento').setValue(vctlabel);
    },

});

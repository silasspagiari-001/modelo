Ext.define('SamosAdmin.movimentos.romaneiosindustria.list.baixa.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.romaneiosindustriabaixaform',

    init: function(view) {
        setTimeout(() => {
            this.getView().initGauge();
        }, 100);

        setTimeout(async () => {
            const romaneios = view.romaneios;
            const idEmpresa = configs.getEmpresa().id;
            const documento = await Documento.services.Model.get('Pagar', idEmpresa);
            const title = Ext.$('tabpanel#contentPanel')[0].getActiveTab().title;
            const isEntrega = title.match(/Entrega/);
            const idRomaneio = romaneios.length > 0 ? 0 : romaneios[0].get('ROMANEIOS_ID');
            const valorTotal = romaneios.reduce((total, romaneio) => {
                return total += cents(romaneio.get('ROMANEIOS_FRETE'));
            }, 0) / 100;

            const titulo = Ext.create('SamosFinanceiros.titulos.Model', {
                'FINANCEIROS_ID_MOVIMENTOS': idRomaneio,
                'FINANCEIROS_ORIGINAL'     : valorTotal,
                'FINANCEIROS_ID_PESSOAS'   : romaneios[0].get('ROMANEIOS_ID_PESSOAS'),
                'FINANCEIROS_ID_PORTADORES': 1,
                'PORTADORES_NOME'          : 'CARTEIRA',
                'FINANCEIROS_ID_APLICACOES': isEntrega ? 561 : 558,
                'APLICACOES_NOME'          : isEntrega ? 'ENTREGAS LOCAIS' : 'MONTAGEM AUTONOMA',
                'FINANCEIROS_PARCELAS'     : 1,
                'FINANCEIROS_ID_PRAZOS'    : 1,
                'PRAZOS_NOME'              : 'VENDA A VISTA',
                'PRAZOS_PARCELAS'          : 1,
                'PRAZOS_PARCELAMENTO'      : '0',
                'FINANCEIROS_VENCIMENTO'   : momentServer().format('YYYY-MM-DD'),
                'FINANCEIROS_OBSERVACOES'  : romaneios.reduce((obs, romaneio) => {
                    const numero = SamosUtils.String.completeChars(romaneio.get('ROMANEIOS_NUMERO'), 6);
                    return obs += numero + ' da filial ' + romaneio.get('ROMANEIOS_ID_EMPRESAS') + ' / '
                }, title + ' - ').slice(0, -3)
            });
    
            await Financeiro.services.Model.atribuirDocumento(documento, titulo);
            view.getViewModel().set('model', titulo);
            this.getView().stopGauge();
        }, 500);
    },

    onBaixarClick: async function (btn, e) {
        const view = this.getView();

        try {
            const vm            = this.getViewModel();
            const romaneios     = view.romaneios;
            const tituloDefault = vm.get('model');
            const valor         = cents(tituloDefault.get('FINANCEIROS_ORIGINAL'));
            const qtdeParcelas  = tituloDefault.get('PRAZOS_PARCELAS');
            
            let parcelamento    = tituloDefault.get('PRAZOS_PARCELAMENTO') ? tituloDefault.get('PRAZOS_PARCELAMENTO').split('#').filter(n => parseInt(n).toString() != 'NaN') : undefined;
            
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

            if(await SamosUtils.Msg.confirm(`Deseja realmente gerar ${qtdeParcelas} parcela(s) de ${Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(valorParcela)}?`)) {
                view.initGauge();

                const financeiros = await Financeiro.services.Lote.incluir(dataFinanceiro);
                const idPrimeiroTitulo = financeiros.results[0]['FINANCEIROS_ID'];
                
                //atualiza romaneios (faturados)
                await SamosUtils.Request.nodeApi({
                    url: `/processos/romaneiosindustria/faturar`,
                    method: 'POST',
                    data: romaneios.map(romaneio => {
                        return {
                            'ROMANEIOS_ID': romaneio.get('ROMANEIOS_ID')
                        }
                    })
                });

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/reciboromaneioindustria`,
                    method: 'GET',
                    query: { id: idPrimeiroTitulo }
                });

                Ext.$('romaneiosindustriabaixa')[0].getController().onSairClick();
                Ext.$('romaneiosindustria')[0].getController().onBuscarClick();

                await SamosUtils.Utils.sleep(300);

                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });

                await SamosUtils.Utils.sleep(100);

                Ext.Note('success', 'Título(s) gerado(s) com sucesso');

                this.onSairClick();
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao baixar romaneios');
        }

        view.stopGauge();
    }
});

Ext.define('SamosAdmin.movimentos.caixa.fechar.ViewController', {
    extend: 'SamosFinanceiros.titulos.form.ViewController',
    alias: 'controller.formcaixafechar',

    onFecharClick: async function (btn, e) {
        const view = this.getView();

        try {
            await Caixa.services.Fechamento.validar();

            if(cents(this.lookup('conta').getValue()) <= 0) {
                throw 'Conta não informada - não permitido';
            }

            const form = Ext.$('caixa')[0];

            if(await SamosUtils.Msg.confirm('Deseja realmente fechar o caixa?')) {
                view.initGauge();   

                await SamosUtils.Request.nodeApi({
                    url: `/caixa/lote`,
                    method: 'PUT',
                    query: {
                        log: 'FECHAMENTO DE CAIXA: PUT /caixa/lote'
                    },
                    data: {
                        acao       : 'fechar',
                        empresa    : configs.getEmpresa().id,
                        portador   : this.lookup('conta').getValue(),                            
                        emissao    : momentTz(form.getViewModel().get('valueEmissao')).format('DD/MM/YYYY'),
                        dinheiro   : cents(this.lookup('valordinheiro').getValue()),
                        cheque     : cents(this.lookup('valorcheque').getValue()),
                        credito    : cents(this.lookup('valorcredito').getValue()),
                        debito     : cents(this.lookup('valordebito').getValue()),
                        creditoloja: cents(this.lookup('valorcreditoloja').getValue()),
                        alimentacao: cents(this.lookup('valoralimentacao').getValue()),
                        refeicao   : cents(this.lookup('valorrefeicao').getValue()),
                        presente   : cents(this.lookup('valorpresente').getValue()),
                        combustivel: cents(this.lookup('valorcombustivel').getValue()),
                        duplicata  : cents(this.lookup('valorduplicata').getValue()),
                        transf     : cents(this.lookup('valortransf').getValue()),
                        outro      : cents(this.lookup('valoroutro').getValue()),
                        saldodin   : cents(form.getViewModel().get('saldoDinheiro')),
                        saldoche   : cents(form.getViewModel().get('saldoCheque')),
                        usuario    : configs.getUsuario().id,
                        log        : SamosUtils.Info.getLog(),
                        transferirSaldoCaixa: configs.getFinanceiros().transferirSaldoCaixa
                    }
                });

                if(cents(this.lookup('valordinheiro').getValue()) > 0) {
                    await SamosUtils.Request.nodeApi({
                        url: `/deposito`,
                        method: 'POST',
                        data: {
                            portador  : this.lookup('conta').getValue(),
                            aplicacao : 999,
                            status    : 'T',
                            documento : 'FECHAMENTO CX',
                            valor     :  ((cents(this.lookup('valordinheiro').getValue())) / 100),
                            tipo      :  'E',
                            emissao   :  momentServer().format('YYYY-MM-DD'),
                            vencimento:  momentServer().format('YYYY-MM-DD'),
                            nome      : 'SALDO FECHAMENTO DO CAIXA (DINHEIRO) - DEPOSITADO',
                            log       :  SamosUtils.Info.getLog()
                        }
                    });
                }

                if(cents(this.lookup('valorcheque').getValue()) > 0) {
                    await SamosUtils.Request.nodeApi({
                        url: `/deposito`,
                        method: 'POST',
                        data: {
                            portador  : this.lookup('conta').getValue(),
                            aplicacao : 999,
                            status    : 'T',
                            documento : 'FECHAMENTO CX',
                            valor     :  (cents(this.lookup('valorcheque').getValue()) / 100),
                            tipo      :   'E',
                            emissao   :  momentServer().format('YYYY-MM-DD'),
                            vencimento: momentServer().format('YYYY-MM-DD'),
                            nome      : 'SALDO FECHAMENTO DO CAIXA (CHEQUES) - DEPOSITADO',
                            log       : SamosUtils.Info.getLog()
                        }
                    });
                }
                
                Ext.Note('success', 'Caixa fechado com sucesso!');
                setTimeout(() => form.getController().onBuscarClick(), 500);
                this.onSairClick();
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível fechar o caixa');
            view.stopGauge();   
        }
    },

    onSairClick: function (btn, e) {
        if(this.getListView()) {
            this.getListView().getController( ).onBuscarClick();
        }
        this.getView().destroy();
    }
});

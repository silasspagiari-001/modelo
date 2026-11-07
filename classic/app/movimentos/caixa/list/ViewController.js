Ext.define('SamosAdmin.movimentos.caixa.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.caixa',

    initViewModel: function(vm) {
        setTimeout(() =>  this.onBuscarClick(), 200);
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa: configs.getEmpresa().id,
            emissao: momentTz(this.lookup('emissao').getValue()).format('DD/MM/YYYY'),
            status : vm.get('valueStatus'),
            incluirDuplicata: configs.getFinanceiros().exibirDuplicataNoCaixa !== false
        };
    },

    aposBuscar: function(records) {
        const vm = this.getViewModel();

        if(records.length && records.every(record => record.get('MOVIMENTOSCAIXA_STATUS') == 'F')){
            vm.set('statusCaixa', 'fechado');
        } else if(records.length){
            vm.set('statusCaixa', 'aberto');
        } else {
            vm.set('statusCaixa', 'vazio');
        }
    },

    onAbrirClick: async function() {
        const view = this.getView();

        try {
            view.initGauge('Verificando caixas abertos...');
            const ultimocaixaaberto = await Caixa.services.Model.getUltimoCaixaAberto();
            view.stopGauge(true);
    
            if(ultimocaixaaberto) {
                const data    = momentTz(ultimocaixaaberto['MOVIMENTOSCAIXA_EMISSAO']).format('DD/MM/YYYY');
                const empresa = ultimocaixaaberto['MOVIMENTOSCAIXA_ID_EMPRESAS'];
    
                throw `Caixa do dia ${data} da empresa ${empresa} aberto!`;
            }
            
            const form = await this.onNovoClick();
            const stat = this.getViewModel().get('statusCaixa');
            
            const saldoAbertura = configs.getClientName() == 'prudenmoveis' && 
                                 (stat == 'vazio' && configs.getEmpresa().id != 1) ? 100 : 0;

            form.getViewModel().get('model').set({
                'APLICACOES_NOME'              : 'CAIXA',
                'MOVIMENTOSCAIXA_ID_APLICACOES': 1,
                'MOVIMENTOSCAIXA_ID_PESSOAS'   : configs.getEmpresa().id,
                'MOVIMENTOSCAIXA_NOME'         : 'ABERTURA ' + SamosUtils.Info.getLog(),
                'MOVIMENTOSCAIXA_STATUS'       : 'A',
                'MOVIMENTOSCAIXA_EXPORTADO'    : 'X',
                'MOVIMENTOSCAIXA_DINHEIRO'     : saldoAbertura,
                'PESSOAS_NOME'                 : configs.getEmpresa().nome,
                'ABERTURA_CAIXA'               : 'T'
            });
            
            form.applyTextSearches();

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao abrir caixa');
        }

        view.stopGauge();
    },

    onFecharClick: async function(btn, e) {

        const view = this.getView();

        try {

            view.initGauge('Verificando Pedidos...');

            await SamosUtils.Utils.sleep(200);
    
            const data = this.getViewModel().getStore('main').getData().items[0].get('MOVIMENTOSCAIXA_EMISSAO');
            const pedidosAbertos = await Caixa.services.Model.getPedidosAbertosPorData(data);

            view.stopGauge();
            
            if(pedidosAbertos){
                throw 'Há pedidos sem faturar ou aprovar na data de ' + momentTz(data).format('DD/MM/YYYY');
            }
            
            const formCaixa = Ext.create({ 
                xtype: 'formcaixafechar'
            });

            view.add(formCaixa);
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao fechar');
        }

        view.stopGauge();
    },    

    onSangriaClick: function(btn, e) {
        const view = Ext.create({ 
            xtype: 'formcaixasangria'
        });
        
        this.getView().add(view);
    },    

    onImprimirClick: async function () {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/caixa`,
                    method: 'GET',
                    query: {
                        empresa         : configs.getEmpresa().id,
                        empresacnpj     : configs.getEmpresa().cnpj,
                        emissao         : momentTz(this.lookup('emissao').getValue()).format('DD/MM/YYYY'),
                        status          : 2,
                        incluirDuplicata: configs.getFinanceiros().exibirDuplicataNoCaixa !== false
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    afterLoadMainStore: function(store, records, success, operation) {
        const lastModel = records[records.length -1];
        const totalDinheiro           = lastModel ? lastModel.get('SALDOS_DINHEIRO') : 0;
        const totalDinheiroFormatado  = Ext.util.Format.MoneyMask.setMask('#999.990,00').mask(totalDinheiro);
        const totalCheque             = lastModel ? lastModel.get('SALDOS_CHEQUE') : 0;
        const totalChequeFormatado    = Ext.util.Format.MoneyMask.setMask('#999.990,00').mask(totalCheque);
        const totalCredito            = lastModel ? lastModel.get('SALDOS_CREDITO') : 0;
        const totalCreditoFormatado   = Ext.util.Format.MoneyMask.setMask('#999.990,00').mask(totalCredito);
        const totalDebito             = lastModel ? lastModel.get('SALDOS_DEBITO') : 0;
        const totalDebitoFormatado    = Ext.util.Format.MoneyMask.setMask('#999.990,00').mask(totalDebito);
        const totalDuplicata          = lastModel ? lastModel.get('SALDOS_DUPLICATA') : 0;
        const totalDuplicataFormatado = Ext.util.Format.MoneyMask.setMask('#999.990,00').mask(totalDuplicata);
        const totalTransf             = lastModel ? lastModel.get('SALDOS_TRANSFERENCIA') : 0;
        const totalTransfFormatado    = Ext.util.Format.MoneyMask.setMask('#999.990,00').mask(totalTransf);
        const totalOutro              = lastModel ? lastModel.get('SALDOS_OUTRO')          : 0;
        const totalOutroFormatado     = Ext.util.Format.MoneyMask.setMask('#999.990,00').mask(totalOutro);

        const saldoGeral              = lastModel ? lastModel.get('MOVIMENTOSCAIXA_SALDO') : 0;
        const saldoGeralFormatado     = Ext.util.Format.MoneyMask.setMask('#999.990,00').mask(saldoGeral);

        const totalCreditoloja        = lastModel ? lastModel.get('SALDOS_CREDITOLOJA')    : 0;
        const totalAlimentacao        = lastModel ? lastModel.get('SALDOS_ALIMENTACAO')    : 0;
        const totalRefeicao           = lastModel ? lastModel.get('SALDOS_REFEICAO')       : 0;
        const totalPresente           = lastModel ? lastModel.get('SALDOS_PRESENTE')       : 0;
        const totalCombustivel        = lastModel ? lastModel.get('SALDOS_COMBUSTIVEL')    : 0;

        const fundoCaixa = configs.getClientName() == 'prudenmoveis' && configs.getEmpresa().id != 1 ? 100 : 0;

        this.getViewModel().set('saldoDinheiro',    (cents(totalDinheiro) - cents(fundoCaixa))/100);
        this.getViewModel().set('saldoCheque',      totalCheque);
        this.getViewModel().set('saldoCredito',     totalCredito);
        this.getViewModel().set('saldoDebito',      totalDebito);
        this.getViewModel().set('saldoCreditoloja', totalCreditoloja);
        this.getViewModel().set('saldoAlimentacao', totalAlimentacao);
        this.getViewModel().set('saldoRefeicao',    totalRefeicao);
        this.getViewModel().set('saldoPresente',    totalPresente);
        this.getViewModel().set('saldoCombustivel', totalCombustivel);
        this.getViewModel().set('saldoDuplicata',   totalDuplicata);
        this.getViewModel().set('saldoTransf',      totalTransf);
        this.getViewModel().set('saldoOutro',       totalOutro);

        this.getViewModel().set('totalDinheiro',  totalDinheiroFormatado);
        this.getViewModel().set('totalCheque',    totalChequeFormatado);
        this.getViewModel().set('totalCredito',   totalCreditoFormatado);
        this.getViewModel().set('totalDebito',    totalDebitoFormatado);
        this.getViewModel().set('totalTransf',    totalTransfFormatado);        
        this.getViewModel().set('totalDuplicata', totalDuplicataFormatado);
        this.getViewModel().set('totalOutro',     totalOutroFormatado);
        this.getViewModel().set('saldoGeral',     saldoGeralFormatado);
    }
});

Ext.define('SamosAdmin.movimentos.caixa.services.Model', {
    alternateClassName: 'Caixa.services.Model',
    singleton: true,

    get: function() {
        const form = Ext.$('formcaixa')[0];
        const caixa = form.getViewModel().get('model');
        
        const valorCaixa = caixa.get('MOVIMENTOSCAIXA_CREDITO')     + // antes era um Array com os pagamentos..
                           caixa.get('MOVIMENTOSCAIXA_DEBITO')      +
                           caixa.get('MOVIMENTOSCAIXA_CREDITOLOJA') +
                           caixa.get('MOVIMENTOSCAIXA_REFEICAO')    +
                           caixa.get('MOVIMENTOSCAIXA_PRESENTE')    +
                           caixa.get('MOVIMENTOSCAIXA_COMBUSTIVEL');

        if(
            (form && form.isVisible(true)) ||
            (valorCaixa && valorCaixa > 0)
        ){
            return valorCaixa;
        } else {
            return 0;
        }
    },

    validar: function() {
        const formCaixa = Ext.$('formcaixa')[0];
        const caixa = formCaixa.getViewModel().get('model');
        const isAbertura = caixa.get('MOVIMENTOSCAIXA_NOME').toUpperCase().match(/ABERTURA/);
        const totalLancamentos = caixa.get('MOVIMENTOSCAIXA_DINHEIRO') +
                                 caixa.get('MOVIMENTOSCAIXA_CHEQUE') +
                                 caixa.get('MOVIMENTOSCAIXA_CREDITO') +
                                 caixa.get('MOVIMENTOSCAIXA_DEBITO') +
                                 caixa.get('MOVIMENTOSCAIXA_CREDITOLOJA') +
                                 caixa.get('MOVIMENTOSCAIXA_CREDITOPESSOA') +
                                 caixa.get('MOVIMENTOSCAIXA_ALIMENTACAO') +
                                 caixa.get('MOVIMENTOSCAIXA_REFEICAO') +
                                 caixa.get('MOVIMENTOSCAIXA_PRESENTE') +
                                 caixa.get('MOVIMENTOSCAIXA_COMBUSTIVEL') +
                                 caixa.get('MOVIMENTOSCAIXA_DUPLICATA') +
                                 caixa.get('MOVIMENTOSCAIXA_BOLETO') +
                                 caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS') +
                                 caixa.get('MOVIMENTOSCAIXA_OUTRO') -                            
                                 caixa.get('MOVIMENTOSCAIXA_TROCO');

        return (totalLancamentos > 0) || isAbertura;
    },

    getStatus: async function(data) {
        const queryStatus = await SamosUtils.Request.nodeApi({
            url: `/caixa`,
            method: 'GET',
            data: {
                empresa: configs.getEmpresa().id,
                emissao: momentTz(data).format('DD/MM/YYYY'),
                incluirDuplicata: configs.getFinanceiros().exibirDuplicataNoCaixa !== false,
                status: 2,
                start: 0,
                limit: 9999999
            }
        });

        if(queryStatus.results.length && queryStatus.results.every(record => record['MOVIMENTOSCAIXA_STATUS'] == 'F')){
            return 'F';
        } else if(queryStatus.results.length){
            return 'A';
        }
    },

    getUltimoCaixaAberto: async function() {
        const queryCaixaAberto = await SamosUtils.Request.nodeApi({
            url: `/consultas/ultimocaixaaberto`,
            method: 'GET',
            data: {
                empresa: configs.getEmpresa().id,
            }                
        });

        if(queryCaixaAberto.results.length){
            return queryCaixaAberto.results[0];
        } else {
            return false;
        }
    },

    getPedidosAbertosPorData: async function(data) {
        const queryPedidosAbertos = await SamosUtils.Request.nodeApi({
            url: `/consultas/pedidosabertospordata`,
            method: 'GET',
            data: {
                empresa: configs.getEmpresa().id,
                emissao: momentTz(data).format('DD/MM/YYYY')
            }
        });

        if(queryPedidosAbertos.results.length){
            return queryPedidosAbertos.results;
        } else {
            return false;
        }
    }
});

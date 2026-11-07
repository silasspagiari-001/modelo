Ext.define('SamosAdmin.movimentos.movimento.services.Divergencias', {
    alternateClassName: 'Movimento.services.Divergencias',
    singleton: true,

    validar: function(form){

        if(!form.getViewModel().get('isNotaEntrada')){ return true; }

        const simplesNacional = (configs.getPermissao()['EMPRESAS_SIMPLES'] == 'T' ||
                                configs.getPermissao()['EMPRESAS_SIMPLES'] == '0') && configs.getClientName() != 'hermes';

        if((form.getViewModel().get('isFaturado') || form.getViewModel().get('isManifestar')) && simplesNacional){ return true; }

        const divergencias = [];
        
        this.verificar({
            descricao: 'Base ICMS',
            campoCabecalho: 'MOVIMENTOS_BASEICMS',
            campoItem: 'MOVIMENTOSITENS_BASEICMS',
            form: form, 
            divergencias: divergencias
        });

        this.verificar({
            descricao: 'Valor ICMS',
            campoCabecalho: 'MOVIMENTOS_VALORICMS',
            campoItem: 'MOVIMENTOSITENS_VALORICMS',
            form: form, 
            divergencias: divergencias
        });

        this.verificar({
            descricao: 'Valor IPI',
            campoCabecalho: 'MOVIMENTOS_VALORIPI',
            campoItem: 'MOVIMENTOSITENS_VALORIPI',
            form: form, 
            divergencias: divergencias
        });

        this.verificar({
            descricao: 'Base Substituicao',
            campoCabecalho: 'MOVIMENTOS_BASEST',
            campoItem: 'MOVIMENTOSITENS_BASEST',
            form: form, 
            divergencias: divergencias
        });

        this.verificar({
            descricao: 'Valor Substituicao',
            campoCabecalho: 'MOVIMENTOS_VALORST',
            campoItem: 'MOVIMENTOSITENS_VALORST',
            form: form, 
            divergencias: divergencias
        });

        this.verificar({
            descricao: 'Frete',
            campoCabecalho: 'MOVIMENTOS_FRETE',
            campoItem: 'MOVIMENTOSITENS_FRETE',
            form: form, 
            divergencias: divergencias
        });

        this.verificar({
            descricao: 'Seguro',
            campoCabecalho: 'MOVIMENTOS_SEGURO',
            campoItem: 'MOVIMENTOSITENS_SEGURO',
            form: form, 
            divergencias: divergencias
        });

        this.verificar({
            descricao: 'Despesas',
            campoCabecalho: 'MOVIMENTOS_DESPESAS',
            campoItem: 'MOVIMENTOSITENS_DESPESAS',
            form: form, 
            divergencias: divergencias
        });

        this.verificar({
            descricao: 'Descontos',
            campoCabecalho: 'MOVIMENTOS_DESCONTOS',
            campoItem: 'MOVIMENTOSITENS_DESCONTOS',
            form: form, 
            divergencias: divergencias
        });

        /*
        this.verificar({
            descricao: 'Produtos',
            campoCabecalho: 'MOVIMENTOS_PRODUTOS',
            campoItem: 'MOVIMENTOSITENS_TOTAL',
            form: form, 
            divergencias: divergencias
        });*/

        this.verificarTotal({
            form: form, 
            divergencias: divergencias
        })

        if(divergencias.length == 0) {
            return true;
        } else {
            this.exibirJanela(divergencias);
            return false;
        }
    },

    verificar: function(options) {
        const { descricao, campoCabecalho, campoItem, form, divergencias } = options;
        const movimento = form.getViewModel().get('model');
        const itens = form.down('samoswidgets-griditems').getStore().getData().items || [];
        const valorCabecalho = cents(movimento.get(campoCabecalho));
        const valorItens = itens.reduce((result, item) => {
            result += cents(item.get(campoItem));
            return result;
        }, 0);
        const diferenca = (valorCabecalho - valorItens)

        if(Math.abs(diferenca) > 0) {
            divergencias.push({
                'DESCRICAO': descricao,
                'INFORMADO': valorCabecalho / 100,
                'CALCULADO': valorItens / 100
            });
        }
    },

    verificarTotal: function(options) {
        const { form, divergencias } = options;
        const movimento = form.getViewModel().get('model');
        const itens = form.down('samoswidgets-griditems').getStore().getData().items || [];
        const valorProdutos = itens.reduce((result, item) => {
            result += cents(item.get('MOVIMENTOSITENS_TOTAL'));
            return result;
        }, 0);
        const valorSt    = cents(movimento.get('MOVIMENTOS_VALORST'));
        const despesas   = cents(movimento.get('MOVIMENTOS_DESPESAS'));
        const frete      = cents(movimento.get('MOVIMENTOS_FRETE'));
        const seguro     = cents(movimento.get('MOVIMENTOS_SEGURO'));
        const ipi        = cents(movimento.get('MOVIMENTOS_VALORIPI'));
        const desconto   = cents(movimento.get('MOVIMENTOS_DESCONTOS')); //configs.getMovimentos().rateiaDescontoNotaEntrada ? 0 : cents(movimento.get('MOVIMENTOS_DESCONTOS'));
        const valorTotal = cents(movimento.get('MOVIMENTOS_TOTAL'));

        const diferenca = valorProdutos + valorSt + despesas + frete + seguro + ipi - desconto - valorTotal;

        if(Math.abs(diferenca) > 0) {
            divergencias.push({
                'DESCRICAO': 'Total',
                'INFORMADO': valorTotal / 100,
                'CALCULADO': (valorProdutos + valorSt + despesas + frete + seguro + ipi - desconto) / 100
            });
        }
    },

    exibirJanela: function(divergencias) {
        const viewDivergencias = Ext.create({
            xtype: 'formmovimentosdivergencias'
        });

        viewDivergencias.getViewModel().set('dataDivergencias', divergencias);
    }
});
Ext.define('SamosAdmin.processos.precos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.processosprecos',
    
    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueAcresDecrescimo: '0',
            valuePercentual  : 0,
            valueIdGrupo     : '',
            valueAtualizar   : '',
            valueIdFornecedor: '',
            valueGrupo       : '',
            valueFornecedor  : ''
        });

        this.setFormulas({
            hideProcessar: function(get) {
                return false;
            },

            hideImprimir: function(get) {
                return false;
            },

            hideColunaComissao: function(get) {
                return get('valueAtualizar') != 'SALDOS_COMISSAO';
            },

            hideColunaMarkUp: function(get) {
                return get('valueAtualizar') != 'SALDOS_MARKUP';
            },

            hideColunaCusto: function(get) {
                return get('valueAtualizar') != 'SALDOS_CUSTO';
            },

            hideColunaMargem: function(get) {
                const atualizar  = get('valueAtualizar');
                const recalcular = configs.getProdutos().atualizaPreco.find(opcao => opcao.field == atualizar).recalcular;
                
                if(atualizar == 'SALDOS_PRECO') {
                    return !recalcular['SALDOS_MARGEM'];
                } else {
                    return atualizar != 'SALDOS_MARGEM';
                }
            },

            hideColunaPreco: function(get) {
                const atualizar  = get('valueAtualizar');
                const recalcular = configs.getProdutos().atualizaPreco.find(opcao => opcao.field == atualizar).recalcular;
                
                if(atualizar == 'SALDOS_CUSTO') {
                    return !recalcular['SALDOS_PRECO'];
                } else if(atualizar == 'SALDOS_MARGEM') {
                    return !recalcular['SALDOS_PRECO'];
                } else {
                    return atualizar != 'SALDOS_PRECO';
                }
            },

            hideColunaNovoPreco: function(get) {
                const atualizar  = get('valueAtualizar');
                const recalcular = configs.getProdutos().atualizaPreco.find(opcao => opcao.field == atualizar).recalcular;
                
                if(atualizar == 'SALDOS_CUSTO') {
                    return !recalcular['SALDOS_PRECO'];
                } else if(atualizar == 'SALDOS_MARGEM') {
                    return !recalcular['SALDOS_PRECO'];
                } else {
                    return atualizar != 'SALDOS_PRECO';
                }
            },

            hideColunaPrazo: function(get) {
                const atualizar  = get('valueAtualizar');
                const recalcular = configs.getProdutos().atualizaPreco.find(opcao => opcao.field == atualizar).recalcular;
                const recalcularPreco = configs.getProdutos().atualizaPreco.find(opcao => opcao.field == 'SALDOS_PRECO').recalcular;
                
                if(atualizar == 'SALDOS_CUSTO') {
                    return !recalcular['SALDOS_PRECO'] || (recalcular['SALDOS_PRECO'] && !recalcularPreco['SALDOS_PRAZO']);
                } else if(atualizar == 'SALDOS_MARGEM') {
                    return !recalcular['SALDOS_PRECO'] || (recalcular['SALDOS_PRECO'] && !recalcularPreco['SALDOS_PRAZO']);
                } else if(atualizar == 'SALDOS_PRECO') {
                    return !recalcular['SALDOS_PRAZO'];
                } else {
                    return atualizar != 'SALDOS_PRAZO';
                }
            },

            hideColunaMargemMinima: function(get) {
                const atualizar  = get('valueAtualizar');
                const recalcular = configs.getProdutos().atualizaPreco.find(opcao => opcao.field == atualizar).recalcular;
                
                if(atualizar == 'SALDOS_PRECOMINIMO') {
                    return !recalcular['SALDOS_MARGEMMINIMA'];
                } else {
                    return atualizar != 'SALDOS_MARGEMMINIMA';
                }
            },

            hideColunaPrecoMinimo: function(get) {
                const atualizar  = get('valueAtualizar');
                const recalcular = configs.getProdutos().atualizaPreco.find(opcao => opcao.field == atualizar).recalcular;
                
                if(atualizar == 'SALDOS_CUSTO') {
                    return !recalcular['SALDOS_PRECOMINIMO'];
                } else if(atualizar == 'SALDOS_MARGEMMINIMA') {
                    return !recalcular['SALDOS_PRECOMINIMO'];
                } else {
                    return atualizar != 'SALDOS_PRECOMINIMO';
                }
            }
        });
    }
});

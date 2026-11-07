Ext.define('SamosAdmin.movimentos.movimento.form.impostositens.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentosimpostositens',

    constructor: function() {
        this.callParent(arguments);
        
        this.setFormulas({

            hideConfirmar: function(get) {
                return !get('updating') && !Ext.$('formmovimentos')[0].getViewModel().get('isPedidoRacaforte');
            },

            hideCancelar: function(get) {
                return !get('updating');
            },

            isNota: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNota');
            },

            isRequisicao: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isRequisicao');
            },

            isNotaEletronicaMTF: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNotaEletronicaMTF');
            },

            isSaidaRacaforte: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isSaidaRacaforte');
            },

            isNotaEletronicaHerbiquimica: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNotaEletronicaHerbiquimica');
            },

            isNotaEntrada: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNotaEntrada');
            },

            isNfeComReceita: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNotaEletronica') && 
                       (configs.getProdutos().labelListaPreco || '').match(/Receitu/) &&
                       get('model.PRODUTOS_LISTAPRECO') == 'T';
            },

            isNotaEntradaRacaforte: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNotaEntrada') &&
                       configs.getClientName() == 'racaforte';
            },

            isPedidoCompra: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isPedidoCompra');
            },

            isComplementar: function(get) {    
                return Ext.$('formmovimentos')[0].getViewModel().get('isComplementar');
            },

            isAjuste: function(get) {    
                return Ext.$('formmovimentos')[0].getViewModel().get('isAjuste') || Ext.$('formmovimentos')[0].getViewModel().get('isNotaEntrada');
            },

            isFinalidadeEspecial: function(get) {    
                return Ext.$('formmovimentos')[0].getViewModel().get('isFinalidadeEspecial') || Ext.$('formmovimentos')[0].getViewModel().get('isNotaEntrada');
            },

            isRequisicaoEntrada: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isRequisicaoEntrada');
            },

            isNotaProducao: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNotaProducao');
            },

            isNotaComPedidoCompra: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNotaComPedidoCompra');
            },

            isNotaComRequisicao: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNotaComRequisicao');
            },

            isEntradaCustoNulo: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isEntradaCustoNulo');
            },

            isProducaoBiomart: function(get) {
                return (configs.getClientName() == 'biomart' || 
                        configs.getClientName() == 'organoplant') && get('model.PRODUTOS_STATUS') == 'P'
            },

            isSemPisCofins: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNotaEletronica') &&
                       get('model.PRODUTOS_STATUS') == 'P'
            },
            
            isRetornoCamda: function(get) {

                const cnpjPessoa = Ext.$('formmovimentos')[0].getViewModel().get('model.PESSOAS_CPFCNPJ');

                return configs.getClientName() == 'biomart' &&   
//                     cnpjPessoa.toString().substr(0, 8) == '43001981' && // CAMDA
                       get('model.MOVIMENTOSITENS_ID_OPERACOES').toString().substr(0, 4).match(/5902|5903|6902|5124|6124/)
            },

            isOperacoesIsentasPis: function(get) {

                const cnpjPessoa = Ext.$('formmovimentos')[0].getViewModel().get('model.PESSOAS_CPFCNPJ');

                return configs.getClientName() == 'biomart' &&   // Exportação e Zona Franca
                       get('model.MOVIMENTOSITENS_ID_OPERACOES').toString().substr(0, 4).match(/6109|7101/)
            },

            isProdutoLote: function(get) {

                const produtoDerivado = get('model.PRODUTOS_DERIVADO').match(/T|F/);

                return !produtoDerivado && !(configs.getClientName() == 'biomart' || 
                                             configs.getClientName() == 'organoplant');
            },

            isNotaDevolucao: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNota') && String(Ext.$('formmovimentos')[0].getViewModel().get('model.OPERACOES_NOME')).toUpperCase().match(/DEVOLU/);
            },

            isDevolucaoMoveis: function(get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isDevolucaoMoveis');
            },
             
            cstPis: function(get) {

                const calculaPIS = Ext.$('formmovimentos')[0].getViewModel().get('model.OPERACOES_PISCOFINS') == 'T';
                const isProdutorPJ = Ext.$('formmovimentos')[0].getViewModel().get('model.PESSOAS_CATEGORIA') == '4';
                const isProdutoIsento = ((get('model.PRODUTOS_DESCRICAO') || '').split('|')[4] || '').toUpperCase() == 'P';
                const cstPisProduto = (get('model.PRODUTOS_DESCRICAO') || '').split('|')[0] || '01';

                if(calculaPIS) {
                    if(isProdutorPJ && isProdutoIsento) {
                        return '06'
                    } else {
                        return cstPisProduto;
                    }
                } else {
                    return cstPisProduto == '01' ? '06' : cstPisProduto;
                }
            },            

            aliquotaPis: function(get) {

                const calculaPIS = Ext.$('formmovimentos')[0].getViewModel().get('model.OPERACOES_PISCOFINS') == 'T';
                const isProdutorPJ = Ext.$('formmovimentos')[0].getViewModel().get('model.PESSOAS_CATEGORIA') == '4';
                const isProdutoIsento = (get('model.PRODUTOS_DESCRICAO').split('|')[4] || '').toUpperCase() == 'P';
                const aliquotaPisProduto = get('model.PRODUTOS_DESCRICAO').split('|')[1] || 0;

                if(calculaPIS) {
                    if(isProdutorPJ && isProdutoIsento) {
                        return 0
                    } else {
                        return aliquotaPisProduto;
                    }
                } else {
                    return 0
                }
            },            

            cstCofins: function(get) {

                const calculaCOFINS = Ext.$('formmovimentos')[0].getViewModel().get('model.OPERACOES_PISCOFINS') == 'T';
                const isProdutorPJ = Ext.$('formmovimentos')[0].getViewModel().get('model.PESSOAS_CATEGORIA') == '4';
                const isProdutoIsento = (get('model.PRODUTOS_DESCRICAO').split('|')[4] || '').toUpperCase() == 'P';
                const cstCofinsProduto = get('model.PRODUTOS_DESCRICAO').split('|')[2] || '01';

                if(calculaCOFINS) {
                    if(isProdutorPJ && isProdutoIsento) {
                        return '06'
                    } else {
                        return cstCofinsProduto;
                    }
                } else {
                    return cstCofinsProduto == '01' ? '06' : cstCofinsProduto;
                }
            },

            aliquotaCofins: function(get) {

                const calculaCOFINS = Ext.$('formmovimentos')[0].getViewModel().get('model.OPERACOES_PISCOFINS') == 'T';
                const isProdutorPJ = Ext.$('formmovimentos')[0].getViewModel().get('model.PESSOAS_CATEGORIA') == '4';
                const isProdutoIsento = (get('model.PRODUTOS_DESCRICAO').split('|')[4] || '').toUpperCase() == 'P';
                const aliquotaCofinsProduto = get('model.PRODUTOS_DESCRICAO').split('|')[3] || 0;

                if(calculaCOFINS) {
                    if(isProdutorPJ && isProdutoIsento) {
                        return 0
                    } else {
                        return aliquotaCofinsProduto;
                    }
                } else {
                    return 0
                }
            }

        });
    }
});

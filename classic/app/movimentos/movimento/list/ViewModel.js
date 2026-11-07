Ext.define('SamosAdmin.movimentos.movimento.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.movimentos',

    constructor: function () {
        this.callParent(arguments);

        const title = this.getView().title;
        const status = configs.getMovimentos().ordemBusca;

        this.setData({
            valueInicio: title == 'Nota Entrada' ? 
                         momentServer().startOf('month').format('YYYY-MM-DD') :
                         momentServer().format('YYYY-MM-DD'),
            valueStatus: (title == 'Pedidos' && status !== undefined ? status : 6),
            valueTipo: 0
        });

        this.setFormulas({
            hideGerarPDFs: function(get){
                return (configs.getClientName() != 'acomtf') || (title != 'Nota Eletrônica');
            },

            hideBoletosPagos: function(get) {
                return (configs.getClientName() != 'hospitalar') || (title != 'Pedidos');
            },

            hideImprimir: function(get) {
                return !configs.getUsuario().privilegiado;
            },

            storeStatus: function(get) {
                if(title == 'Nota Entrada') {
                    return [
                        [1, 'Não Implementada'],
                        [4, 'Manifestar'],
                        [2, 'Implementada'],
                        [6, 'Todas']
                    ];
                } else if(title == 'Pedidos' && configs.getClientName() == 'hospitalar') {
                    return [
                        [16, 'Pendente'],
                        [1,  'Não Faturado'],
                        [13, 'Em Separação'],
                        [14, 'Em Conferência'],
                        [15, 'Fechado'],
                        [2,  'Faturado'],
                        [3,  'Cancelado'],
                        [6,  'Todos']
                    ]
                } else if(title == 'Pedidos' && configs.getEmpresa().regimeCaixa) {
                    if(configs.getMovimentos().sistemaDeAprovacao) {
                        return [
                            [8,  'Pendente'],
                            [9,  'Aprovado'],
                            [10, 'Reprovado'],
                            [2,  'Faturado'],
                            [6,  'Todas']
                        ]
                    } else {
                        return [
                            [0, 'Caixa'],
                            [1, 'Não Faturado'],
                            [2, 'Faturado'],
                            [3, 'Cancelado'],
                            [6, 'Todas']
                        ]
                    }
                } else if(title == 'Nota Eletrônica') {
                    return [
                        [1, 'Não Faturado'],
                        [2, 'Faturado'],
                        [3, 'Cancelado'],
                        [7, 'Denegada'],
                        [17, 'Recusada'],
                        [18, 'Devolvida'],
                        [19, 'Inutilizada'],                        
                        [6, 'Todas']
                    ]
                } else if(title == 'Pedidos Compra') {
                    return [
                        [10, 'Enviado'],                        
                        [11, 'Aprovado'],
                        [1, 'Não Recebido'],
                        [2, 'Recebido'],
                        [9, 'Assistência'],                        
                        [6, 'Todos']
                    ]
                } else {
                    return [
                        [1, 'Não Faturado'],
                        [2, 'Faturado'],
                        [3, 'Cancelado'],
                        [19, 'Baixado'],
                        [6, 'Todas']
                    ]
                }
            },

            isTransferencia: function(get) {
                return title.match(/Transfer/);
            },

            isTransferenciaCentro: function(get) {
                return (title.match(/Transfer/) && configs.getEmpresa().id == 1);
            },

            cpfcnpjFormatado: function(get) {
                const cpfCnpj         = get('gridmovimentos.selection.MOVIMENTOS_CPFCNPJ') || '';
                const origemMovimento = (get('gridmovimentos.selection.MOVIMENTOS_NUMEROORIGEM') + ' ' +
                                         get('gridmovimentos.selection.MOVIMENTOS_SERIEORIGEM')) || '';

                return `${origemMovimento} - CPF/CNPJ: ${cpfCnpj}`;
            },

            celularFormatado: function(get) {
                const numCelular = get('gridmovimentos.selection.MOVIMENTOS_CELULAR')  || '';

                return `Celular: ${numCelular}`;
            },

            totalFormatado: function (get) {
                let valorTotal = get('gridmovimentos.selection.TOTAL_MOVIMENTOS');
                let maskTotal = '';

                if(parseFloat(valorTotal) > 0 && (configs.getMovimentos().exibirTotalVendedor || configs.getUsuario().tipo != configs.getUsuarios().tipoVendedor)) {
                    maskTotal = Ext.util.Format.MoneyMask.setMask('Total: R$ #9.999.990,00').mask(valorTotal)
                }

                return maskTotal;
            }
            
        });

        this.setStores({
            documentos: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.documentos.Model',
                proxy: {
                    url: 'server/documentos',
                    extraParams: {
                        ordem: 2,
                        status: 2,
                        start: 0,
                        limit: 9999
                    }
                }
            }
        });
    }
});

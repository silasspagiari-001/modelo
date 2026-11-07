Ext.define('SamosAdmin.movimentos.movimento.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'movimentos',

    requires: [
        'SamosAdmin.movimentos.movimento.form.View',
        'SamosAdmin.movimentos.movimento.list.ViewController',
        'SamosAdmin.movimentos.movimento.list.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Boletos Pagos'
    ],

    rightbuttons: [
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            
            //Se for pedido ou nota eletronica
            if( record.get('DOCUMENTOS_NOME') == 'Nota Eletrônica' || record.get('DOCUMENTOS_NOME') == 'Pedidos' ){
                const geraFinanceiro = record.get('OPERACOES_FINANCEIRO') != 'N';
                const isCancelado = (record.get('MOVIMENTOS_STATUS') == 'C' ||
                                     record.get('MOVIMENTOS_STATUS') == 'D' ||
                                     record.get('MOVIMENTOS_STATUS') == 'R' ||
                                     record.get('MOVIMENTOS_STATUS') == 'V'); 
                const caixaMovimento = record.get('MOVIMENTOS_CAIXA')[0] || {};
                const totalMovimento = cents(record.get('MOVIMENTOS_TOTAL')) - cents(record.get('MOVIMENTOS_VALORRETENCAO'));
                const totalCaixaMovimento = cents(caixaMovimento['MOVIMENTOSCAIXA_DINHEIRO']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_CHEQUE']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_CREDITO']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_DEBITO']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_DUPLICATA']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_TRANSFERENCIAS']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_OUTRO']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_COMBUSTIVEL']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_PRESENTE']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_REFEICAO']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_ALIMENTACAO']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_CREDITOPESSOA']) + 
                                            cents(caixaMovimento['MOVIMENTOSCAIXA_CREDITOLOJA']);

                //Se a operação gera financeiro
                if(!configs.getEmpresa().regimeCaixa) {
                    if(geraFinanceiro && !isCancelado && totalMovimento != totalCaixaMovimento ){
                        return "fundo-laranjaescuro";
                    }    
                }
            }

            //Outras condições
            const status   = record.get('MOVIMENTOS_STATUS');
            const situacao = record.get('MOVIMENTOS_SITUACAO');
            
            if(
                record.get('DOCUMENTOS_NOME') == 'Pedidos' && 
                configs.getMovimentos().sistemaDeAprovacao
            ){
                if(status == 'B' || status == 'M' || status == 'E'){
                    return "fundo-amarelo"
                } else if (status == 'C') {
                    return "vermelho";
                } else if (situacao == 'P') {
                    return "verde";
                } else if (situacao == 'A') {
                    return "azul";
                } else if (situacao == 'R') {
                    return "lilas";
                } else if (status == 'F') {
                    return "preto";
                } else if (status == 'A') {
                    return "azul";
                }
            } else {
                if (status == 'F') {
                    return "preto";
                } else if (status == 'N' || status == 'P' || status == 'S' || status == 'R') {
                    return "verde";
                } else if (status == 'X' || status == 'Z') {
                    return "lilas";
                } else if (status == 'G') {
                    return "fundo-azul";
                } else if (status == 'H') {
                    return "lilas";
                } else if (status == 'C') {
                    return "vermelho";
                } else if (status == 'D') {
                    return "lilas";
                } else if (status == 'R') {
                    return "lilas";
                } else if (status == 'U') {
                    return "lilas";
                } else if (status == 'V') {
                    return "lilas";
                } else if (status == 'I') {
                    return "lilas";
                } else if (status == 'A') {
                    return "azul";
                } else {
                    return "fundo-amarelo";
                }
            }
        }
    },

    constructor: function(config){
        const isPedidos = config.title == 'Pedidos';        
        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Numero',
                    flex: 1
                },
                {
                    flex: 3,
                    xtype: 'samoswidgets-textsearch',
                    fieldLabel: 'Pessoa',
                    tabela: 'pessoas',
                    complement: 'idpessoa',
                    reference: 'pessoa',
                    proximoFoco: 'inicio',
                    ignoreNotFound: true,
                    callbackFn: 'onBuscarClick',
                    buscarPor: 'Genérica',
                    associations: [
                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                        ['PESSOAS_ID',   'PESSOAS_ID']
                    ]           
                },        
                {
                    hidden: true,
                    fieldLabel: 'IdPessoa',
                    itemId: 'idpessoa'
                },
                {
                    xtype: 'datefield',
                    fieldLabel: 'Inicio',
                    width: 125 // 130
                },
                {
                    xtype: 'datefield',
                    fieldLabel: 'Final',
                    width: 125
                },
                {
                    fieldLabel: 'Ordem',
                    width: 135,
                    store: [
                        [0, 'Emissão'],
                        [1, 'Pessoas'],
                        [2, 'Número'],
                        [3, 'Entrada/Saída']
                    ]
                },
                {
                    fieldLabel: 'Tipo',
                    width: 115,
                    hidden: (configs.getClientName() != 'hospitalar' || !isPedidos),
                    store: [
                        [0, 'Todos'],
                        [1, 'Vendedor'],
                        [2, 'Vtex']
                    ]
                },
                {
                    fieldLabel: 'Status',
                    width: configs.getClientName() == 'hospitalar' ? 220 : 150,
                    defaultValue:3,
                    bind: {
                        store: '{storeStatus}'
                    }
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ],
        
            columns: {
                items: [
                    {
                        flex: false,
                        width: 80,
                        text: 'Empresa',
                        dataIndex: 'MOVIMENTOS_ID_EMPRESAS',
                        align: 'center',
                        hidden: !configs.getMultiEmpresa()
                    },
                    {
                        flex: false,
                        width: 70,
                        text: 'N.º',
                        dataIndex: 'MOVIMENTOS_NUMERO',
                        align: 'right'
                        
                    },
                    {
                        flex: false,
                        width: 58,
                        text: 'Série',
                        dataIndex: 'MOVIMENTOS_SERIE',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: configs.getClientName() == 'hospitalar' ? 180 : 125,
                        text: configs.getMovimentos().sistemaDeAprovacao ? 'Situação' : 'Status',
                        dataIndex: 'MOVIMENTOS_STATUS',
                        renderer: function(value, meta, record) {
                            if(
                                configs.getClientName() == 'hospitalar' && 
                                record.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0002'// Pedidos
                            ) {
                                if (value === 'Q') {
                                    return 'Pendente';
                                } else if (value === 'N') {
                                    return 'Não Faturado';
                                } else if (value === 'S') {
                                    return 'Em Separação';
                                } else if (value === 'P') {
                                    return 'Em Conferência';
                                } else if (value === 'I') {
                                    return 'Fechado';
                                } else if (value === 'F') {
                                    return 'Faturado';
                                } else if (value === 'C') {
                                    return 'Cancelado';
                                }
                            } else if(record.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0005') {  // Nota de Entrada
                                if (value === 'F') {
                                    return 'Implementada';
                                } else if (value === 'G') {
                                    return 'Manifestar';
                                } else if (value === 'H') {
                                    return 'Transferir';
                                } else if (value === 'N') {
                                    return 'Não Implementada';
                                }
                            } else if(record.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0006') {  // Pedido de compra
                                if (value === 'F') {
                                    return 'Recebido';
                                } else if (value === 'N') {
                                    return 'Não Recebido';
                                } else if (value === 'E') {
                                    return 'Enviado';
                                } else if (value === 'A') {
                                    return 'Assistência';
                                }
                            } else if(record.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0012') { // Devoluções
                                if (value === 'F') {
                                    return 'Devolvido';
                                } else if (value === 'N') {
                                    return 'Não Efetivada';
                                } else if (value === 'C') {
                                    return 'Cancelada';
                                }
                            } else if(record.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0007' ||  // Transferências 
                                      record.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0016') {
                                if (value === 'F') {
                                    return 'Transferida';
                                } else if (value === 'N') {
                                    return 'Abastecimento';
                                } else if (value === 'A') {
                                    return 'Nota Emitida';
                                } else if (value === 'C') {
                                    return 'Cancelada';
                                }
                            } else if(record.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0016') {  // Solicitação de compra
                                if (value === 'F') {
                                    return 'Exportado';
                                } else if (value === 'N') {
                                    return 'Não Exportado';
                                } else if (value === 'C') {
                                    return 'Cancelado';
                                }
                            } else if(
                                record.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0002' && // Pedidos
                                configs.getMovimentos().sistemaDeAprovacao
                            ) {
                                if (value == 'C') {
                                    return 'Cancelado';
                                } else {
                                    value = record.get('MOVIMENTOS_SITUACAO');
                                    if (value == 'P') {
                                        return 'Pendente';
                                    } else if (value == 'A') {
                                        return 'Aprovado';
                                    } else if (value == 'R') {
                                        return 'Reprovado';
                                    }    
                                }
                            } else {
                                if (value === 'F' || value === 'E') {
                                    return 'Faturado';
                                } else if (value === 'N' || value === 'M') {
                                    return 'Não Faturado';
                                } else if (value === 'C' || value === 'B') {
                                    return 'Cancelado';
                                } else if (value === 'D') {
                                    return 'Denegada';
                                } else if (value === 'R') {
                                    return 'Recusada';
                                } else if (value === 'U') {
                                    return 'Inutilizada';
                                } else if (value === 'V') {
                                    return 'Devolvida';
                                } else if (value === 'X') {
                                    return 'Baixado';                                
                                } else if (value === 'Z') {
                                    return 'Baixado';                                
                                }
                            }
                        }
                    },
                    {
                        flex: false,
                        width: 93,
                        text: 'Emissão',
                        xtype: 'datecolumn',
                        dataIndex: 'MOVIMENTOS_EMISSAO',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 125,
                        text: 'Vendedor',
                        dataIndex: 'USUARIOS_LOGIN'
                    },
                    {
                        flex: 1,
                        text: 'Nome',
                        dataIndex: 'MOVIMENTOS_NOME',
                        bind: {
                            hidden: '{isTransferenciaCentro}'
                        }
                    },
                    {
                        flex: 1,
                        text: 'Destino',
                        dataIndex: 'DESTINO_FANTASIA',
                        bind: {
                            hidden: '{!isTransferenciaCentro}'
                        }
                    },
                    {
                        flex: false,
                        width: 180,
                        text: 'Cidade',
                        dataIndex: 'CIDADES_NOME',
                        bind: {
                            hidden: '{isTransferencia}'
                        }
                    },
                    {
                        flex: false,
                        width: 50,
                        text: 'UF',
                        dataIndex: 'CIDADES_ESTADO',
                        bind: {
                            hidden: '{isTransferencia}'
                        }
                    },
                    {
                        flex: false,
                        width: 105,
                        text: 'Valor',
                        xtype: 'moneycolumn',
                        dataIndex: 'MOVIMENTOS_TOTAL',
                        align: 'right'
                    }
                 ]
            },
            footPanel: [
                {
                    xtype: 'label',
                    flex: 1,
                    padding: '0 0 0 15',
                    style : 'text-align:left;font-weight: bold; color: black;',
                    bind: {
                        text: '{cpfcnpjFormatado}'
                    }
                },
                {
                    xtype: 'label',
                    flex: 1,
                    padding: '0 0 0 15',
                    style: 'text-align:right;font-weight:bold;color:black;',
                    bind: {
                        text: '{celularFormatado}'
                    }
                },
                {
                    xtype: 'label',
                    flex: 1,
                    padding: '0 0 0 15',  // last 15
                    style: 'text-align:right;font-weight:bold;color:black;',
                    bind: {
                        text: '{totalFormatado}'
                    }
                },
                {
                    xtype: 'container',
                    width: 10,
                    flex: false // 0.2
                }
            ]            
        });

        this.callParent(arguments);
    }
});

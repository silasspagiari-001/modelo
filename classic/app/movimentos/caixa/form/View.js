Ext.define('SamosAdmin.movimentos.caixa.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formcaixa',

    title: 'Caixa Diário',

    requires: [
        'SamosAdmin.movimentos.caixa.form.ViewModel',
        'SamosAdmin.movimentos.caixa.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Recibo'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    constructor: function (config) {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    xtype: 'datefield',
                                    width: 130,
                                    flex: false,
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    proximoFoco: 'tipo',
                                    maxValue: momentServer().format('YYYY-MM-DD'),
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_EMISSAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 130,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo',
                                    proximoFoco: 'aplicacao',
                                    emptyText: '',
                                    forceSelection: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_TIPO}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['E', 'Entrada'],
                                            ['S', 'Saída'],
                                            ['N', 'Nulo']
                                        ]
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Aplicação',
                                    flex: 1,
                                    tabela: 'aplicacoes',
                                    reference: 'aplicacao',
                                    proximoFoco: 'pessoa',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['APLICACOES_NOME',               'APLICACOES_NOME'],
                                        ['MOVIMENTOSCAIXA_ID_APLICACOES', 'APLICACOES_ID']
                                    ],
                                    bind: {
                                        value: '{model.APLICACOES_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_ID_APLICACOES}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-textsearch', 
                                    fieldLabel: 'Pessoa',
                                    flex: 0.8,
                                    tabela: 'pessoas',
                                    reference: 'pessoa',
                                    naoFocarAposPesquisar: true,
                                    proximoFoco: 'nome',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PESSOAS_NOME',          'PESSOAS_NOME'],
                                        ['PESSOAS_CPFCNPJ',       'PESSOAS_CPFCNPJ'],
                                        ['PESSOAS_ENDERECO',      'PESSOAS_ENDERECO'],
                                        ['PESSOAS_NUMERO',        'PESSOAS_NUMERO'],
                                        ['PESSOAS_BAIRRO',        'PESSOAS_BAIRRO'],
                                        ['PESSOAS_CEP',           'PESSOAS_CEP'],
                                        ['PESSOAS_TELEFONE',      'PESSOAS_TELEFONE'],
                                        ['PESSOAS_CELULAR',       'PESSOAS_CELULAR'],
                                        ['PESSOAS_ID_CIDADES',    'PESSOAS_ID_CIDADES'],
                                        ['MOVIMENTOSCAIXA_ID_PESSOAS', 'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{model.PESSOAS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_ID_PESSOAS}'
                                    }
                                },
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: 'Descrição do Lançamento',
                                    flex: 1,
                                    reference: 'nome',
                                    proximoFoco: 'dinheiro',
                                    maxLength: 512,                                    
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Log',
                                    maxLength: 50,
                                    reference: 'log',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_LOG}'
                                    }
                                }                                        
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelDinheiro || 'Dinheiro'),
                                    reference: 'dinheiro',
                                    proximoFoco: 'cheque',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_DINHEIRO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelCheque || 'Cheque'),
                                    reference: 'cheque',
                                    proximoFoco: 'credito',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CHEQUE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelCredito || 'Cartão Crédito'),
                                    reference: 'credito',
                                    proximoFoco: 'debito',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CREDITO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelDebito || 'Cartão Débito'),
                                    reference: 'debito',
                                    proximoFoco: 'creditoloja',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_DEBITO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelCreditoLoja || 'Crédito Loja'),
                                    reference: 'creditoloja',
                                    proximoFoco: 'creditopessoa',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CREDITOLOJA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelCreditoPessoa || 'Crédito Pessoa'),
                                    reference: 'creditopessoa',
                                    proximoFoco: 'alimentacao',
                                    xtype: 'samoswidgets-textmoney',
                                    hidden: configs.getFinanceiros().hideCreditoPessoa,
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CREDITOPESSOA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelAlimentacao || 'Vale Alimentação'),
                                    reference: 'alimentacao',
                                    proximoFoco: 'refeicao',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_ALIMENTACAO}',
                                        readOnly: '{readOnly}'
                                    }
                                }                    
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelRefeicao || 'Vale Refeição'),
                                    reference: 'refeicao',
                                    proximoFoco: 'presente',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_REFEICAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelPresente || 'Vale Presente'),
                                    reference: 'presente',
                                    proximoFoco: 'combustivel',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_PRESENTE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelCombustivel || 'Vale Combustível'),
                                    reference: 'combustivel',
                                    proximoFoco: 'duplicata',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_COMBUSTIVEL}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelDuplicata || 'Duplicata'),
                                    reference: 'duplicata',
                                    proximoFoco: 'transferencia',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_DUPLICATA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelBoleto || 'Boleto'),
                                    reference: 'boleto',
                                    proximoFoco: 'outro',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_BOLETO}',
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelTransferencia || 'Transferência/Pix'),
                                    reference: 'transferencia',
                                    proximoFoco: 'outro',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_TRANSFERENCIAS}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: (configs.getFinanceiros().labelOutro || 'Outro'),
                                    reference: 'outro',
                                    proximoFoco: 'troco',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_OUTRO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Troco',
                                    reference: 'troco',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_TROCO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                                
                            ]
                        }
                    ]
                }
            ]
        });
        this.callParent(arguments);
    }
});

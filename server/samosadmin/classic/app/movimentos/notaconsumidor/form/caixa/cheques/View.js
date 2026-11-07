Ext.define('SamosAdmin.movimentos.notaconsumidor.form.caixa.cheques.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formnotaconsumidorcaixacheques',

    requires: [
        'SamosAdmin.movimentos.notaconsumidor.form.caixa.cheques.ViewModel',
        'SamosAdmin.movimentos.notaconsumidor.form.caixa.cheques.ViewController',
        'SamosAdmin.movimentos.notaconsumidor.form.caixa.cheques.detalhes.View'
    ],

    title: 'Cheques',
    modelName: 'SamosFinanceiros.cheques.Model',
    hidePaging: true,

    listeners: {
        afterrender: 'loadCheques'
    },

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Confirmar',
        'Sair'
    ],

    formgroups: [
        {
            items: [
                {   
                    items: [
                        {
                            width: 80,
                            xtype: 'samoswidgets-textsearch',
                            fieldLabel: 'Banco',
                            proximoFoco: 'agencia',
                            maxLength: 3,
                            tabela: 'bancos',
                            reference: 'banco',
                            buscarPor: 'Código',
                            associations: [
                                ['CHEQUES_ID_BANCOS', 'BANCOS_ID']
                            ],
                            bind: {
                                value: '{model.CHEQUES_ID_BANCOS}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            width: 60,
                            fieldLabel: 'Agência',
                            reference: 'agencia',
                            proximoFoco: 'conta',
                            maxLength: 4,
                            bind: {
                                value: '{model.CHEQUES_AGENCIA}',
                                readOnly: '{readOnly}'
                            }
                        },     
                        {
                            width: 105,
                            fieldLabel: 'Conta',
                            reference: 'conta',
                            proximoFoco: 'numero',
                            maxLength: 10,
                            bind: {

                                value: '{model.CHEQUES_CONTA}',
                                readOnly: '{readOnly}'
                            },
                            listeners: {
                                blur: function () {
                                    this.setValue(("0000000000" + this.getValue()).slice(-10));
                                }
                            }                    
                        },
                        {
                            width: 70,
                            fieldLabel: 'Número',
                            maxLength: 6,
                            reference: 'numero',
                            proximoFoco: 'cpfcnpj',
                            bind: {

                                value: '{model.CHEQUES_NUMERO}', 
                                readOnly: '{readOnly}'
                            },
                            listeners: {
                                blur: function () {
                                    this.setValue(("000000" + this.getValue()).slice(-6));
                                }
                            },
                    
                        },     
                        {
                            width: 155,
                            fieldLabel: 'CPF/CNPJ',
                            reference: 'cpfcnpj',
                            proximoFoco: 'prazo',
                            bind: {

                                value: '{model.CHEQUES_CPFCNPJ}',
                                readOnly: '{readOnly}'
                            }
                        },                                                                                            
                        {
                            flex: 1,
                            xtype: 'samoswidgets-textsearch',
                            fieldLabel: 'Prazo',
                            tabela: 'prazos',
                            reference: 'prazo',
                            proximoFoco: 'serie',
                            buscarPor: 'Genérica',
                            associations: [
                                ['PRAZOS_NOME',          'PRAZOS_NOME'],
                                ['MOVIMENTOS_ID_PRAZOS', 'PRAZOS_ID'],
                                ['PRAZOS_PARCELAS',      'PRAZOS_PARCELAS'],
                                ['PRAZOS_PARCELAMENTO',  'PRAZOS_PARCELAMENTO']
                            ],
                            bind: {
                                value: '{model.PRAZOS_NOME}',
                                readOnly: '{readOnly}'
                            },
                            callbackFn: 'gerarCheques'
                        },
                        {
                            hidden: true,
                            bind: {
                                value: '{model.MOVIMENTOS_ID_PRAZOS}'
                            }
                        }
                    ]
                }
            ]
        },
        {
            layout: 'fit',
            items: [
                {
                    xtype: 'samoswidgets-griditems',
                    reference: 'cheques',
                    scrollable: true,
                    height: 328,
                    qtdeLinhasMinima: 0,
                    name: 'MOVIMENTOS_CHEQUES',
                    idProperty: 'CHEQUES_ID',
                    bind: {
                        store: '{main}'
                    },
                    janelaDetalhes: {
                        xtype: 'formnotaconsumidorcaixachequesdetalhes'
                    },
                    fields: [
                        { hidden: true, name: 'CHEQUES_ID' },
                        {
                            title: 'Número',
                            width: 75,
                            xtype: 'textfield',
                            proximoFoco: 'vencimento',
                            fieldStyle: 'text-align:right;',
                            name: 'CHEQUES_NUMERO',
                            maxLength: 6,
                            bind: {
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            title: 'Vencimento',
                            width: 135,
                            name: 'CHEQUES_VENCIMENTO',
                            fieldStyle: 'text-align:center;',
                            proximoFoco: 'valor',
                            xtype: 'datefield',
                            bind: {
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            title: 'Valor',
                            name: 'CHEQUES_VALOR',
                            width: 100,
                            proximoFoco: 'observacoes',
                            xtype: 'samoswidgets-textmoney',
                            bind: {
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            title: 'Nome',
                            flex: 1,
                            xtype: 'textfield',
                            proximoFoco: 'numero[linhadebaixo]',
                            name: 'CHEQUES_NOME',
                            maxLength: 50,
                            bind: {
                                readOnly: '{readOnly}'
                            }
                        },
                        { hidden: true, name: 'CHEQUES_STATUS' },
                        { hidden: true, name: 'CHEQUES_CPFCNPJ' },
                        { hidden: true, name: 'CHEQUES_CEP' },
                        { hidden: true, name: 'CIDADES_NOME' },
                        { hidden: true, name: 'CIDADES_ESTADO' },
                        { hidden: true, name: 'CHEQUES_ID_CIDADES' },
                        { hidden: true, name: 'CHEQUES_ENDERECO' },
                        { hidden: true, name: 'CHEQUES_NRORESIDENCIA' },
                        { hidden: true, name: 'CHEQUES_BAIRRO' },
                        { hidden: true, name: 'CHEQUES_OBSERVACOES' },
                        { hidden: true, name: 'CHEQUES_TELEFONE' },
                        { hidden: true, name: 'CHEQUES_CELULAR' },
                        { hidden: true, name: 'CHEQUES_ORIGEM' },
                        { hidden: true, name: 'CHEQUES_SERIE' },
                        { hidden: true, name: 'CHEQUES_ID_BANCOS' },
                        { hidden: true, name: 'BANCOS_NOME' },
                        { hidden: true, name: 'CHEQUES_AGENCIA' },
                        { hidden: true, name: 'CHEQUES_CONTA' },
                        { hidden: true, name: 'CHEQUES_EMISSAO', xtype: 'datefield'   },
                        { hidden: true, name: 'CHEQUES_LANCADO', xtype: 'datefield'   },
                        { hidden: true, name: 'CHEQUES_DEPOSITO', xtype: 'datefield'   },
                        { hidden: true, name: 'CHEQUES_BAIXA', xtype: 'datefield'   },
                        { hidden: true, name: 'CHEQUES_REPASSE', xtype: 'datefield'   },
                        { hidden: true, name: 'CHEQUES_ID_PESSOAS' },
                        { hidden: true, name: 'CHEQUES_LOG' },
                        { hidden: true, name: 'CHEQUES_ID_EMPRESAS' },
                        { hidden: true, name: 'DOCUMENTOS_NOME' },
                        { hidden: true, name: 'CHEQUES_ID_DOCUMENTOS' }
                    ]
                }
            ]
        }
    ]
});

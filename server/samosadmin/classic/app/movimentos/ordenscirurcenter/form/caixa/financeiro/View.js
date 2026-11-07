Ext.define('SamosAdmin.movimentos.ordenscirurcenter.form.caixa.financeiro.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formordenscirurcentercaixafinanceiro',

    requires: [
        'SamosAdmin.movimentos.ordenscirurcenter.form.caixa.financeiro.ViewModel',
        'SamosAdmin.movimentos.ordenscirurcenter.form.caixa.financeiro.ViewController'
    ],

    title: 'Financeiro',
    modelName: 'SamosFinanceiros.titulos.Model',
    hidePaging: true,

    listeners: {
        afterrender: 'loadFinanceiro'
    },

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Confirmar',
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {

            formgroups: [
                {
                    items: [
                        {   
                            items: [
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
                                        ['ORDENS_ID_PRAZOS',     'PRAZOS_ID'],
                                        ['PRAZOS_PARCELAS',      'PRAZOS_PARCELAS'],
                                        ['PRAZOS_PARCELAMENTO',  'PRAZOS_PARCELAMENTO']
                                    ],
                                    bind: {
                                        value: '{model.PRAZOS_NOME}',
                                        readOnly: '{readOnly}'
                                    },
                                    callbackFn: 'gerarFinanceiro'
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.ORDENS_ID_PRAZOS}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 65,
                                    fieldLabel: 'Parcelas',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.PRAZOS_PARCELAS}'
                                    }
                                },
                                {
                                    width: 106,
                                    flex: false,
                                    fieldLabel: 'Boleto',
                                    reference: 'boleto',
                                    readOnly: false,
                                    bind: {
                                        hidden: '{!isPagar}',
                                        value: '{model.PRAZOS_EXPORTADO}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Recebido',
                                    checked: false                    
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
                            reference: 'financeiro',
                            scrollable: true,
                            height: 312,
                            qtdeLinhasMinima: 0,
                            name: 'ORDENS_FINANCEIROS',
                            idProperty: 'FINANCEIROS_ID',
                            bind: {
                                store: '{main}'
                            },
                            listeners: {
                                antesDePublicarModel: 'copiarOriginalParaAberto'
                            },
                            fields: [
                                { hidden: true, name: 'FINANCEIROS_ID' },
                                {
                                    title: 'Vencimento',
                                    width: 135,
                                    name: 'FINANCEIROS_VENCIMENTO',
                                    fieldStyle: 'text-align:center;',
                                    proximoFoco: 'valor',
                                    xtype: 'datefield',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Valor',
                                    name: 'FINANCEIROS_ORIGINAL',
                                    width: 135,
                                    proximoFoco: 'observacoes',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Portador',
                                    width: 200,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'portadores',
                                    naoSairSeVazio: true,
                                    buscarPor: 'Genérica',
                                    proximoFoco: 'observacoes',
                                    name: 'PORTADORES_NOME',
                                    hidden: !configs.getMovimentos().exibirPortadorTitulos,
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['PORTADORES_NOME'          , 'PORTADORES_NOME'],
                                        ['FINANCEIROS_ID_PORTADORES', 'PORTADORES_ID']
                                    ]
                                },
                                { hidden: true, name: 'FINANCEIROS_ID_PORTADORES' },
                                {
                                    title: 'Observações',
                                    flex: 1,
                                    xtype: 'textfield',
                                    proximoFoco: 'vencimento[linhadebaixo]',
                                    name: 'FINANCEIROS_OBSERVACOES',
                                    maxLength: 512,
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    name: 'FINANCEIROS_EXPORTADO',
                                    xtype: 'textfield',
                                    bind: {
                                        value: '{model.PRAZOS_EXPORTADO ? "T" : "F"}'
                                    }
                                },
                                { hidden: true, name: 'FINANCEIROS_NUMERO' },
                                { hidden: true, name: 'FINANCEIROS_SERIE' },
                                { hidden: true, name: 'FINANCEIROS_TIPO' },
                                { hidden: true, name: 'FINANCEIROS_ID_MOVIMENTOS' },
                                { hidden: true, name: 'FINANCEIROS_ID_DOCUMENTOS' },
                                { hidden: true, name: 'FINANCEIROS_ID_PESSOAS' },
                                { hidden: true, name: 'PESSOAS_TIPO' },
                                { hidden: true, name: 'FINANCEIROS_ID_USUARIOS' },
                                { hidden: true, name: 'FINANCEIROS_ID_APLICACOES' },
                                { hidden: true, name: 'FINANCEIROS_ID_PRAZOS' },
                                { hidden: true, name: 'FINANCEIROS_PARCELAS' },
                                { hidden: true, name: 'FINANCEIROS_PARCELA' },
                                { hidden: true, name: 'FINANCEIROS_EMISSAO', xtype: 'datefield' },
                                { hidden: true, name: 'FINANCEIROS_BAIXA', xtype: 'datefield'  },
                                { hidden: true, name: 'FINANCEIROS_PAGAMENTO', xtype: 'datefield'  },
                                { hidden: true, name: 'FINANCEIROS_ABERTO' },
                                { hidden: true, name: 'FINANCEIROS_PAGO' },
                                { hidden: true, name: 'FINANCEIROS_TOTAL' },
                                { hidden: true, name: 'FINANCEIROS_STATUS' },
                                { hidden: true, name: 'FINANCEIROS_ID_EMPRESAS' },
                                { hidden: true, name: 'FINANCEIROS_LOG' },
                                { hidden: true, name: 'FINANCEIROS_DESCONTOS' },
                                { hidden: true, name: 'FINANCEIROS_JUROS' },
                                { hidden: true, name: 'FINANCEIROS_TAXAS' },
                                { hidden: true, name: 'FINANCEIROS_NOSSONUMERO' }
                            ]
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }            
});

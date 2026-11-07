Ext.define('SamosAdmin.movimentos.movimento.form.sefaz.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentossefaz',

    requires: [
        'SamosAdmin.movimentos.movimento.form.sefaz.ViewModel',
        'SamosAdmin.movimentos.movimento.form.sefaz.ViewController'
    ],

    title: 'SEFAZ',
    hidePaging: true,
    width: 810,
    height: 485,

    leftbuttons: [
        {
            action: 'Status',
            ui: 'tertiary'
        },
        {
            action: 'Enviar',
            ui: 'secondary'
        },
        {
            action: 'Emitir',
            ui: 'primary'
        },
        {
            action: 'Consultar',
            ui: 'tertiary'
        },
        {
            action: 'Visualizar',
            ui: 'tertiary'
        },
        {
            action: 'Opções: Enviar Email, Encerramento, Cartas de Correção, Cancelamento, Inutilizar, Recusada, Devolvida',
            ui: 'secondary'
        }
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function (cfg) {
        const tema = configs.getTema();

        Ext.apply(this, {
            formgroups: [
                {   
                    xtype: 'samoswidgets-defaultform',
                    padding: '10 20 10 20',
                    ui: 'formpanel-clean-' + tema,
                    items: [
                        {
                            items: [
                                {
                                    width: 70,
                                    reference: 'numero',
                                    fieldLabel: 'Número',
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;color:red;',
                                    readOnly: true,
                                    bind: {
                                        value: '{modelNumero}'
                                    }
                                },
                                {
                                    width: 60,
                                    reference: 'serie',
                                    fieldStyle: 'color:red',
                                    fieldLabel: 'Série',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{modelSerie}'
                                    }
                                },
                                {
                                    width: 120,
                                    xtype: 'combobox',
                                    fieldLabel: 'Ambiente',
                                    emptyText: '',
                                    reference: 'ambiente',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: [
                                        ['H', 'Homologação'],
                                        ['P', 'Produção'],
                                        ['C', 'Contingência']
                                    ],
                                    bind: {
                                        value: '{model.EMPRESAS_AMBIENTE}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 110,
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.' + cfg.tipo + '_EMISSAO}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 110,
                                    fieldLabel: 'Saída',
                                    reference: 'emissao',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: cfg.tipo == 'MOVIMENTOS'    ? '{model.MOVIMENTOS_ENTRADASAIDA}' :
                                               cfg.tipo == 'MANIFESTOS'    ? '{model.MANIFESTOS_SAIDA}' :
                                               '{model.CONHECIMENTOS_ENTREGA}'
                                    }
                                },
                                {
                                    width: 120,
                                    fieldLabel: 'Valor',
                                    reference: 'valor',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    fieldStyle: 'color:blue',
                                    bind: {
                                        value: cfg.tipo == 'CONHECIMENTOS' ? '{model.CONHECIMENTOS_SERVICOS}' :
                                               '{model.' + cfg.tipo + '_TOTAL}'
                                    }
                                },
                                {
                                    width: 122,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: cfg.tipo == 'MOVIMENTOS' ? [
                                        ['N', 'Não Faturado'],
                                        ['M', 'Não Faturado'],//em uso
                                        ['F', 'Faturado'],
                                        ['E', 'Faturado'],    //em uso
                                        ['C', 'Cancelado'],
                                        ['B', 'Cancelado'],    //em uso,
                                        ['D', 'Denegada'],
                                        ['R', 'Recusada'],
                                        ['V', 'Devolvida']
                                    ] : cfg.tipo == 'MANIFESTOS' ? [
                                        ['N', 'Não Enviado'],
                                        ['E', 'Enviado'],
                                        ['F', 'Encerrado'],
                                        ['C', 'Cancelado']
                                    ] : [
                                        ['N', 'Não Faturado'],
                                        ['F', 'Faturado'],
                                        ['C', 'Cancelado'],
                                        ['D', 'Denegada']
                                    ],
                                    bind: {
                                        fieldStyle: '{isCancelado ? "color:red" : isDenegado ? "color:purple" : isRecusado ? "color:purple" : isDevolvido ? "color:purple" : "color:green"}',
                                        value: '{model.' + cfg.tipo + '_STATUS}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    reference: 'codigoBarras',
                                    fieldLabel: 'Código de Barras',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.' + cfg.tipo + '_NFE}'
                                    }
                                },
                                {
                                    width: 238,
                                    reference: 'protocolo',
                                    fieldLabel: 'Protocolo',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.' + cfg.tipo + '_PROTOCOLO}'
                                    }
                                },
                                {
                                    width: 122,
                                    reference: 'hora',
                                    fieldLabel: 'Hora',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.' + cfg.tipo + '_HORA}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'textarea',
                                    height: 250,
                                    fieldStyle: {
                                        whiteSpace: 'pre',
                                        fontFamily: 'monospace'
                                    },
                                    flex: 1,
                                    fieldLabel: 'Reposta TXT',
                                    disableCase: true,
                                    readOnly: true,
                                    bind: {
                                        value: '{respostaTxt}'
                                    }
                                },
                                {
                                    xtype: 'textarea',
                                    disableCase: true,
                                    fieldStyle: {
                                        whiteSpace: 'pre',
                                        color: 'blue',
                                        fontStyle: 'italic'
                                    },
                                    flex: 1,
                                    height: 250,
                                    fieldLabel: 'Resposta XML',
                                    readOnly: true,
                                    bind: {
                                        value: '{respostaXml}'
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

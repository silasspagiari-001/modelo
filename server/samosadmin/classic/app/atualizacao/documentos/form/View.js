Ext.define('SamosAdmin.atualizacao.documentos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formdocumentos',

    title: 'Documento',

    requires: [
        'SamosAdmin.atualizacao.documentos.form.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    formgroups: [
        {
            title: 'Dados Básicos',
            items: [
                {
                    items: [
                        {
                            flex: false,
                            width: 80,
                            fieldLabel: 'Código',
                            reference: 'codigo',
                            bind: {
                                value: '{modelId}'
                            },
                            ui: 'field-readonly',
                            fieldStyle: 'text-align:right;',
                            readOnly: true,

                        },
                        {
                            width: 67,
                            flex: false,
                            fieldLabel: 'Status',
                            reference: 'status',
                            bind: {
                                value: '{model.DOCUMENTOS_STATUS}',
                                readOnly: '{readOnly}'
                            },
                            xtype: 'checkbox',
                            inputValue: 'T',
                            uncheckedValue: 'F',
                            boxLabel: 'Ativo',
                            checked: true
                        },
                        {
                            flex: 1,
                            fieldLabel: 'Nome',
                            maxLength: 50,
                            reference: 'nome',
                            proximoFoco: 'pessoa',
                            bind: {
                                value: '{model.DOCUMENTOS_NOME}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            flex: 1,
                            xtype: 'samoswidgets-textsearch',
                            fieldLabel: 'Pessoa',
                            tabela: 'pessoas',
                            reference: 'pessoa',
                            proximoFoco: 'ultimo',
                            buscarPor: 'Genérica',
                            associations: [
                                ['PESSOAS_NOME',          'PESSOAS_NOME'],
                                ['DOCUMENTOS_ID_PESSOAS', 'PESSOAS_ID']
                            ],
                            bind: {
                                value: '{model.PESSOAS_NOME}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            hidden: true,
                            bind: {
                                value: '{model.DOCUMENTOS_ID_PESSOAS}'
                            }
                        },
                        {
                            xtype: 'numberfield',
                            flex: false,
                            width: 150,
                            fieldLabel: 'Ultimo',
                            reference: 'ultimo',
                            proximoFoco: 'serie',
                            emptyText: '0',
                            hideTrigger: true,
                            allowDecimals: false,
                            fieldStyle: 'text-align: right;',
                            minValue: 0,
                            maxLength: 6,
                            bind: {
                                value: '{model.DOCUMENTOS_ULTIMO}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            flex: false,
                            width: 150,
                            fieldLabel: 'Série',
                            reference: 'serie',
                            proximoFoco: 'operacao',
                            maxLength: 3,
                            bind: {
                                value: '{model.DOCUMENTOS_SERIE}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            hidden: true,
                            bind: {
                                value: '{model.DOCUMENTOS_ID_EMPRESAS}'
                            }
                        }
                    ]
                },
                {
                    items: [
                        {
                            width: 148,
                            flex: false,
                            xtype: 'samoswidgets-textsearch',
                            fieldLabel: 'Operação',
                            tabela: 'operacoes',
                            reference: 'operacao',
                            proximoFoco: 'aplicacao',
                            buscarPor: 'Código',
                            permitirApenasNumeros: true,
                            associations: [
                                ['DOCUMENTOS_ID_OPERACOES', 'OPERACOES_ID'],
                                ['OPERACOES_NOME',          'OPERACOES_NOME']
                            ],
                            bind: {
                                value: '{model.DOCUMENTOS_ID_OPERACOES}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            flex: 1,
                            reference: 'nomeoperacao',
                            proximoFoco: 'serie',
                            fieldLabel: 'Descrição',
                            ui: 'field-readonly',
                            readOnly: true,
                            bind: {
                                value: '{model.OPERACOES_NOME}'
                            }
                        },
                        {
                            width: 148,
                            flex: false,
                            xtype: 'samoswidgets-textsearch',
                            fieldLabel: 'Aplicação',
                            tabela: 'aplicacoes',
                            reference: 'aplicacao',
                            buscarPor: 'Código',
                            proximoFoco: 'layout',
                            permitirApenasNumeros: true,
                            associations: [
                                ['DOCUMENTOS_ID_APLICACOES', 'APLICACOES_ID'],
                                ['APLICACOES_NOME',          'APLICACOES_NOME']
                            ],
                            bind: {
                                value: '{model.DOCUMENTOS_ID_APLICACOES}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            flex: 1,
                            reference: 'nomeaplicacao',
                            proximoFoco: 'serie',
                            fieldLabel: 'Nome da Aplicação',
                            ui: 'field-readonly',
                            readOnly: true,
                            bind: {
                                value: '{model.APLICACOES_NOME}'
                            }
                        },
                        {
                            flex: false,
                            width: 150,
                            xtype: 'samoswidgets-textlower',                            
                            reference: 'layout',
                            fieldLabel: 'Layout',
                            bind: {
                                value: '{model.DOCUMENTOS_LAYOUT}',
                                readOnly: '{readOnly}'
                            }
                        }
                    ]
                },
                {
                    items: [
                        {
                            flex: 1,
                            xtype: 'combobox',
                            editable: false,
                            fieldLabel: 'Desconto',
                            reference: 'descontoporitem',
                            displayField: 'field2',
                            store: [
                                ['F', 'Cabeçalho'],
                                ['T', 'Itens'],
                                ['A', 'Cabecalho/Itens']
                            ],

                            bind: {
                                value: '{model.DOCUMENTOS_DESCONTOITEM}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            flex: false,
                            width: 100,
                            fieldLabel: 'Altera Preço',
                            reference: 'alterapreco',
                            bind: {
                                value: '{model.DOCUMENTOS_ALTERAPRECO}',
                                readOnly: '{readOnly}'
                            },
                            xtype: 'checkbox',
                            inputValue: 'T',
                            uncheckedValue: 'F',
                            boxLabel: 'Ativo',
                            checked: true
                        },
                        {
                            flex: false,
                            width: 120,
                            fieldLabel: 'Coletar Cartão',
                            reference: 'coletacartao',
                            bind: {
                                value: '{model.DOCUMENTOS_COLETACARTAO}',
                                readOnly: '{readOnly}'
                            },
                            xtype: 'checkbox',
                            inputValue: 'T',
                            uncheckedValue: 'F',
                            boxLabel: 'Ativo',
                            checked: true
                        },
                        {
                            flex: false,
                            width: 125,
                            fieldLabel: 'Coletar Cheque',
                            reference: 'coletacheque',
                            bind: {
                                value: '{model.DOCUMENTOS_COLETACHEQUE}',
                                readOnly: '{readOnly}'
                            },
                            xtype: 'checkbox',
                            inputValue: 'T',
                            uncheckedValue: 'F',
                            boxLabel: 'Ativo',
                            checked: true
                        },
                        {
                            flex: 1,
                            fieldLabel: 'Coletar Transporte',
                            reference: 'coletatransporte',
                            bind: {
                                value: '{model.DOCUMENTOS_COLETATRANSPORTE}',
                                readOnly: '{readOnly}'
                            },
                            xtype: 'checkbox',
                            inputValue: 'T',
                            uncheckedValue: 'F',
                            boxLabel: 'Ativo',
                            checked: true
                        },
                        {
                            flex: 1,
                            fieldLabel: 'Coletar Entrega',
                            reference: 'coletaentrega',
                            bind: {
                                value: '{model.DOCUMENTOS_COLETAENTREGA}',
                                readOnly: '{readOnly}'
                            },
                            xtype: 'checkbox',
                            inputValue: 'T',
                            uncheckedValue: 'F',
                            boxLabel: 'Ativo',
                            checked: true
                        },
                        {
                            flex: 1,
                            fieldLabel: 'Coletar Outro',
                            reference: 'coletaoutro',
                            bind: {
                                value: '{model.DOCUMENTOS_COLETAOUTRO}',
                                readOnly: '{readOnly}'
                            },
                            xtype: 'checkbox',
                            inputValue: 'T',
                            uncheckedValue: 'F',
                            boxLabel: 'Ativo',
                            checked: true
                        }
                    ]
                }
            ]
        }
    ]
});

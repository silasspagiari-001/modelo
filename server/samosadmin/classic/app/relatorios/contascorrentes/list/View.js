Ext.define('SamosAdmin.relatorios.contascorrentes.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatorioscontascorrenteslist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.contascorrentes.list.ViewController',
        'SamosAdmin.relatorios.contascorrentes.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function() {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    flex: 1.8,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo Relatório',
                                    reference: 'tipo',
                                    proximoFoco: 'inicio',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Relação Analítica por Aplicação'],
                                        ['2', 'Resumo Sintético por Aplicação'],
                                        ['3', 'Saldo Geral das Contas']                                        
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Inicio',
                                    reference: 'inicio',
                                    proximoFoco: 'final',
                                    flex: 1,
                                    bind: {
                                        value: '{valueInicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Final',
                                    reference: 'final',
                                    proximoFoco: 'contai',
                                    flex: 1,
                                    bind: {
                                        value: '{valueFinal}'
                                    }
                                },
                                {
                                    flex: 1.2,
                                    xtype: 'combobox',
                                    fieldLabel: 'Despesas',
                                    reference: 'despesas',
                                    proximoFoco: 'contai',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Somente despesas'],
                                        ['2', 'Tudo']
                                    ],
                                    bind: {
                                        value: '{valueDespesas}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1.8,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Conta',
                                    tabela: 'pessoas',
                                    complement: 'idcontai',
                                    reference: 'contai',
                                    proximoFoco: 'contaf',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{valueContai}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdContai',
                                    itemId: 'idcontai',
                                    bind: {
                                        value: '{valueIdContai}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'pessoas',
                                    complement: 'idcontaf',
                                    reference: 'contaf',
                                    proximoFoco: 'aplicacaoi',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{valueContaf}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdContaf',
                                    itemId: 'idcontaf',
                                    bind: {
                                        value: '{valueIdContaf}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Aplicação',
                                    tabela: 'aplicacoes',
                                    complement: 'idaplicacaoi',
                                    reference: 'aplicacaoi',
                                    proximoFoco: 'aplicacaof',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['APLICACOES_NOME', 'APLICACOES_NOME'],
                                        ['APLICACOES_ID',   'APLICACOES_ID']
                                    ],
                                    bind: {
                                        value: '{valueAplicacaoi}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdAplicacaoi',
                                    itemId: 'idaplicacaoi',
                                    bind: {
                                        value: '{valueIdAplicacaoi}'
                                    }
                                },
                                {
                                    flex: 1.2,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'aplicacoes',
                                    complement: 'idaplicacaof',
                                    reference: 'aplicacaof',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['APLICACOES_NOME', 'APLICACOES_NOME'],
                                        ['APLICACOES_ID',   'APLICACOES_ID']
                                    ],
                                    bind: {
                                        value: '{valueAplicacaof}'
                                    }
                                },
                                {
                                    hidden: true,
                                    fieldLabel: 'IdAplicacaof',
                                    itemId: 'idaplicacaof',
                                    bind: {
                                        value: '{valueIdAplicacaof}'
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

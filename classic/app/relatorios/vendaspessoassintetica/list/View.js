Ext.define('SamosAdmin.relatorios.vendaspessoassintetica.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosvendaspessoassinteticalist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.vendaspessoassintetica.list.ViewController',
        'SamosAdmin.relatorios.vendaspessoassintetica.list.ViewModel'
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
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Documento',
                                    reference: 'documento',
                                    proximoFoco: 'inicio',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Orçamento'],
                                        ['2', 'Pedido'],
                                        ['3', 'Nota Eletrônica'],
                                        ['4', 'Requisição']
                                    ],
                                    bind: {
                                        value: '{valueDocumento}'
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
                                    proximoFoco: 'usuarioi',
                                    flex: 1,
                                    bind: {
                                        value: '{valueFinal}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Pessoa',
                                    tabela: 'pessoas',
                                    complement: 'idpessoai',
                                    proximoFoco: 'idpessoaf',
                                    reference: 'pessoai',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{valuePessoai}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPessoai',
                                    itemId: 'idpessoai',
                                    bind: {
                                        value: '{valueIdPessoai}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'pessoas',
                                    complement: 'idpessoaf',
                                    reference: 'pessoaf',
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{valuePessoaf}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPessoaf',
                                    itemId: 'idpessoaf',
                                    bind: {
                                        value: '{valueIdPessoaf}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'pessoai',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    hidden: configs.getClientName() != 'prudenaco',
                                    store: [
                                        ['0', 'Todos'],
                                        ['1', 'Com NF-e'],
                                        ['2', 'Sem NF-e'],
                                        ['3', 'Baixados'],
                                        ['4', 'Abertos'],
                                        ['5', 'Sem NF-e Abertos'],
                                    ],
                                    bind: {
                                        value: '{valueStatus}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'pessoai',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    hidden: configs.getClientName() != 'herbiquimica',
                                    store: [
                                        ['0', 'Todos'],
                                        ['1', 'Faturados'],
                                        ['2', 'Não Faturados']
                                    ],
                                    bind: {
                                        value: '{valueStatus}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Vacina',
                                    reference: 'vacina',
                                    proximoFoco: 'grupoi',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Com Vacina'],
                                        ['2', 'Sem Vacina']
                                    ],
                                    bind: {
                                        hidden: '{hideVacina}',                                        
                                        value: '{valueVacina}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Vendedor',
                                    tabela: 'usuarios',
                                    complement: 'idusuario',
                                    proximoFoco: 'idusuario',
                                    reference: 'usuario',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['USUARIOS_NOME', 'USUARIOS_NOME'],
                                        ['USUARIOS_ID',   'USUARIOS_ID']
                                    ],
                                    bind: {
                                        value: '{valueUsuario}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdUsuario',
                                    itemId: 'idusuario',
                                    bind: {
                                        value: '{valueIdUsuario}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupo',
                                    reference: 'grupo',
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['GRUPOS_NOME', 'GRUPOS_NOME'],
                                        ['GRUPOS_ID',   'GRUPOS_ID']
                                    ],
                                    bind: {
                                        value: '{valueGrupo}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdGrupo',
                                    itemId: 'idgrupo',
                                    bind: {
                                        value: '{valueIdGrupo}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Só PRP',
                                    reference: 'prp',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Sim'],
                                        ['2', 'Não']
                                    ],
                                    bind: {
                                        hidden: '{hideVacina}',                                        
                                        value: '{valuePRP}'
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

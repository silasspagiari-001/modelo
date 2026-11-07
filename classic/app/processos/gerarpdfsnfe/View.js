Ext.define('SamosAdmin.processos.gerarpdfsnfe.View', {
    extend: 'SamosModule.list.View',
    xtype: 'processosgerarpdfsnfe',

    requires: [
        'SamosAdmin.processos.gerarpdfsnfe.ViewController',
        'SamosAdmin.processos.gerarpdfsnfe.ViewModel'
    ],

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    rightbuttons: [
        'Enviar Email',
        'Sair'
    ],

    hidePaging: true,
    checkSelection: true,
    selecionarPrimeiroAposBuscar: false,

    gridListeners: {
        selectionchange: 'onSelectionChange'
    },

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const status = record.get('MOVIMENTOS_STATUS');
            
            if (status == 'F') {
                return "preto";
            } else if (status == 'N' || status == 'P' || status == 'I' || status == 'S' || status == 'R') {
                return "verde";
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
            } else if (status == 'V') {
                return "lilas";
            } else if (status == 'A') {
                return "azul";
            } else {
                return "fundo-amarelo";
            }
        }
    },

    constructor: function() {
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
                    width: 125
                },
                {
                    xtype: 'datefield',
                    fieldLabel: 'Final',
                    width: 125
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
                        width: 125,
                        text: 'Status',
                        dataIndex: 'MOVIMENTOS_STATUS',
                        renderer: function(value, meta, record) {
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
                            } else if (value === 'V') {
                                return 'Devolvida';
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
                        width: 125,
                        text: 'Vendedor',
                        dataIndex: 'USUARIOS_LOGIN'
                    },
                    {
                        flex: 1,
                        text: 'Nome',
                        dataIndex: 'MOVIMENTOS_NOME'
                    },
                    {
                        flex: false,
                        width: 180,
                        text: 'Cidade',
                        dataIndex: 'CIDADES_NOME'
                    },
                    {
                        flex: false,
                        width: 50,
                        text: 'UF',
                        dataIndex: 'CIDADES_ESTADO'
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
                    xtype: 'container',
                    flex: 1
                },
                {
                    xtype: 'label',
                    width: 200,
                    padding: '10 0 0 15',
                    style: 'text-align:right;font-weight:bold;color:red;',
                    bind: {
                        text: '{totalSelecionado}'
                    }
                },
                {
                    xtype: 'label',
                    width: 200,
                    padding: '10 0 0 15',
                    style: 'text-align:right;font-weight:bold;color:black;',
                    bind: {
                        text: '{totalGeral}'
                    }
                },
                {
                    xtype: 'container',
                    width: 10,
                }
            ]  
        });

        this.callParent(arguments);
    }
});

Ext.define('SamosAdmin.movimentos.notaconsumidor.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'notaconsumidor',

    requires: [
        'SamosAdmin.movimentos.notaconsumidor.form.View',
        'SamosAdmin.movimentos.notaconsumidor.list.ViewController',
        'SamosAdmin.movimentos.notaconsumidor.list.ViewModel'
    ],

    leftbuttons: [
        'Novo'
    ],

    rightbuttons: [
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const status     = record.get('MOVIMENTOS_STATUS');
            const protocolo  = record.get('MOVIMENTOS_PROTOCOLO');  
    
            //Condição exclusiva para notas sem protocolo
            if( protocolo == '' ){
                return 'verde';
            }

            if( status == 'C') {
                return "vermelho";
            }

            if (status == 'F' && protocolo != '') {
                return "preto";
            } else if (status == 'N' || status == 'P' || status == 'I' || status == 'S' || status == 'R') {
                return "verde";
            } else if (status == 'G') {
                return "fundo-azul";
            } else if (status == 'H') {
                return "lilas";
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

    constructor: function(config){
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
                    fieldLabel: 'Status',
                    width: 150,
                    defaultValue: 3,
                    store: [
                        [1, 'Não Faturado'],
                        [2, 'Faturado'],
                        [3, 'Cancelado'],
                        [6, 'Todas']
                    ]
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ],
        
            columns: {
                items: [
                    {
                        width: 80,
                        text: 'Empresa',
                        dataIndex: 'MOVIMENTOS_ID_EMPRESAS',
                        align: 'center',
                        hidden: !configs.getMultiEmpresa()
                    },
                    {
                        width: 70,
                        text: 'N.º',
                        dataIndex: 'MOVIMENTOS_NUMERO',
                        align: 'right'
                        
                    },
                    {
                        width: 58,
                        text: 'Série',
                        dataIndex: 'MOVIMENTOS_SERIE',
                        align: 'center'
                    },
                    {
                        width: 125,
                        text: 'Status',
                        dataIndex: 'MOVIMENTOS_STATUS',
                        renderer: function(value, meta, record) {
                            if (value === 'F' || value === 'E') {
                                return 'Enviada';
                            } else if (value === 'N' || value === 'M') {
                                return 'Não Enviada';
                            } else if (value === 'C' || value === 'B') {
                                return 'Cancelada';
                            }
                        }
                    },
                    {
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
                        width: 180,
                        text: 'Cidade',
                        dataIndex: 'CIDADES_NOME'
                    },
                    {
                        width: 50,
                        text: 'UF',
                        dataIndex: 'CIDADES_ESTADO'
                    },
                    {
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
                    width: 10
                }
            ]            
        });

        this.callParent(arguments);
    }
});

Ext.define('SamosAdmin.movimentos.ordenscirurcenter.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'ordenscirurcenter',

    requires: [
        'SamosAdmin.movimentos.ordenscirurcenter.form.View',
        'SamosAdmin.movimentos.ordenscirurcenter.list.ViewController',
        'SamosAdmin.movimentos.ordenscirurcenter.list.ViewModel',
    ],

    leftbuttons: [
        'Novo',
        'Exportar'
    ],

    rightbuttons: [
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const status   = record.get('ORDENS_STATUS');

            if (status == 'N') {
                return "preto";
            } else if (status == 'E') {
                return "azul";
            } else if (status == 'F') {
                return "verde";
            }

        }
    },

    constructor: function(){
        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Numero',
                    width: 95
                },
                {
                    flex: 1,
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
                    width: 122
                },
                {
                    xtype: 'datefield',
                    fieldLabel: 'Final',
                    width: 122
                },
                {
                    fieldLabel: 'Ordem',
                    width: 135,
                    store: [
                        [0, 'Emissão'],
                        [1, 'Pessoas'],
                        [2, 'Número'],
                        [3, 'Referência']
                    ]
                },
                {
                    fieldLabel: 'Status',
                    width: 190,
                    store: configs.getOrdens().status
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
                        dataIndex: 'ORDENS_ID_EMPRESAS',
                        align: 'center',
                        hidden: !configs.getMultiEmpresa()
                    },
                    {
                        flex: false,
                        width: 60,
                        text: 'N.º',
                        dataIndex: 'ORDENS_NUMERO',
                        align: 'right'
                        
                    },                    
                    {
                        flex: false,
                        width: 58,
                        text: 'Série',
                        dataIndex: 'ORDENS_SERIE',
                        align: 'center'
                        
                    },
                    {
                        flex: false,
                        width: 100,  //149
                        text: 'Status',
                        dataIndex: 'ORDENS_STATUS',
                        renderer: function(value, meta, record) {
                            if (value === 'N') {
                                return 'Aberta';
                            } else if (value === 'E') {
                                return 'Finalizada';
                            } else if (value === 'F') {
                                return 'Ativo';
                            }
                        }
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Emissão',
                        xtype: 'datecolumn',
                        dataIndex: 'ORDENS_EMISSAO',
                        align: 'center'
                    }, 

                    {
                        flex: false,
                        width: 110,
                        text: 'Inicio Aluguel',
                        xtype: 'datecolumn',
                        dataIndex: 'ORDENS_REABERTURA',
                        align: 'center'
                    },        

                    {
                        flex: false,
                        width: 110,
                        text: 'Final Aluguel',
                        xtype: 'datecolumn',
                        dataIndex: 'ORDENS_FECHAMENTO',
                        align: 'center'
                    },        

                    {
                        flex: 1,
                        text: 'Pessoa',
                        dataIndex: 'ORDENS_NOME'
                    },
                    {
                        flex: false,
                        width: 180,
                        text: 'Cidade',
                        dataIndex: 'CIDADES_NOME'
                    },
                    {
                        flex: false,
                        width: 40,
                        text: 'Uf',
                        dataIndex: 'CIDADES_ESTADO'
                    },
                    {
                        flex: false,
                        width: 105,
                        text: 'Valor',
                        xtype: 'moneycolumn',
                        dataIndex: 'ORDENS_TOTAL',
                        align: 'right'
                    }
                 ]
            }
        });

        this.callParent(arguments);
    }
});
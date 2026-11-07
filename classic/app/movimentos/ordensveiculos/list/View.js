Ext.define('SamosAdmin.movimentos.ordensveiculos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'ordensveiculos',

    requires: [
        'SamosAdmin.movimentos.ordensveiculos.form.View',
        'SamosAdmin.movimentos.ordensveiculos.list.ViewController',
        'SamosAdmin.movimentos.ordensveiculos.list.ViewModel',
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
                return "verde";
            } else if (status == 'E') {
                return "azul";
            } else if (status == 'F') {
                return "preto";
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
                    fieldLabel: 'Tipo',
                    width: 120,
                    store: [
                        [0, 'Normal'],
                        [1, 'Retorno'],
                        [2, 'Garantia'],
                        [3, 'Orçamento'],
                        [4, 'Todos']
                    ]
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
                    width: 105,
                    store: [
                        [0, 'Emissão'],
                        [1, 'Pessoas'],
                        [2, 'Número']
                    ]
                },
                {
                    fieldLabel: 'Status',
                    width: 210,
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
                        width: 90,
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
                                return 'Executar';
                            } else if (value === 'E') {
                                return 'Executado';
                            } else if (value === 'F') {
                                return 'Faturado';
                            }
                        }
                    },
                    {
                        flex: false,
                        width: 140,
                        text: 'Usuário',
                        dataIndex: 'USUARIOS_NOME'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Emissão',
                        dataIndex: 'ORDENS_EMISSAO',
                        renderer: function(value, meta, record) {
                            return moment(value).format('DD/MM/YYYY');
                        }
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
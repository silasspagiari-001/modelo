Ext.define('SamosAdmin.movimentos.ordensproducao.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'ordensproducao',

    requires: [
        'SamosAdmin.movimentos.ordensproducao.form.View',
        'SamosAdmin.movimentos.ordensproducao.list.ViewController',
        'SamosAdmin.movimentos.ordensproducao.list.ViewModel',
        'SamosAdmin.atualizacao.lotes.list.View',
        'SamosAdmin.movimentos.ordensproducao.formulas.list.View'
    ],

    leftbuttons: [
        'Novo',
        'Lotes',
        'Fórmulas'
    ],

    rightbuttons: [
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const status = record.get('PRODUCOES_STATUS');
            
            if (status == 'A') {
                return "verde";
            } else if (status == 'C') {
                return "vermelho";
            } else {
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
                    fieldLabel: 'Produto',
                    tabela: 'produtos',
                    complement: 'idproduto',
                    reference: 'produto',
                    proximoFoco: 'inicio',
                    callbackFn: 'onBuscarClick',
                    buscarPor: 'Genérica',
                    associations: [
                        ['PRODUTOS_NOME', 'PRODUTOS_NOME'],
                        ['PRODUTOS_ID',   'PRODUTOS_ID']
                    ]           
                },        
                {
                    hidden: true,
                    fieldLabel: 'IdProduto',
                    itemId: 'idproduto'
                },
                {
                    flex: 1,
                    xtype: 'samoswidgets-textsearch',
                    fieldLabel: 'Lote',
                    tabela: 'lotes',
                    complement: 'idlote',
                    reference: 'lote',
                    proximoFoco: 'inicio',
                    callbackFn: 'onBuscarClick',
                    buscarPor: 'Genérica',
                    hidden: true,//controlado pela ordem
                    associations: [
                        ['LOTES_NOME', 'LOTES_NOME'],
                        ['LOTES_ID',   'LOTES_ID']
                    ]           
                },        
                {
                    hidden: true,
                    fieldLabel: 'IdLote',
                    itemId: 'idlote'
                },
                {
                    flex: 1,
                    xtype: 'samoswidgets-textsearch',
                    fieldLabel: 'Pessoa',
                    tabela: 'pessoas',
                    complement: 'idpessoa',
                    reference: 'pessoa',
                    proximoFoco: 'inicio',
                    callbackFn: 'onBuscarClick',
                    buscarPor: 'Genérica',
                    hidden: true,//controlado pela ordem
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
                    width: 115,
                    store: [
                        [0, 'Inclusão'],
                        [1, 'Início'],
                        [2, 'Finalizada'],
                        [3, 'Produtos'],
                        [4, 'Lotes'],
                        [5, 'Pessoas'],
                        [6, 'Número']
                    ],
                    listeners: {
                        change: 'onOrdemChange'
                    }
                },
                {
                    fieldLabel: 'Status',
                    width: 130,
                    store: [
                        [0, 'Abertas'],
                        [1, 'Finalizadas'],
                        [2, 'Canceladas'],
                        [3, 'Todas']
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
                        dataIndex: 'PRODUCOES_ID_EMPRESAS',
                        align: 'center',
                        hidden: !configs.getMultiEmpresa()
                    },
                    {
                        width: 60,
                        text: 'N.º',
                        dataIndex: 'PRODUCOES_NUMERO',
                        align: 'right'
                        
                    },                    
                    {
                        width: 58,
                        text: 'Série',
                        dataIndex: 'PRODUCOES_SERIE',
                        align: 'center'
                        
                    },
                    {
                        flex: 1,
                        text: 'Produto',
                        dataIndex: 'PRODUTOS_NOME'
                    },
                    {
                        width: 180,
                        text: 'Lote',
                        dataIndex: 'LOTES_NOME'
                    },
                    {
                        flex: 1,
                        text: 'Pessoa',
                        dataIndex: 'PESSOAS_NOME'
                    },
                    {
                        width: 100,
                        text: 'Inclusão',
                        xtype: 'datecolumn',
                        dataIndex: 'PRODUCOES_INCLUSAO',
                        align: 'center'
                    },
                    {
                        width: 100,
                        text: 'Início',
                        xtype: 'datecolumn',
                        dataIndex: 'PRODUCOES_INICIO',
                        align: 'center'
                    },
                    {
                        width: 100,
                        text: 'Finalizada',
                        xtype: 'datecolumn',
                        dataIndex: 'PRODUCOES_FINALIZADA',
                        align: 'center'
                    },
                    {
                        width: 100,
                        text: 'Status',
                        dataIndex: 'PRODUCOES_STATUS',
                        renderer: function(value) {
                            if (value === 'A') {
                                return 'Aberto';
                            } else if (value === 'F') {
                                return 'Finalizada';
                            } else if (value === 'C') {
                                return 'Cancelada';
                            }
                        }
                    }
                 ]
            }
        });

        this.callParent(arguments);
    }
});
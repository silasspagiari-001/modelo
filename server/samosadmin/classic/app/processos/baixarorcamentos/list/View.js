Ext.define('SamosAdmin.processos.baixarorcamentos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'baixarorcamentos',

    requires: [
        'SamosAdmin.processos.baixarorcamentos.list.ViewController',
        'SamosAdmin.processos.baixarorcamentos.list.ViewModel'
    ],

    rightbuttons: [
        'Sair'
    ],

    hidePaging: true,

    constructor: function(){
        Ext.apply(this, {
            toolbar: [
                {
                    flex: 1,
                    xtype: 'samoswidgets-textsearch',
                    fieldLabel: 'Produto',
                    tabela: 'produtos',
                    complement: 'idproduto',
                    reference: 'produto',
                    proximoFoco: 'inicio',
                    buscarPor: 'Genérica',
                    associations: [
                        ['PRODUTOS_NOME',       'PRODUTOS_NOME'],
                        ['PRODUTOS_ID',         'PRODUTOS_ID']
                    ],
                    listeners: {
                        focus: 'limparPesquisa'
                    }
                },        
                {
                    hidden: false,
                    bind: {
                        readOnly: true
                    },
                    width: 75,
                    fieldLabel: 'Código', //'IdProduto', //
                    fieldStyle: 'text-align:right;',
                    itemId: 'idproduto'
                },
                {
                    xtype: 'datefield',
                    proximoFoco: 'final',
                    fieldLabel: 'Inicio',
                    width: 130
                },
                {
                    xtype: 'datefield',
                    fieldLabel: 'Final',
                    width: 130
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
                        width: 100,
                        text: 'Data',
                        sortable: false,
                        xtype: 'datecolumn',
                        dataIndex: 'MOVIMENTOS_EMISSAO',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 70,
                        text: 'N.º',
                        sortable: false,
                        dataIndex: 'MOVIMENTOS_NUMERO',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 50,
                        text: 'Sér',
                        sortable: false,
                        dataIndex: 'MOVIMENTOS_SERIE',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 80,
                        text: 'Qtde',
                        sortable: false,
                        dataIndex: 'MOVIMENTOSITENS_QUANTIDADE',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 50,
                        text: 'Ba',
                        dataIndex: 'MOVIMENTOSITENS_CSTPIS',
                        align: 'left'
                    },
                    {
                        flex: 3,
                        text: 'Pessoa',
                        sortable: false,
                        dataIndex: 'MOVIMENTOS_NOME'
                    }
                ]
            },
            footPanel: [
                {
                    xtype: 'label',
                    width: 63,
                    padding: '5 0 5 15',
                    style : 'font-weight: bold; color: black;'
                },
                {
                    xtype: 'label',
                    flex: 1.8,
                    padding: '5 0 5 15',
                    style : 'font-weight: bold; color: black;'
                },
                {
                    xtype: 'container',
                    flex: 1
                }
            ]
        });

        this.callParent(arguments);            
    }
});

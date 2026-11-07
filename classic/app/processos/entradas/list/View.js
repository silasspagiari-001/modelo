Ext.define('SamosAdmin.processos.entradas.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'processosentradas',

    requires: [
        'SamosAdmin.processos.entradas.form.View',
        'SamosAdmin.processos.entradas.list.ViewController',
        'SamosAdmin.processos.entradas.list.ViewModel'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function(){
        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Numero',
                    flex: false,
                    width: 100
                },
                {
                    flex: 2,
                    xtype: 'samoswidgets-textsearch',
                    fieldLabel: 'Pessoa',
                    tabela: 'pessoas',
                    complement: 'idpessoa',
                    reference: 'pessoa',
                    proximoFoco: 'lote',
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
                    flex: 2,
                    xtype: 'samoswidgets-textsearch',
                    fieldLabel: 'Lote',
                    tabela: 'lotes',
                    complement: 'idlote',
                    reference: 'lote',
                    proximoFoco: 'inicio',
                    ignoreNotFound: true,
                    callbackFn: 'onBuscarClick',                    
                    buscarPor: 'Genérica',
                    associations: [
                        ['LOTES_REFERENCIA', 'LOTES_REFERENCIA'],
                        ['LOTES_ID',         'LOTES_ID']
                    ]           
                },        
                {
                    hidden: true,
                    fieldLabel: 'IdLote',
                    itemId: 'idlote'
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
                    fieldLabel: 'Ordem',
                    width: 150,
                    store: [
                        [0, 'Emissão'],
                        [1, 'Pessoas'],
                        [2, 'Número'],
                        [3, 'Entrada/Saída']
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
                        flex: false,
                        width: 70,
                        text: 'N.º',
                        dataIndex: 'MOVIMENTOS_NUMERO',
                        align: 'right'
                        
                    },
                    {
                        flex: false,
                        width: 55,
                        text: 'Sér',
                        dataIndex: 'MOVIMENTOS_SERIE',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Emissão',
                        xtype: 'datecolumn',
                        dataIndex: 'MOVIMENTOS_EMISSAO',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 70,
                        text: 'Cód',
                        dataIndex: 'MOVIMENTOSITENS_ID_PRODUTOS',
                        align: 'right'
                    },
                    {
                        flex: 1,
                        text: 'Nome do Produto',
                        dataIndex: 'PRODUTOS_NOME',
                        align: 'left'
                    },
                    {
                        flex: 0.2,
                        text: 'Uni',
                        dataIndex: 'PRODUTOS_UNIDADE',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 80,
                        text: 'Qtde',
                        dataIndex: 'MOVIMENTOSITENS_QUANTIDADE',
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
                        text: '{nomePessoa}'
                    }
                },
                {
                    xtype: 'container',
                    width: 10,
                    flex: false // 0.2
                }
            ]

        });

        this.callParent(arguments);
    }
});

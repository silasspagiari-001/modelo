Ext.define('SamosAdmin.atualizacao.grupos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'grupos',

    requires: [
        'SamosAdmin.atualizacao.grupos.form.View',
        'SamosAdmin.atualizacao.grupos.list.ViewController',
        'SamosAdmin.atualizacao.grupos.list.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Imprimir'        
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function(){
        Ext.apply(this, {

            toolbar: [
                {
                    fieldLabel: 'Conteúdo',
                    flex: 3
                },
                {
                    fieldLabel: 'Ordem',
                    width: 135,
                    store: [
                        [0, 'Nome'],
                        [1, 'Contéudo'],
                        [2, 'Código']
                    ]
                },
                {
                    fieldLabel: 'Status',
                    width: 135,
                    store: [
                        [0, 'Ativos'],
                        [1, 'Inativos'],
                        [2, 'Todos']
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
                        width: 90,
                        text: 'Código',
                        dataIndex: 'GRUPOS_ID',
                        align: 'center'
                    },
                    {
                        flex: 9,
                        text: 'Nome do Grupo',
                        dataIndex: 'GRUPOS_NOME'
                    },
                    {
                        flex: false,
                        width: 105,
                        text: '%MarkUp',
                        dataIndex: 'PERCENTUAL_MARGEM',
                        xtype: 'moneycolumn',
                        hidden: !configs.getClientName() == 'prudenmoveis',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: '%M.Mín',
                        dataIndex: 'PERCENTUAL_MARGEMMINIMA',
                        xtype: 'moneycolumn',
                        hidden: configs.getClientName() != 'prudenmoveis',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 95,
                        text: '% Prazo',
                        dataIndex: 'PERCENTUAL_PRAZO',
                        xtype: 'moneycolumn',
                        hidden: configs.getClientName() != 'prudenmoveis',
                        align: 'right'
                    },
                    {
                        flex: false,
                        text: '%Com',
                        width: 95,
                        dataIndex: 'PERCENTUAL_COMISSAO',
                        xtype: 'moneycolumn',
                        hidden: configs.getClientName() != 'prudenmoveis',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 102,
                        text: '%Dsc Ven',
                        dataIndex: 'PERCENTUAL_DESCVEN',
                        xtype: 'moneycolumn',
                        hidden: configs.getClientName() != 'prudenmoveis',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: '%Dsc Ger',
                        dataIndex: 'PERCENTUAL_DESCVEN',
                        xtype: 'moneycolumn',
                        hidden: configs.getClientName() != 'prudenmoveis',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 102,
                        text: '%Dsc Sup',
                        dataIndex: 'PERCENTUAL_DESCSUP',
                        xtype: 'moneycolumn',
                        hidden: configs.getClientName() != 'prudenmoveis',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: '%Dsc Dir',
                        dataIndex: 'PERCENTUAL_DESCDIR',
                        xtype: 'moneycolumn',
                        hidden: configs.getClientName() != 'prudenmoveis',
                        align: 'right'
                    }
                ]
            }
        });

        this.callParent(arguments);
    }            
});

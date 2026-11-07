Ext.define('SamosAdmin.atualizacao.montagens.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'montagens',

    requires: [
        'SamosAdmin.atualizacao.montagens.form.View',
        'SamosAdmin.atualizacao.montagens.list.ViewController',
        'SamosAdmin.atualizacao.montagens.list.ViewModel'
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
                        flex: 1,
                        text: 'Código',
                        dataIndex: 'MONTAGENS_ID',
                        align: 'center'
                    },
                    {
                        flex: 9,
                        text: 'Descrição da montagem',
                        dataIndex: 'MONTAGENS_NOME'
                    },
                    {
                        flex: false,
                        width: 80,
                        text: 'Preço',
                        dataIndex: 'MONTAGENS_VALOR',
                        hidden: configs.getClientName() == 'prudenmoveis',                        
                        xtype: 'moneycolumn',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Tabela A',
                        dataIndex: 'VALOR_MONTAGEMA',
                        hidden: configs.getClientName() != 'prudenmoveis',
                        xtype: 'moneycolumn',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Tabela B',
                        dataIndex: 'VALOR_MONTAGEMB',
                        hidden: configs.getClientName() != 'prudenmoveis',
                        xtype: 'moneycolumn',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Tabela C',
                        dataIndex: 'VALOR_MONTAGEMC',
                        hidden: configs.getClientName() != 'prudenmoveis',
                        xtype: 'moneycolumn',
                        align: 'right'
                    }
                ]
            }            
        });

        this.callParent(arguments);
    }            
});

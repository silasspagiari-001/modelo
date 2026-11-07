Ext.define('SamosAdmin.atualizacao.cidades.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'cidades',

    requires: [
        'SamosAdmin.atualizacao.cidades.form.View',
        'SamosAdmin.atualizacao.cidades.list.ViewController',
        'SamosAdmin.atualizacao.cidades.list.ViewModel'
    ],

    leftbuttons: [
        'Novo'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function () {
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
                    hidden: configs.getClientName() == 'prudenmoveis',
                    store: [
                        [0, 'Ativos'],
                        [1, 'Inativos'],
                        [2, 'Todos']
                    ]
                },
                {
                    fieldLabel: 'Status',
                    width: 135,
                    hidden: configs.getClientName() != 'prudenmoveis',
                    store: [
                        [0, 'Ativos'],
                        [3, 'Promocionais'],
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
                        dataIndex: 'CIDADES_ID',
                        align: 'center'
                    },
                    {
                        flex: 7,
                        text: 'Nome do Cidade',
                        dataIndex: 'CIDADES_NOME'
                    },
                    {
                        flex: 1,
                        text: 'Estado',
                        dataIndex: 'CIDADES_ESTADO'
                    },
                    {
                        flex: 1,
                        text: 'IBGE',
                        dataIndex: 'CIDADES_IBGE'
                    }
                ]
            }
        });
        this.callParent(arguments);
    }            
});

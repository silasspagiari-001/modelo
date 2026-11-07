Ext.define('SamosAdmin.atualizacao.custos.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'custossearch',

    requires: [
        'SamosAdmin.atualizacao.custos.search.ViewModel',
        'SamosAdmin.atualizacao.custos.search.ViewController'
    ],

    constructor: function () {
        const tema = configs.getTema();

        Ext.apply(this, {

                title: (configs.getMovimentos().labelCentroCusto || 'Centros de Custo'),

                rightbuttons: [
                    'Selecionar',
                    'Sair'
                ],

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
                            [2, 'Código'],
                            [3, 'Máscara'],
                            [4, 'Genérica']
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

                columns: [
                    {
                        text: 'Código',
                        dataIndex: 'CUSTOS_ID',
                        width: 100,
                        align: 'right'
                    },
                    {
                        text: 'Máscara',
                        dataIndex: 'CUSTOS_MASCARA',
                        width: 100,
                        align: 'center'
                    },
                    {
                        text: 'Nome ' + (configs.getMovimentos().labelCentroCusto || 'Centros de Custo'),
                        dataIndex: 'CUSTOS_NOME',
                        flex : 2
                    }
                ]            
        });
        this.callParent(arguments);
    }            
});
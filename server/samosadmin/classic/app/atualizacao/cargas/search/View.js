Ext.define('SamosAdmin.atualizacao.cargas.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'cargassearch',

    requires: [
        'SamosAdmin.atualizacao.cargas.search.ViewModel',
        'SamosAdmin.atualizacao.cargas.search.ViewController'
    ],

    constructor: function () {
        const tema = configs.getTema();

        Ext.apply(this, {

                title: 'Manifestos por placa',

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
                            [0, 'Placa'],
                            [1, 'Nome']
                        ]
                    },
                    {
                        action: 'Buscar',
                        ui: 'secondary'
                    }
                ],

                columns: [
                    {
                        text: 'Placa',
                        dataIndex: 'CARGAS_PLACAVEICULO',
                        width: 100,
                        align: 'center'
                    },
                    {
                        text: 'Uf',
                        dataIndex: 'CARGAS_PLACAUFVEICULO',
                        width: 40,
                        align: 'center'
                    },
                    {
                        text: 'Nome do Transportador',
                        dataIndex: 'CARGAS_TRANSPNOME',
                        flex: 1                        
                    },
                    {
                        text: 'Cpf/Cnpj',
                        width: 120,
                        dataIndex: 'CARGAS_TRANSPCPFCNPJ'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Data',
                        xtype: 'datecolumn',
                        dataIndex: 'CARGAS_EMISSAO',
                        align: 'center'
                    },            
                    {
                        flex: false,
                        width: 100,
                        text: 'Nº Man',
                        dataIndex: 'CARGAS_NUMERO',
                        align: 'right'
                    }        
                ]            
        });
        this.callParent(arguments);
    }            
});
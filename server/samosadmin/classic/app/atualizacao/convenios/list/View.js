Ext.define('SamosAdmin.atualizacao.convenios.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'convenios',

    requires: [
        'SamosAdmin.atualizacao.convenios.form.View',
        'SamosAdmin.atualizacao.convenios.list.ViewController',
        'SamosAdmin.atualizacao.convenios.list.ViewModel'
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
                        dataIndex: 'CONVENIOS_ID',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 100,                        
                        text: 'Tipo',
                        dataIndex: 'CONVENIOS_TIPO',
                        renderer: function(value, meta, record) {
                            if (value === 'L') {
                                return 'Local';
                           } else if (value === 'O') {
                                return 'Região 1';
                           } else if (value === 'A') {
                               return 'Região 2';
                           }
                        }
                    },
                    {
                        flex: false,
                        width: 60,
                        text: 'Sigla',
                        dataIndex: 'CONVENIOS_SIGLA',
                    },
                    {
                        flex: 1,
                        text: 'Descrição do convênio',
                        dataIndex: 'CONVENIOS_NOME'
                    }
                ]
            }
        });

        this.callParent(arguments);
    }            
});

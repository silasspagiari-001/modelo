Ext.define('SamosAdmin.atualizacao.pessoas.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'pessoas',

    requires: [
        'SamosAdmin.atualizacao.pessoas.form.View',
        'SamosAdmin.atualizacao.pessoas.list.ViewController',
        'SamosAdmin.atualizacao.pessoas.list.ViewModel'
    ],

    leftbuttons: [
        'Novo'
    ],
 
    rightbuttons: [
        'Sair'
    ],

    constructor: function() {
        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Conteúdo',
                    emptyText: '',
                    flex: 3
                },
                {
                    fieldLabel: 'Ordem',
                    width: 120,
                    store: [
                        [0, 'Nome'],
                        [1, 'Contéudo'],
                        [9, 'Fantasia'],                        
                        [2, 'Endereço'],
                        [3, 'Email'],
                        [4, 'CPF/CNPJ'],
                        [7, 'Cidade'],
                        [8, 'Telefone'],
                        [5, 'Código'],
                        [6, 'Genérica']
                    ]
                },
                {
                    fieldLabel: 'Tipo',
                    width: 175,
                    hidden: (configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor && configs.getClientName() == 'prudenmoveis'),
                    store: configs.getPessoas().tipos.concat([['0', 'Todos']])
                },
                {
                    fieldLabel: 'Categoria',
                    width: 175,
                    store: [
                        ['0', 'Contribuinte'],
                        ['1', 'Não Contribuinte'],
                        ['4', 'Produtor Rural PJ'],
                        ['2', 'Isento'],
                        ['3', 'Exportação'],
                        ['5', 'Órgão Público'],
                        ['T', 'Todos']
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
            ]
        });

        this.callParent(arguments);
    },

    columns: {
        items: [
            {
                flex: 0.8,
                text: 'Código',
                dataIndex: 'PESSOAS_ID',
                align: 'center',
                renderer: function(value, meta, record) {
                    if ((record.get('PESSOAS_PROPRIEDADES') || '').length > 0) {
                        return '(P) ' + value;
                    } else {
                        return value;
                    }
                }
            },
            {
                flex: 2.5,
                text: 'Nome',
                dataIndex: 'PESSOAS_NOME'
            },
            {
                flex: 1.2,
                xtype: 'phonecolumn',
                text: 'Telefone',
                dataIndex: 'PESSOAS_TELEFONE'
            },
            {
                flex: 1.2,
                xtype: 'phonecolumn',
                text: 'Celular',
                dataIndex: 'PESSOAS_CELULAR'
            },
            {
                flex: 1.5,
                text: 'CPF/CNPJ',
                xtype: 'cpfcnpjcolumn',
                dataIndex: 'PESSOAS_CPFCNPJ'
            },
            {
                flex: 2,
                text: 'Cidade',
                dataIndex: 'CIDADES_NOME'
            },
            {
                flex: 0.5,
                text: 'UF',
                dataIndex: 'CIDADES_ESTADO'
            }
        ]
    }
});

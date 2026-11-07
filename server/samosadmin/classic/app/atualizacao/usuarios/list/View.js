Ext.define('SamosAdmin.atualizacao.usuarios.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'usuarios',

    requires: [
        'SamosAdmin.atualizacao.usuarios.form.View',
        'SamosAdmin.atualizacao.usuarios.list.ViewController',
        'SamosAdmin.atualizacao.usuarios.list.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function() {
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
                        [1, 'Conteúdo'],
                        [2, 'Login'],
                        [3, 'CPF'],
                        [4, 'Código'],
                        [5, 'Genérica']
                    ]
                },
                {
                    fieldLabel: 'Tipo',
                    width: 172,
                    store: configs.getUsuarios().tipos.concat([['', 'Todos']])
                },
                {
                    flex: 3,
                    xtype: 'samoswidgets-textsearch',
                    fieldLabel: 'Empresa',
                    tabela: 'empresas',
                    complement: 'idempresa',
                    reference: 'empresa',
                    proximoFoco: 'inicio',
                    buscarPor: 'Genérica',
                    associations: [
                        ['EMPRESAS_FANTASIA', 'EMPRESAS_FANTASIA'],
                        ['EMPRESAS_ID',   'EMPRESAS_ID']
                    ]
                }, 
                {
                    hidden: true,
                    fieldLabel: 'IdEmpresa',
                    itemId: 'idempresa'
                },        
                {
                    fieldLabel: 'Status',
                    width: 135,
                    store: [
                        [0, 'Ativos'],
                        [1, 'Interno'],
                        [2, 'Externo'],
                        [3, 'Interno/Externo'],
                        [4, 'Inativo'],
                        [5, 'Pendente'],
                        [6, 'Todos']
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
                text: 'Código',
                dataIndex: 'USUARIOS_ID',
                width : 100,
                align: 'right'
            },
            {
                text: 'Nome',
                dataIndex: 'USUARIOS_NOME',
                flex: 20
            },
            {
                text: 'CPF/CNPJ',
                dataIndex: 'USUARIOS_CPFCNPJ',
                flex: 10
            },
            {
                text: 'Cidade',
                dataIndex: 'CIDADES_NOME',
                flex : 10
            },
            {
                text: 'Estado',
                dataIndex: 'CIDADES_ESTADO',
                flex : 3
            }
        ]
    }
});

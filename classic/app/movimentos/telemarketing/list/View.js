Ext.define('SamosAdmin.movimentos.telemarketing.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'telemarketing',

    requires: [
        'SamosAdmin.movimentos.telemarketing.form.View',
        'SamosAdmin.movimentos.telemarketing.list.ViewController',
        'SamosAdmin.movimentos.telemarketing.list.ViewModel'
    ],

    rightbuttons: [
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Ordem',
            width: 160,
            store: [
                [0, 'Programados'],
                [4, 'Realizados'],
                [1, 'Pessoas'],
                [2, 'Cidades'],
                [3, 'Aniversariantes']
            ]
        },
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Vendedor',
            tabela: 'usuarios',
            complement: 'idusuario',
            reference: 'usuario',
            proximoFoco: 'pessoa',
            ignoreNotFound: true,
            callbackFn: 'onBuscarClick',
            buscarPor: 'Genérica',
            associations: [
                ['USUARIOS_NOME', 'USUARIOS_NOME'],
                ['USUARIOS_ID',   'USUARIOS_ID']
            ]
        },
        {
            hidden: true,
            fieldLabel: 'IdUsuario',
            itemId: 'idusuario'
        },
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Pessoa',
            tabela: 'pessoas',
            complement: 'idpessoa',
            reference: 'pessoa',
            proximoFoco: 'cidade',
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
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Cidade',
            tabela: 'cidades',
            complement: 'idcidade',
            reference: 'cidade',
            proximoFoco: 'inicio',
            ignoreNotFound: true,
            callbackFn: 'onBuscarClick',
            buscarPor: 'Genérica',
            associations: [
                ['CIDADES_NOME', 'CIDADES_NOME'],
                ['CIDADES_ID',   'CIDADES_ID']
            ]
        },
        {
            hidden: true,
            fieldLabel: 'IdCidade',
            itemId: 'idcidade'
        },
        {
            fieldLabel: 'Mês',
            reference: 'aniversario',
            width: 120,
            store: Ext.Date.monthNames.map((month, index) => [index, month])
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
            action: 'Buscar',
            ui: 'secondary'
        }
    ],

    constructor: function(){
        Ext.apply(this, {
            columns: {
                items: [
                    {
                        flex: false,
                        width: 70,
                        text: 'Cód',
                        dataIndex: 'PESSOAS_ID',
                        align: 'right'
                    },
                    {
                        flex: 1.5,
                        text: 'Nome',
                        dataIndex: 'PESSOAS_NOME'
                    },
                    {
                        flex: false,
                        width: 180,
                        text: 'Cidade',
                        dataIndex: 'CIDADES_NOME'
                    },
                    {
                        flex: 0.5,
                        text: 'Vendedor',
                        dataIndex: 'USUARIOS_NOME'
                    },
                    {
                        flex: false,
                        width: 120,
                        text: 'Fone',
                        xtype: 'phonecolumn',                        
                        dataIndex: 'PESSOAS_TELEFONE'
                    },
                    {
                        flex: false,
                        width: 120,                        
                        text: 'Celular',
                        xtype: 'phonecolumn',                        
                        dataIndex: 'PESSOAS_CELULAR'
                    },
                    {
                        flex: false,
                        width: 93,
                        text: 'Nasc',
                        xtype: 'datecolumn',
                        dataIndex: 'PESSOAS_NASCIMENTO',
                        align: 'center',
                        bind: {
                            hidden: '{!isOrdemNascimento}'
                        }
                    },
                    {
                        flex: false,
                        width: 75,
                        text: 'GRCs',  // Gestão de Relacionamento com Cliente
                        dataIndex: 'TELEMARKETING_REGISTROS',
                        align: 'right'
                    }
                ]
            }           
        });

        this.callParent(arguments);
    }
});

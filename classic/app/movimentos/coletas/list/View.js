Ext.define('SamosAdmin.movimentos.coletas.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'coletas',

    requires: [
        'SamosAdmin.movimentos.coletas.form.View',
        'SamosAdmin.movimentos.coletas.list.ViewController',
        'SamosAdmin.movimentos.coletas.list.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Imprimir'        
    ],

    rightbuttons: [
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Ordem',
            width: 160,
            store: [
                [0, 'Fornecedor'],
                [1, 'Transportador'],
                [2, 'Cliente'],
                [3, 'Emissão'],
                [4, 'Saída']
            ]
        },
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Transportador',
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
            fieldLabel: 'Fornecedor',
            tabela: 'pessoas',
            complement: 'idfornecedor',
            reference: 'fornecedor',
            proximoFoco: 'destinatario',
            ignoreNotFound: true,
            callbackFn: 'onBuscarClick',
            buscarPor: 'Genérica',
            associations: [
                ['FORNECEDOR_NOME', 'PESSOAS_NOME'],
                ['FORNECEDOR_ID',   'PESSOAS_ID']
            ]           
        },        
        {
            hidden: true,
            fieldLabel: 'IdFornecedor',
            itemId: 'idfornecedor'
        },
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Cliente',
            tabela: 'pessoas',
            complement: 'idcliente',
            reference: 'cliente',
            proximoFoco: 'inicio',
            ignoreNotFound: true,
            callbackFn: 'onBuscarClick',
            buscarPor: 'Genérica',
            associations: [
                ['CLIENTE_NOME', 'PESSOAS_NOME'],
                ['CLIENTE_ID',   'PESSOAS_ID']
            ]           
        },        
        {
            hidden: true,
            fieldLabel: 'IdCliente',
            itemId: 'idcliente'
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
                        width: 90,
                        text: 'Coleta',
                        dataIndex: 'COLETAS_NUMERO',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Agendada',
                        xtype: 'datecolumn',
                        dataIndex: 'COLETAS_AGENDA',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 80,
                        text: 'Hora',
                        dataIndex: 'COLETAS_HORAAGENDA', 
                        align: 'center'
                    },            
                    {
                        flex: 1,
                        text: 'Fornecedor',
                        dataIndex: 'FORNECEDOR_NOME'
                    },
                    {
                        flex: 1,
                        text: 'Cliente',
                        dataIndex: 'CLIENTE_NOME'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Volumes',
                        dataIndex: 'COLETAS_QUANTIDADE',
                        align: 'right'                        
                    },
                    {
                        flex: false,
                        width: 120,
                        text: 'Espécie',
                        dataIndex: 'COLETAS_ESPECIE'
                    }
                ]
            }           
        });

        this.callParent(arguments);
    }
});

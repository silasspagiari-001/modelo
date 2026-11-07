Ext.define('SamosAdmin.consultas.logsusuarios.View', {
    extend: 'SamosModule.list.View',
    xtype: 'logsusuarios',

    requires: [
        'SamosAdmin.consultas.logsusuarios.ViewController',
        'SamosAdmin.consultas.logsusuarios.ViewModel'
    ],

    rightbuttons: [
        'Sair'
    ],

    toolbar: [
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Usuário',
            tabela: 'usuarios',
            complement: 'idusuario',
            reference: 'usuario',
            proximoFoco: 'inicio',
            buscarPor: 'Genérica',
            associations: [
                ['USUARIOS_NOME', 'USUARIOS_NOME'],
                ['USUARIOS_ID',   'USUARIOS_ID']
            ],
            listeners: {
                focus: 'limparPesquisa'
            }
        },        
        {
            hidden: true,
            fieldLabel: 'IdUsuario',
            itemId: 'idusuario'
        },
        {
            xtype: 'datefield',
            proximoFoco: 'final',
            fieldLabel: 'Inicio',
            width: 130
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Final',
            width: 130
        },
        {
            fieldLabel: 'Tipo',
            width: 100,
            store: [
                ['P', 'Ponto'],
                ['L', 'Login'],
                ['I', 'Inutilização'],
                ['',  'Todos']
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            if(record.get('LOGS_STATUS') == 'L') {
                if(!record.get('LOGS_LOGOUT')) {
                    return "verde";
                } else {
                    return "preto";
                }
            } else {
                return "preto";
            }
        }
    },

    columns: {
        items: [
            {
                width: 95,
                text: 'Data',
                xtype: 'datecolumn',
                dataIndex: 'LOGS_DATA',
                align: 'center'
            },
            {
                width: 75,
                text: 'Hora',
                dataIndex: 'LOGS_HORA',
                align: 'center',
                bind: {
                    hidden: '{valueTipo == "L"}'
                }
            },
            {
                width: 75,
                text: 'Login',
                dataIndex: 'LOGS_HORA',
                align: 'center',
                bind: {
                    hidden: '{valueTipo != "L"}'
                }
            },
            {
                width: 75,
                text: 'Logout',
                dataIndex: 'LOGS_LOGOUT',
                align: 'center',
                bind: {
                    hidden: '{valueTipo != "L"}'
                }
            },
            {
                width: 130,
                text: 'Usuário',
                dataIndex: 'USUARIOS_LOGIN'
            },
            {
                flex: 1,
                text: 'Descrição',
                dataIndex: 'LOGS_NOME'
            },
            {
                width: 200,
                text: 'Empresa Logada',
                dataIndex: 'EMPRESAS_FANTASIA'
            }
         ]
    }
});

Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'romaneiosconstrucao',

    requires: [
        'SamosAdmin.movimentos.romaneiosconstrucao.form.View',
        'SamosAdmin.movimentos.romaneiosconstrucao.list.ViewController',
        'SamosAdmin.movimentos.romaneiosconstrucao.list.ViewModel',
        'SamosAdmin.consultas.pendenciasromaneioconstrucao.list.View'        
    ],

    leftbuttons: [
        'Novo',
        'Pendências'
    ],

    rightbuttons: [
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Numero',
            flex: false,
            width: 75
        },
        {
            flex: false,
            width: 245,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Pessoa',
            tabela: 'pessoas',
            complement: 'idpessoa',
            reference: 'pessoa',
            proximoFoco: 'inicio',
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
            xtype: 'datefield',
            fieldLabel: 'Inicio',
            width: 130
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Final',
            width: 130
        },
        {
            fieldLabel: 'Ordem',
            width: 115,
            store: [
                [0, 'Emissão'],
                [1, 'Pessoa'],
                [2, 'Número']

            ]
        },
        {
            fieldLabel: 'Status',
            width: 210,
            store: [
                [0, 'Imediata - A Entregar'],
                [1, 'Imediata - Entregue'],
                [2, 'Retirar - A Entregar'],
                [3, 'Retirar - Entregue'],
                [4, 'Todos']
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],
    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            const status = record.get('ROMANEIOS_STATUS');

            if (status == 'E') {
                return "entregue";
            } else if (status == 'N') {
                return "entregar";
            }
        }
    },
    columns: {
        items: [
            {
                flex: false,
                width: 100,
                text: 'Empresa',
                dataIndex: 'ROMANEIOS_ID_EMPRESAS',
                align: 'right'
                
            },
            {
                flex: false,
                width: 70,
                text: 'N.º',
                dataIndex: 'ROMANEIOS_NUMERO',
                align: 'right'
                
            },
            {
                flex: false,
                width: 58,
                text: 'Série',
                dataIndex: 'ROMANEIOS_SERIE',
                align: 'center'
            },
            {
                flex: false,
                width: 85,
                text: 'Pedido',
                dataIndex: 'MOVIMENTOS_NUMERO',
                align: 'right'
                
            },
            {
                flex: false,
                width: 58,
                text: 'Série',
                dataIndex: 'MOVIMENTOS_SERIE',
                align: 'center'
            },

            {
                flex: false,
                width: 95,
                text: 'Emissão',
                xtype: 'datecolumn',
                dataIndex: 'ROMANEIOS_EMISSAO',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Nome',
                dataIndex: 'MOVIMENTOS_NOME'
            },
            {
                flex: false,
                width: 150,
                xtype: 'cpfcnpjcolumn',
                text: 'CPF/CNPJ',
                dataIndex: 'MOVIMENTOS_CPFCNPJ'
            }
         ]
    }
});

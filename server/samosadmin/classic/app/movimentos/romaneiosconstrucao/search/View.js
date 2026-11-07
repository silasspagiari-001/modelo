Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'romaneiosconstrucaosearch',

    requires: [
        'SamosAdmin.movimentos.romaneiosconstrucao.search.ViewModel',
        'SamosAdmin.movimentos.romaneiosconstrucao.search.ViewController'
    ],

    rightbuttons: [
        'Selecionar',
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Numero',
            flex: 1
        },
        {
            flex: 3,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Transporte',
            tabela: 'transportes',
            complement: 'idtransporte',
            reference: 'transporte',
            proximoFoco: 'inicio',
            callbackFn: 'onBuscarClick',
            buscarPor: 'Genérica',
            associations: [
                ['TRANSPORTES_NOME', 'TRANSPORTES_NOME'],
                ['TRANSPORTES_ID',   'TRANSPORTES_ID']
            ]           
        },        
        {
            hidden: true,
            fieldLabel: 'IdTransporte',
            itemId: 'idtransporte'
        },
        {
            xtype: 'datefield',
            reference: 'datainicio',
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
            width: 135,
            store: [
                [0, 'Emissão'],
                [1, 'Transportes'],
                [2, 'Número']

            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],

    columns: [
        {
            flex: false,
            width: 90,
            text: 'N.º',
            dataIndex: 'ROMANEIOS_NUMERO',
            align: 'right'
            
        },
        {
            flex: false,
            width: 70,
            text: 'Série',
            dataIndex: 'ROMANEIOS_SERIE',
            align: 'center'
        },
        {
            flex: false,
            width: 100,
            text: 'Emissão',
            xtype: 'datecolumn',
            dataIndex: 'ROMANEIOS_EMISSAO',
            align: 'center'
        },
        {
            flex: 1,
            text: 'Nome',
            dataIndex: 'PESSOAS_NOME'
        },
        {
            flex: false,
            width: 150,
            xtype: 'cpfcnpjcolumn',
            text: 'CPF/CNPJ',
            dataIndex: 'ROMANEIOS_CPFCNPJ'
        },
        {
            flex: false,
            width: 110,
            text: 'Valor',
            xtype: 'moneycolumn',
            dataIndex: 'ROMANEIOS_TOTAL',
            align: 'right'
        }
    ]
});

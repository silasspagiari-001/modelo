Ext.define('SamosAdmin.movimentos.romaneiosmoveis.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'romaneiosmoveissearch',

    requires: [
        'SamosAdmin.movimentos.romaneiosmoveis.search.ViewModel',
        'SamosAdmin.movimentos.romaneiosmoveis.search.ViewController'
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
                [1, 'Pessoas'],
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
            dataIndex: 'PESSOAS_CPFCNPJ'
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

Ext.define('SamosAdmin.movimentos.romaneiosindustria.list.baixa.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'romaneiosindustriabaixa',

    requires: [
        'SamosAdmin.movimentos.romaneiosindustria.list.baixa.ViewModel',
        'SamosAdmin.movimentos.romaneiosindustria.list.baixa.ViewController',
        'SamosAdmin.movimentos.romaneiosindustria.list.baixa.form.View'
    ],

    title: 'Baixa por Lote',
    modelName: 'SamosAdmin.movimentos.romaneiosindustria.Model',
    checkSelection: true,
    selecionarPrimeiroAposBuscar: false,
    hidePaging: true,

    rightbuttons: [
        'Baixar',
        'Sair'
    ],

    constructor: function(config) {
        const isEntrega = config.tipo.match(/Entrega/);

        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Numero',
                    width: 50
                },
                {
                    flex: 1,
                    xtype: 'samoswidgets-textsearch',
                    fieldLabel: 'Pessoa',
                    tabela: 'pessoas',
                    complement: 'idpessoa',
                    reference: 'pessoa',
                    proximoFoco: 'inicio',
                    callbackFn: 'onBuscarClick',
                    buscarPor: 'Genérica',
                    valueTipo: isEntrega ? 'D': 'C',
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
                    width: 75,
                    text: 'N.º',
                    dataIndex: 'ROMANEIOS_NUMERO',
                    align: 'right'
                    
                },
                {
                    flex: false,
                    width: 60,
                    text: 'Série',
                    dataIndex: 'ROMANEIOS_SERIE',
                    align: 'center'
                },
                {
                    flex: false,
                    width: 55,
                    text: 'Filial',
                    dataIndex: 'ROMANEIOS_ID_EMPRESAS',
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
                    width: 100,
                    text: 'Valor',
                    xtype: 'moneycolumn',
                    dataIndex: 'ROMANEIOS_TOTAL',
                    align: 'right'
                }
            ]
        });

        this.callParent(arguments);
    }
});

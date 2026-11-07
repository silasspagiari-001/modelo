Ext.define('SamosAdmin.atualizacao.ceps.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'cepssearch',

    requires: [
        'SamosAdmin.atualizacao.ceps.search.ViewModel',
        'SamosAdmin.atualizacao.ceps.search.ViewController'
    ],

    title: 'CEPS',

    rightbuttons: [
        'Selecionar',
        'Sair'
    ],

    hidePaging: true,

    constructor: function() {
        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Conteúdo',
                    flex: 3
                },
                {
                    fieldLabel: 'Cidade',
                    flex: 2.5
                },
                {
                    fieldLabel: 'Estado',
                    width: 63,
                    store: Object.keys(SamosUtils.Info.getEstados())
                },
                {
                    fieldLabel: 'Ordem',
                    width: 108,
                    store: [
                        [0, 'CEP'],
                        [1, 'Endereço']
                    ],
                    listeners: { 
                        change  : 'onChangeOrdem',
                        collapse: 'onCollapseCombo'
                    }
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ],

            columns: [
                {
                    text: 'Endereço',
                    dataIndex: 'CEPS_ENDERECO',
                    flex: 1
                },
                {
                    text: 'UF',
                    dataIndex: 'CEPS_ESTADO',
                    width: 80
                },
                {
                    text: 'CEP',
                    dataIndex: 'CEPS_CEP',
                    width: 120
                }
            ],

            footPanel: [
                {
                    xtype: 'label',
                    height: 23,
                    flex: 1,
                    padding: '0 0 0 15',
                    style : 'font-weight:bold; color:blue;',
                    bind: {
                        text: 'CIDADE: {gridcepssearch.selection.CEPS_CIDADE}'
                    }
                },
                {
                    xtype: 'label',
                    flex: 1,
                    padding: '0 0 0 15',
                    style : 'font-weight:bold; color:blue;',
                    bind: {
                        text: 'BAIRRO: {gridcepssearch.selection.CEPS_BAIRRO}'
                    }
                }
            ]
        });

        this.callParent(arguments)
    }
});

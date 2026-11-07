Ext.define('SamosAdmin.movimentos.ordenssky.list.sincronizaros.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'ordensskylistsincronizaros',

    requires: [
        'SamosAdmin.movimentos.ordenssky.list.sincronizaros.ViewModel',
        'SamosAdmin.movimentos.ordenssky.list.sincronizaros.ViewController'
    ],

    title: 'Sincronizar OS',

    controller: 'ordensskylistsincronizaros',
    viewModel: 'ordensskylistsincronizaros',

    width: 350,
    height: 285,

    leftbuttons: [
        {
            action: 'Sincronizar',
            ui: 'primary-blue'
        }
    ],

    rightbuttons: [
        'Sair'
    ],

    initComponent: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                /*{
                                    fieldLabel: 'Números OS (Separados por vírgula)',
                                    reference: 'numeros',
                                    flex: 1,
                                    bind: {
                                        value: '{numerosOS}'
                                    }
                                },*/
                                {
                                    xtype: 'textarea',
                                    reference: 'numeros',
                                    fieldLabel: 'Números OS',
                                    //maxLength: 100,
                                    bind: {
                                        value: '{numerosOS}'
                                    },
                                    height: 160,
                                    grow  : true,
                                    width : '100%',
                                    listeners: {
                                        change: 'onKeyUpNumeros'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }
});

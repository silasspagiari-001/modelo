Ext.define('SamosAdmin.movimentos.movimento.form.docsvinculados.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentosdocsvinculados',

    requires: [
        'SamosAdmin.movimentos.movimento.form.docsvinculados.ViewModel',
        'SamosAdmin.movimentos.movimento.form.docsvinculados.ViewController'
    ],

    title: 'Documentos Vinculados',
    hidePaging: true,
    width: 800,
    height: 325,

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Confirmar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    defaults: {
                        defaults: {
                            flex: false,
                            width: 132
                        }
                    },
                    items: [
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-textlist',
                                    flex: 1,
                                    height: 190,
                                    lines: 10,
                                    maxLength: 50,
                                    reference: 'referente',
                                    proximoFoco: 'confirmar',
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_REFERENTE}',
                                        readOnly: '{readOnly}'
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

Ext.define('SamosAdmin.faleconosco.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'faleconoscoform',

    requires: [
        'SamosAdmin.faleconosco.form.ViewModel',
        'SamosAdmin.faleconosco.form.ViewController'
    ],

    rightbuttons: [
        'Enviar',
        'Cancelar'
    ],

    formgroups: [
        {
            items: [
                {
                    items: [
                        {
                            flex: 1,
                            fieldLabel: 'Nome',
                            allowBlank: false,
                            bind: {
                                value: '{nome}'
                            }
                        },
                        {
                            flex: 0.7,
                            fieldLabel: 'Cidade',
                            allowBlank: false,
                            bind: {
                                value: '{cidade}'
                            }
                        }
                    ]
                },
                {
                    items: [
                        {
                            flex: 1,
                            fieldLabel: 'Email',
                            vtype: 'email',
                            xtype: 'samoswidgets-textlower',
                            allowBlank: false,
                            listeners: {
                                change: function (txt, nv) {
                                    txt.setValue(nv.toLowerCase());
                                }
                            },
                            bind: {
                                value: '{email}'
                            }
                        },
                        {
                            flex: 0.7,
                            fieldLabel: 'Telefone / Celular',
                            reference: 'telefone',
                            bind: {
                                value: '{telefone}'
                            }
                        }
                    ]
                },
                {
                    items: [
                        {
                            xtype: 'textarea',
                            height: 190,
                            flex: 1,
                            fieldLabel: 'Mensagem',
                            allowBlank: false,
                            grow: true,
                            bind: {
                                value: '{mensagem}'
                            }
                        }
                    ]
                }
            ]
        }
    ]
});

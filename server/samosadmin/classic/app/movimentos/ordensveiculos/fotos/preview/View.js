Ext.define('SamosAdmin.movimentos.ordensveiculos.fotos.preview.View', {
    extend: 'Ext.window.Window',
    xtype: 'previewfotoordensveiculos',

    requires: [
        'SamosAdmin.movimentos.ordensveiculos.fotos.preview.ViewModel',
        'SamosAdmin.movimentos.ordensveiculos.fotos.preview.ViewController'
    ],

    mixins: [
        'SamosWidgets.container.Smart'
    ],

    title: 'Visualização da foto',
    autoShow: true,
    width: 530,
    height: 470,

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    rightbuttons: [
        'Sair'
    ],

    viewModel: 'previewfotoordensveiculos',
    controller: 'previewfotoordensveiculos',

    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'image',
                            reference: 'imagempreview',
                            width: 400,
                            height: 400
                        }
                    ]
                }
            ]

        });

        this.callParent(arguments);
        this.addButtons();
        this.addFormGroups();
    }
});

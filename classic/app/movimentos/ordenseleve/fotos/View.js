Ext.define('SamosAdmin.movimentos.ordenseleve.fotos.View', {
    extend: 'Ext.window.Window',
    xtype: 'fotosordenseleve',

    requires: [
        'SamosAdmin.movimentos.ordenseleve.fotos.ViewModel',
        'SamosAdmin.movimentos.ordenseleve.fotos.ViewController'
    ],

    mixins: [
        'SamosWidgets.container.Smart'
    ],

    title: 'Fotos',
    autoShow: true,
    width: 530,
    height: 470,

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    leftbuttons: [
        'Nova'
    ],

    rightbuttons: [
        'Visualizar',
        'Sair'
    ],

    viewModel: 'fotosordenseleve',
    controller: 'fotosordenseleve',

    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'grid',
                            flex: 1,
                            reference: 'grid' + this.xtype,
                            ui: 'panel-clean-' + configs.getTema(),
                            bind: {
                                store: '{fotos}'
                            },
                            selecionarPrimeiroAposBuscar: false,
                            columns: {
                                items: [
                                    {
                                        flex: true,
                                        text: 'Arquivo',
                                        dataIndex: 'FOTOS_NOME',
                                        align: 'center'
                                    },
                                    {
                                        flex: false,
                                        width: 120,
                                        text: 'Data',
                                        dataIndex: 'FOTOS_DATA',
                                        align: 'center',
                                        renderer: function(value){
                                            return moment(value).format('DD/MM/YYYY');
                                        }
                                    },
                                    {
                                        flex: false,
                                        width: 80,
                                        text: 'Hora',
                                        dataIndex: 'FOTOS_HORA',
                                        align: 'center'
                                    }
                                ]
                            }
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

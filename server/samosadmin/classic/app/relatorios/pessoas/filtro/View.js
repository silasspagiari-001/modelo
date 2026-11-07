Ext.define('SamosAdmin.relatorios.pessoas.filtro.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formpessoasfiltro',

    requires: [
        'SamosAdmin.relatorios.pessoas.filtro.ViewModel',
        'SamosAdmin.relatorios.pessoas.filtro.ViewController'
    ],

    title: 'Filtro Avançado',
    hidePaging: true,
    width: 800,
    height: 180,
 
    leftbuttons: [],
    
    rightbuttons: [
        'Filtrar',
        'Sair'
    ],

    constructor: function (cfg) {
        const tema = configs.getTema();

        Ext.apply(this, {
            formgroups: [
                {   
                    xtype: 'samoswidgets-defaultform',
                    padding: '10 20 10 20',
                    ui: 'formpanel-clean-' + tema,
                    items: [
                        {
                            items: [
                                {
                                    fieldLabel: 'Relacionar',                                    
                                    xtype: 'combobox',
                                    reference: 'relacionar',
                                    width: 170,
                                    store: [
                                        [0, 'Todos'],
                                        [1, 'Sem Movimento'],                        
                                        [2, 'Com Movimento']
                                    ]
                                },          
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'De',
                                    reference: 'datainicio',
                                    width: 130
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Até',
                                    reference: 'datafinal',                                    
                                    width: 130
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

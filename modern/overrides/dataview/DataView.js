Ext.define('Overrides.dataview.DataView', {
    override: 'Ext.dataview.DataView',

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    loadingText: '',

    constructor: function(config) {
        const tema = configs.getTema();

        this.callParent([ config ]);

        setTimeout(() => {
            if(this.getStore()) {
                this.getStore().on({
                    load: {
                        fn: store => {
                            if(!this.down('container')) { return; }
                            const totalPages = Math.ceil(store.totalCount / store.pageSize);
    
                            if (store.currentPage < totalPages) {
                                this.down('container').items.items[0].show();
                                this.down('container').items.items[1].hide();
                            } else {
                                this.down('container').items.items[0].hide();
                                this.down('container').items.items[1].show();
                            }
                        }, 
                        scope: this
                    }
                });
            }
        }, 500);

        if(config.mostrarMaisButton) {
            this.add({
                xtype: 'container',
                height: 35,
                layout: {
                    type: 'hbox',
                    align: 'stretch'
                },
                items: [
                    {
                        xtype: 'button',
                        reference: 'carregarmais',
                        hidden: true,
                        flex: 1,
                        text: 'Carregar mais...',
                        iconCls: 'x-fa fa-arrow-down',
                        ui: 'primary-' + tema,
                        handler: () => {
                            const store = this.getStore();
                            const totalPages = Math.ceil(store.totalCount / store.pageSize);
                            const nextPage   = store.currentPage + 1;

                            if (nextPage <= totalPages) {
                                store.nextPage({ addRecords: true });
                            }
                        }
                    },
                    {
                        xtype: 'button',
                        reference: 'fimdalista',
                        hidden: true,
                        flex: 1,
                        text: 'Fim da lista',
                        ui: 'secondary-' + tema
                    }
                ]
            });
        }
    }
});
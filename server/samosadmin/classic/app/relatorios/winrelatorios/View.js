Ext.define('SamosAdmin.relatorios.winrelatorios.View', {
    extend: 'Ext.window.Window',
    
    width: 300,
    height: 450,
    autoShow: true,
    layout: 'fit',
    closable: true,

    viewModel: {
        stores: {
            menuItems: {
                type: 'tree',
                autoLoad: true,
                data: '{dataMenuRelatorio}',
                proxy: {
                    type: 'memory'
                }
            }
        }
    },

    constructor: function() {
        Ext.apply(this, {
            items: {
                xtype: 'treelist',
                flex: 1,
                x: 0,
                y: 0,
                anchor: '+17 0',
                style: {
                    'overflow': 'auto'
                },
                expanderFirst: false,
                expanderOnly: false,
                ui: 'treelist-clean-' + configs.getTema(),
                highlightPath: true,
                width: 250,
                micro: false,
                bind: {
                    store: '{menuItems}'
                },
                listeners: {
                    itemclick: function(component, objItem){
                        const selection = objItem.item;
                        
                        if (selection && selection.getNode().childNodes.length == 0) {
                            const moduleName = selection.getNode().raw.module;
                            
                            if (SamosUtils.Info.hasClass('widget.' + moduleName)) {
                                const module = Ext.$(moduleName)[0];
                                
                                if(!module || module.title != selection.getNode().raw.text) {
                                    if (selection.getNode().data.isWindow) {
                                        Ext.create({ xtype: moduleName });
                                    } else {
                                        const tabpanel = Ext.$('samosviewport')[0].down('tabpanel');
                                        const create  = selection.getNode().data.create;
                                        const update  = selection.getNode().data.update;
                                        const destroy = selection.getNode().data.destroy;

                                        const newTab = tabpanel.add({
                                            xtype: moduleName,
                                            title: selection.getText(),
                                            permissoes: {
                                                lockNovo:    create  === false || create  === 'F',
                                                lockAlterar: update  === false || update  === 'F',
                                                lockExcluir: destroy === false || destroy === 'F'
                                            }
                                        });

                                        tabpanel.setActiveTab(newTab);

                                        setTimeout(function() {
                                            if (newTab.down('toolbar')) newTab.down('toolbar').focus()
                                        }, 500);
                                    }
                                    
                                } else {
                                    //Se tem o getView, usa o getView, caso nao, usa do view port
                                    const tabpanel = this.getView ? this.getView().down('tabpanel') : Ext.$('samosviewport')[0].down('tabpanel');
                                    tabpanel.setActiveTab(module);
                                }

                                this.up('window').destroy();
                            }
                        }
                    }
                }
            }
        });

        this.callParent(arguments);

        console.log(this.xtype);

        const dataMenuRelatorio = ((configs.getMenuRelatorios() || [])
            .find(m => m.module == this.xtype) || {})
            .children || []

        dataMenuRelatorio.forEach(m => {
            m.iconCls = 'x-fa fa-file-pdf-o';
            m.leaf = true
        });

        this.getViewModel().set('dataMenuRelatorio', dataMenuRelatorio.length ? dataMenuRelatorio : [])
    }
});

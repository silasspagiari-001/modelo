Ext.define('SamosAdminModern.menu.View', {
    extend: 'Ext.Panel',
    xtype: 'menulist',

    requires: [
        'SamosAdminModern.menu.ViewController',
        'SamosAdminModern.menu.ViewModel'
    ],

    controller: 'menulist',
    viewModel: 'menulist',
    
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    style: {
        backgroundColor: 'transparent'
    },

    initialize: function() {
        const tema = configs.getTema();

        this.callParent(arguments);

        this.setItems([
            {
                xtype: 'container',
                padding: 0,
                margin: 0,
                layout: {
                    type: 'vbox',
                    align: 'center'
                },
                items: [
                    {
                        xtype: 'container',
                        width: 280,
                        height: 360,
                        margin: '0 0 7 0',
                        padding: '0',
                        layout: 'fit',
                        items: [
                            {
                                xtype: 'list',
                                cls: `listmenu list-${tema}`,
                                margin: '0',
                                padding: '0',
                                reference: 'menulist',
                                itemTpl: '<div style="display:flex;align-items:center"><img src="resources/images/menu/{module}.png" style="heigth:30px;width:35px;margin-right:5px"><span style="width:18px" class="{module}-cls"></span><span style="margin-left:-20px">{text}</span></div>',
                                deselectable: false,
                                style: {
                                    backgroundColor: 'transparent'
                                },
                                bind: {
                                    store: '{listMenu}'
                                },
                                listeners: {
                                    itemtap: 'onMenuClick',
                                    storechange: 'onCarregarMenu'
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        width: 250,
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'button',
                                width: 100,
                                height: 25,
                                text: 'Login',
                                cls: `back-color-${tema}`,
                                style: {
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    lineHeight: '15px',
                                    color: 'black',
                                    borderRadius: '20px'
                                },
                                handler: function() {
                                    this.up('main').down('panel').setActiveItem('login');
                                    this.up('main').down('container[reference="title"]').setHtml('Login');
                                }
                            },
                            {
                                xtype: 'container',
                                flex: 1
                            },
                            {
                                xtype: 'button',
                                width: 100,
                                height: 25,
                                text: 'Sair',
                                cls: `back-color-${tema}`,
                                style: {
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    lineHeight: '15px',
                                    color: 'black',
                                    borderRadius: '20px'
                                },
                                handler: function() {
                                    window.location.reload();
                                }
                            }
                        ]
                    }
                ]
            }
        ])
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundColor='transparent';
            this.el.dom.children[0].children[0].children[0].style.backgroundColor='transparent';
        }, 100);
    }
})
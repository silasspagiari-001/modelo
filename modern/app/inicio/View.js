Ext.define('SamosAdminModern.inicio.View', {
    extend: 'Ext.Panel',
    xtype: 'inicio',
    
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
                height: 45,
                html: 'Sistema SamosAdmin',
                padding: 12,
                style: {
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold'
                }
            },
            {
                xtype: 'container',
                height: 45,
                html: 'Seja bem-vindo(a)!',
                padding: 12,
                style: {
                    textAlign: 'center',
                    fontSize: '18px'
                }
            },
            {
                xtype: 'container',
                height: 45,
                html: 'Sistema de gestão empresarial na WEB',
                padding: 12,
                style: {
                    textAlign: 'center',
                    fontSize: '14px'
                }
            },
            {
                xtype: 'container',
                padding: 12,
                layout: {
                    type: 'vbox',
                    align: 'center'
                },
                items: {
                    xtype: 'button',
                    height: 35,
                    text: 'Clique aqui para iniciar',
                    cls: `back-color-${tema}`,
                    style: {
                        textAlign: 'center',
                        color: 'black',
                        borderRadius: '20px'
                    },
                    handler: function() {
                        this.up('main').down('panel').setActiveItem('login');
                        this.up('main').down('container[reference="title"]').setHtml('Login');
                    }
                }
            },
            {
                xtype: 'container',
                height: 20,
                html : 'v.' + (Ext.manifest.version || '').split('.').slice(0,3).join('.'),
                style: {
                    fontWeight: 'thin',
                    color: '#b3b3b3',
                    textAlign: 'center'
                }
            }
        ])
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundColor='transparent';
            this.el.dom.children[0].children[0].children[0].style.backgroundColor='transparent';
        }, 100);

    }
})
Ext.define('SamosAdmin.atualizacao.permissoes.TreePanel', {
    extend: 'Ext.tree.Panel',
    xtype: 'permissoestree',

    requires: [
        'Ext.ux.CheckColumn'
    ],

    itemId: 'permissoes',
    reserveScrollbar: true,
    useArrows: true,
    rootVisible: false,
    singleExpand: true,
    viewConfig: {
        markDirty: false
    },
    columns: [
        {
            xtype: 'treecolumn',
            text: 'Módulo',
            flex: 2.5,
            sortable: true,
            dataIndex: 'text'
        },
        {
            xtype: 'checkcolumn',
            header: 'Visualizar',
            dataIndex: 'read',
            flex: 1,
            menuDisabled: true,
            renderer: function(val, m, rec) {
                val = val === 'T' ? true  :
                      val === 'F' ? false : val;

                if (rec.childNodes.length == 0) {
                    return (new Ext.ux.CheckColumn()).renderer(val);
                } else {
                    return '';
                }
            },
            listeners: {
                beforecheckchange: 'checkReadOnly'
            }
        },
        {
            xtype: 'checkcolumn',
            header: 'Inserir',
            dataIndex: 'create',
            flex: 1,
            menuDisabled: true,
            renderer: function(val, m, rec) {
                val = val === 'T' ? true  :
                      val === 'F' ? false : val;

                if (rec.childNodes.length == 0 && val !== undefined) {
                    return (new Ext.ux.CheckColumn()).renderer(val);
                } else {
                    return '';
                }
            },
            listeners: {
                beforecheckchange: 'checkReadOnly'
            }
        },
        {
            xtype: 'checkcolumn',
            header: 'Alterar',
            dataIndex: 'update',
            flex: 1,
            menuDisabled: true,
            renderer: function(val, m, rec) {
                val = val === 'T' ? true  :
                      val === 'F' ? false : val;

                if (rec.childNodes.length == 0 && val !== undefined) {
                    return (new Ext.ux.CheckColumn()).renderer(val);
                } else {
                    return '';
                }
            },
            listeners: {
                beforecheckchange: 'checkReadOnly'
            }
        },
        {
            xtype: 'checkcolumn',
            header: 'Excluir',
            dataIndex: 'destroy',
            flex: 1,
            menuDisabled: true,
            renderer: function(val, m, rec) {
                val = val === 'T' ? true  :
                      val === 'F' ? false : val;

                if (rec.childNodes.length == 0 && val !== undefined) {
                    return (new Ext.ux.CheckColumn()).renderer(val);
                } else {
                    return '';
                }
            },
            listeners: {
                beforecheckchange: 'checkReadOnly'
            }
        }
    ]
});

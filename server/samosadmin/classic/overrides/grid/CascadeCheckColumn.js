Ext.define('Ext.grid.column.CascadeCheckColumn', {
    extend: 'Ext.grid.column.CheckColumn',
    alias: 'widget.cascadecheckcolumn',

    constructor: function(config) {
        Ext.apply(config, {
            stopSelection: true,
            sortable: false,
            draggable: false,
            resizable: false,
            menuDisabled: true,
            hideable: false,
            tdCls: 'no-tip',
            defaultRenderer: this.defaultRenderer
        });

        this.callParent([config]);
        this.on('headerclick', this.onHeaderClick);
        this.on('selectall', this.onSelectAll);
    },

    onHeaderClick: function(headerCt, header, e, el) {
        var grid = headerCt.grid;

        if (!this.checked) {
            this.fireEvent('selectall', grid.getStore(), header, true);
            header.getEl().down('img').addCls(Ext.baseCSSPrefix + 'grid-checkcolumn-checked');
            this.checked = true;
        } else {
            this.fireEvent('selectall', grid.getStore(), header, false);
            header.getEl().down('img').removeCls(Ext.baseCSSPrefix + 'grid-checkcolumn-checked');
            this.checked = false;
        }
    },

    onSelectAll: function(store, column, checked) {
        store.getRootNode().cascadeBy(function(child) {
            child.set('active', checked);
        });
    }
});

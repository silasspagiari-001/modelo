Ext.define('Overrides.toolbar.Paging', {
    override: 'Ext.toolbar.Paging',
    
    displayMsg : 'Exibindo {0} - {1} | Total: {2}',
    emptyMsg : 'Nenhum registro',
    beforePageText : 'Página',
    afterPageText : 'de {0}',
    firstText : 'Primeira Página',
    prevText : 'Página Anterior',
    nextText : 'Próxima Página',
    lastText : 'Última Página',
    refreshText : 'Atualizar',
    inputItemWidth: 70,

    constructor: function() {
        this.callParent(arguments);
        this.on('change', this.selectFirst)
    },

    selectFirst: function(paging, pageData) {
        const grid = this.up('grid') ? this.up('grid') : this.up('panel[xtype^="form"]') ? this.up('panel[xtype^="form"]').down('grid') : this.up('window').down('grid');
        const store = paging.getStore();
        const items = store ? store.getData().items : undefined;
        const first = items ? items[0] : undefined;

        if (first && grid && grid.selecionarPrimeiroAposBuscar) {
            grid.selectFirst(items);
        }
    },

    getPagingItems: function() {
        var me = this,
            inputListeners = {
                scope: me,
                blur: me.onPagingBlur
            };
        
        inputListeners[Ext.supports.SpecialKeyDownRepeat ? 'keydown' : 'keypress'] = me.onPagingKeyDown;
        
        return [{
            itemId: 'first',
            tooltip: me.firstText,
            overflowText: me.firstText,
            iconCls: Ext.baseCSSPrefix + 'tbar-page-first',
            disabled: true,
            handler: me.moveFirst,
            scope: me
        },{
            itemId: 'prev',
            tooltip: me.prevText,
            overflowText: me.prevText,
            iconCls: Ext.baseCSSPrefix + 'tbar-page-prev',
            disabled: true,
            handler: me.movePrevious,
            scope: me
        },
        '-',
        me.beforePageText,
        {
            xtype: 'numberfield',
            itemId: 'inputItem',
            name: 'inputItem',
            //<override>
            flex: 0,
            //</override>
            cls: Ext.baseCSSPrefix + 'tbar-page-number',
            allowDecimals: false,
            minValue: 1,
            hideTrigger: true,
            enableKeyEvents: true,
            keyNavEnabled: false,
            selectOnFocus: true,
            submitValue: false,
            // mark it as not a field so the form will not catch it when getting fields
            isFormField: false,
            width: me.inputItemWidth,
            margin: '-1 2 3 2',
            listeners: inputListeners
        },{
            xtype: 'tbtext',
            itemId: 'afterTextItem',
            html: Ext.String.format(me.afterPageText, 1)
        },
        '-',
        {
            itemId: 'next',
            tooltip: me.nextText,
            overflowText: me.nextText,
            iconCls: Ext.baseCSSPrefix + 'tbar-page-next',
            disabled: true,
            handler: me.moveNext,
            scope: me
        },{
            itemId: 'last',
            tooltip: me.lastText,
            overflowText: me.lastText,
            iconCls: Ext.baseCSSPrefix + 'tbar-page-last',
            disabled: true,
            handler: me.moveLast,
            scope: me
        },
        '-',
        {
            itemId: 'refresh',
            tooltip: me.refreshText,
            overflowText: me.refreshText,
            iconCls: Ext.baseCSSPrefix + 'tbar-loading',
            disabled: me.store.isLoading(),
            handler: me.doRefresh,
            scope: me
        }];
    }
});

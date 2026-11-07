Ext.define('Overrides.window.Window', {
    override: 'Ext.window.Window',

    ui: 'window-clean',
    layout: 'fit',
    resizable: false,
    draggable: false,
    closable: false,
    modal: true,
    scrollable: 'vertical',
    defaultFocus: 'textfield',

    show: function (animateTarget, cb, scope) {
        this.callParent(arguments);
        //<override> call center function before  show window
        this.center();
        //</override>
    },

    center: function() {
        var me = this,
            xy,
            //<override> centering window in tabpanel viewport
            tabpanel = Ext.ComponentQuery.query('tabpanel#contentPanel')[0],
            header = Ext.ComponentQuery.query('toolbar[reference="cabecalhoPrincipal"]')[0];

        if (me.isVisible()) {
            xy = me.getAlignToXY(tabpanel ? tabpanel.getEl() : me.container, 'c-c');
            if (tabpanel) xy[1] = xy[1] - (header.getHeight() / 2);
            //</override>
            me.setPagePosition(xy);
        } else {
            me.needsCenter = true;
        }
        return me;
    },

    listeners: {
        show: function () {
            if (!this.modal) return
            var dom = Ext.dom.Query.select('.x-mask');

            for (var i = 0; i < dom.length;i++) {
                 Ext.get(dom[i]).setStyle('opacity',0.3);
            }
        },

        hide: function () {
            var dom = Ext.dom.Query.select('.x-mask'),
                wins = Ext.ComponentQuery.query('window'),
                restoreOpacity = true;

            for (var j in wins) {
                if (wins[j] && wins[j].isVisible(true)) {
                    restoreOpacity = false;
                }
            }

            if (!restoreOpacity) return

            setTimeout(function() {
                for (var i = 0; i < dom.length; i++) {
                    Ext.get(dom[i]).setStyle('opacity',1);
                }
            }, 100);
        },

        close: function () {
            var dom = Ext.dom.Query.select('.x-mask'),
                wins = Ext.ComponentQuery.query('window'),
                restoreOpacity = true;

            for (var j in wins) {
                if (wins[j] && wins[j].isVisible(true)) {
                    restoreOpacity = false;
                }
            }

            if (!restoreOpacity) return

            setTimeout(function() {
                for (var i = 0; i < dom.length; i++) {
                    Ext.get(dom[i]).setStyle('opacity',1);
                }
            }, 100);
        },

        destroy: function () {
            var dom = Ext.dom.Query.select('.x-mask'),
                wins = Ext.ComponentQuery.query('window'),
                restoreOpacity = true;

            for (var j in wins) {
                if (wins[j] && wins[j].isVisible(true)) {
                    restoreOpacity = false;
                }
            }

            if (!restoreOpacity) return

            setTimeout(function() {
                for (var i = 0; i < dom.length; i++) {
                    Ext.get(dom[i]).setStyle('opacity',1);
                }
            }, 100);
        }
    }
});

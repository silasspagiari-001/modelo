Ext.define('Overrides.tab.Panel', {
    override: 'Ext.tab.Panel',

    disableOtherTabs: function () {
        var otherTabs = this.getTabBar().items.items;

        for (var i in otherTabs) {
            if (otherTabs[i].card.xtype != this.getActiveTab().xtype) {
                otherTabs[i].disable();
            }
        }
    },

    enableAllTabs: function () {
        var tabs = this.getTabBar().items.items;

        for (var i in tabs) {
            tabs[i].enable();
        }
    }
});
Ext.define('Overrides.Component', {
    override: 'Ext.Component',

    getMainView: function () {
        return this.up('component[mainView=true]');
    },

    getMainController: function () {
        var mainView = this.getMainView();

        return mainView ? mainView.getController() : undefined;
    },

    getMainViewModel: function () {
        return this.getMainView().getViewModel();
    },

    applyTextSearches: async function() {
        await SamosUtils.Utils.sleep(200);
        const textserches = this.query('samoswidgets-textsearch');
        const textcustomserches = this.query('samoswidgets-textcustomsearch');
        const textceps = this.query('textfield[fieldLabel^=CEP]');

        const all = [...textserches, ...textcustomserches, ...textceps];
        
        return all.map(txt => {
            if(txt.setSearchedId && txt.getValue) {
                txt.setSearchedId(txt.getValue() || '')
            }

            return txt;
        });
    },

    setUi: function(newUi){
        var oldUi = this.ui,
            childNodes = this.getEl() ? Ext.DomQuery.select('[id^=' + this.getId() + '][class*=' + oldUi + ']', this.getEl().dom) : [];

        this.ui = newUi;

        Ext.each(childNodes, function(node) {
            node = Ext.fly(node);
            var classList = Ext.String.splitWords(node.getAttribute('class'));

            Ext.each(classList, function(cls) {
                if (cls.indexOf(oldUi) != -1) {
                    // We have to use the framework API here because it stores the class list in the internal data
                    // object and applies the classes from there on layout update.
                    node.replaceCls(cls, cls.replace(oldUi, newUi));
                }
            });
        });
    }
});
